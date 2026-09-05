import * as cheerio from 'cheerio';

const MIRROR_DOMAINS = [
  'https://libgen.li',
  'https://libgen.la',
  'https://libgen.gl',
  'https://libgen.vg',
];

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export const EpubResolver = {
  /**
   * Resolves ads.php and extracts fresh metadata + get.php download link
   */
  async resolveMetadataAndDownloadUrl(md5: string): Promise<{
    title: string;
    author?: string;
    publisher?: string;
    year?: number;
    isbn?: string;
    cover?: string;
    downloadUrl?: string;
  }> {
    let lastError: Error | null = null;

    for (const base of MIRROR_DOMAINS) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const adsUrl = `${base}/ads.php?md5=${md5}`;
          const res = await fetchWithTimeout(adsUrl, {
            headers: {
              'User-Agent': USER_AGENT,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cookie': 'covers=on',
            },
          });

          if (!res.ok) continue;
          const html = await res.text();

          // If database error, wait and retry
          if (html.includes('exceeded the \'max_user_connections\'') || html.includes('Could not connect to the database')) {
            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }

          // Parse BibTeX
          const bibMatch = html.match(/<textarea[^>]*id=["']bibtext["'][^>]*>([\s\S]*?)<\/textarea>/i);
          let title = '';
          let author = '';
          let publisher = '';
          let year: number | undefined;
          let isbn = '';

          if (bibMatch) {
            const bib = bibMatch[1];
            const t = bib.match(/title\s*=\s*\{([^}]+)\}/i);
            const a = bib.match(/author\s*=\s*\{([^}]+)\}/i);
            const p = bib.match(/publisher\s*=\s*\{([^}]+)\}/i);
            const y = bib.match(/year\s*=\s*\{([^}]+)\}/i);
            const is = bib.match(/isbn\s*=\s*\{([^}]+)\}/i);
            if (t) title = t[1].trim();
            if (a) author = a[1].trim();
            if (p) publisher = p[1].trim();
            if (y) year = parseInt(y[1].trim(), 10) || undefined;
            if (is) isbn = is[1].replace(/[- ]/g, '').trim();
          }

          // Fallback text parsing
          if (!title) {
            const tMatch = html.match(/Title:\s*([^<\n\r]+)/i);
            if (tMatch) title = tMatch[1].trim();
          }
          if (!author) {
            const aMatch = html.match(/Author\(s\):\s*<a[^>]*>([^<]+)<\/a>/i) || html.match(/Author\(s\):\s*([^<\n\r]+)/i);
            if (aMatch) author = aMatch[1].trim();
          }

          // Cover
          let cover: string | undefined;
          const coverMatch = html.match(/<img[^>]*src=["']([^"']*(?:covers|fictioncovers|fictionruscovers)[^"']*)["']/i);
          if (coverMatch) {
            const rawCover = coverMatch[1];
            if (!rawCover.includes('blank.png') && !rawCover.includes('logo.png')) {
              cover = rawCover.startsWith('http') ? rawCover : `${base}${rawCover.startsWith('/') ? '' : '/'}${rawCover}`;
            }
          }

          // Download link
          const getMatch = html.match(/<a[^>]*href=["'](get\.php\?[^"']*md5=[a-fA-F0-9]{32}[^"']*)["']/i);
          let downloadUrl: string | undefined;
          if (getMatch) {
            const rel = getMatch[1].replace(/&amp;/g, '&');
            downloadUrl = `${base}/${rel.startsWith('/') ? rel.slice(1) : rel}`;
          }

          return {
            title: title || `Book (${md5.slice(0, 8)})`,
            author: author || undefined,
            publisher: publisher || undefined,
            year,
            isbn: isbn || undefined,
            cover,
            downloadUrl,
          };
        } catch (err: any) {
          lastError = err;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    throw new Error(`Failed to resolve LibGen metadata for ${md5}: ${lastError?.message || 'Server unavailable'}`);
  },

  /**
   * Downloads the raw file buffer from LibGen
   */
  async downloadBookBuffer(md5: string, initialDownloadUrl?: string): Promise<Buffer> {
    let dlUrl = initialDownloadUrl;

    if (!dlUrl) {
      const meta = await this.resolveMetadataAndDownloadUrl(md5);
      dlUrl = meta.downloadUrl;
    }

    if (!dlUrl) {
      throw new Error(`No direct download URL available for book ${md5}`);
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const headers: Record<string, string> = {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        };

        if (dlUrl.includes('libgen')) {
          headers['Referer'] = dlUrl.split('/get.php')[0] + `/ads.php?md5=${md5}`;
        }

        const res = await fetchWithTimeout(dlUrl, {
          headers,
          redirect: 'follow',
        }, 30000);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} downloading book`);
        }

        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);

        // Check for valid ZIP/EPUB magic bytes (0x50, 0x4B)
        if (buf.length < 100 || buf[0] !== 0x50 || buf[1] !== 0x4B) {
          const str = buf.subarray(0, 500).toString('utf8');
          throw new Error(`Upstream returned non-zip payload: ${str.slice(0, 150)}`);
        }

        return buf;
      } catch (err: any) {
        if (attempt === 2) throw err;
        // Refresh the URL on retry because the key might have expired
        const meta = await this.resolveMetadataAndDownloadUrl(md5);
        if (meta.downloadUrl) dlUrl = meta.downloadUrl;
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
    }

    throw new Error(`Failed to download book buffer for ${md5} after 3 attempts`);
  },
};
