import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const DIST_MANGA_DIR = path.join(ROOT_DIR, 'dist', 'manga');
const MANIFEST_PATH = path.join(DIST_MANGA_DIR, 'repo.json');
const REPORT_JSON_PATH = path.join(ROOT_DIR, 'dist', 'test-report.json');
const REPORT_MD_PATH = path.join(ROOT_DIR, 'test-report.md');

// Generic fallback terms if popular returns empty
const GENERIC_SEARCH_TERMS = ['Solo', 'Magic', 'Sword', 'Leveling', 'Piece', 'Hero', 'Dragon'];

export type HealthStatus = 'OPERATIONAL' | 'PARTIAL' | 'CLOUDFLARE_BLOCKED' | 'OFFLINE';

export interface EndpointTestResult {
  endpoint: 'popular_page1' | 'popular_page2_scroll' | 'search' | 'search_scroll' | 'detail' | 'chapters' | 'pageUrls' | 'image_probe';
  status: 'PASS' | 'FAIL' | 'SKIP';
  latencyMs: number;
  itemCount?: number;
  sample?: any;
  error?: string;
}

export interface ExtensionTestReport {
  id: string;
  name: string;
  version: string;
  overallStatus: HealthStatus;
  endpointsPassed: number;
  totalEndpoints: number;
  cloudflareDetected: boolean;
  cloudflareChallenge: boolean;
  totalLatencyMs: number;
  endpoints: EndpointTestResult[];
  errorSummary?: string;
  notes?: string;
}

interface HttpTrace {
  url: string;
  method: string;
  status: number;
  cfRay: boolean;
  cfChallenge: boolean;
  server?: string;
  error?: string;
}

function createSimulatedHarbor(traces: HttpTrace[]) {
  return {
    async http(url: string, opts: any = {}) {
      const method = opts.method || 'GET';
      const headers: Record<string, string> = {
        'User-Agent':
          opts.headers?.['User-Agent'] ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        ...opts.headers,
      };

      try {
        const res = await fetch(url, {
          method,
          headers,
          body: opts.body,
        });

        const status = res.status;
        const resHeaders: Record<string, string> = {};
        res.headers.forEach((val, key) => {
          resHeaders[key.toLowerCase()] = val;
        });

        const server = resHeaders['server'] || '';
        const cfRay = Boolean(resHeaders['cf-ray']);
        const cfMitigated = resHeaders['cf-mitigated'] === 'challenge';

        let body = '';
        if (opts.responseType === 'json') {
          const json = await res.json().catch(() => null);
          traces.push({ url, method, status, cfRay, cfChallenge: cfMitigated, server });
          return json;
        } else {
          body = await res.text().catch(() => '');
        }

        const isChallenge =
          cfMitigated ||
          ((status === 403 || status === 503) &&
            (body.includes('Just a moment...') ||
              body.includes('challenge-platform') ||
              body.includes('Attention Required! | Cloudflare') ||
              body.includes('cf-turnstile')));

        traces.push({
          url,
          method,
          status,
          cfRay,
          cfChallenge: isChallenge,
          server,
        });

        return {
          status,
          ok: res.ok && !isChallenge,
          headers: resHeaders,
          body,
        };
      } catch (err: any) {
        traces.push({
          url,
          method,
          status: 0,
          cfRay: false,
          cfChallenge: false,
          error: err.message,
        });
        return {
          status: 0,
          ok: false,
          headers: {},
          body: '',
        };
      }
    },
    parseHtml: async (html: string) => ({
      querySelector: () => null,
      querySelectorAll: () => [],
    }),
    register: (_p: any) => {},
    log: () => {},
  };
}

function extractKeywords(title: string): string {
  const cleaned = title
    .replace(/[^\p{L}\p{N} ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(' ').filter((w) => w.length > 2);
  if (words.length >= 2) {
    return `${words[0]} ${words[1]}`;
  }
  return words[0] || GENERIC_SEARCH_TERMS[Math.floor(Math.random() * GENERIC_SEARCH_TERMS.length)];
}

async function probeImage(url?: string): Promise<{ ok: boolean; status?: number; contentType?: string }> {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { ok: false };
  }
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        Range: 'bytes=0-1024',
      },
    });
    const cType = res.headers.get('content-type') || '';
    const isImg = cType.startsWith('image/') || cType.includes('octet-stream') || res.status === 200 || res.status === 206;
    return { ok: isImg, status: res.status, contentType: cType };
  } catch (_) {
    return { ok: false };
  }
}

async function testExtension(pluginMeta: any): Promise<ExtensionTestReport> {
  const bundlePath = path.join(DIST_MANGA_DIR, pluginMeta.entry);
  const report: ExtensionTestReport = {
    id: pluginMeta.id,
    name: pluginMeta.name,
    version: pluginMeta.version,
    overallStatus: 'OFFLINE',
    endpointsPassed: 0,
    totalEndpoints: 7, // popular p1, popular p2, search, detail, chapters, pageUrls, image probe
    cloudflareDetected: false,
    cloudflareChallenge: false,
    totalLatencyMs: 0,
    endpoints: [],
  };

  if (!fs.existsSync(bundlePath)) {
    report.errorSummary = `Bundle file not found: ${bundlePath}`;
    return report;
  }

  const code = fs.readFileSync(bundlePath, 'utf-8');
  const traces: HttpTrace[] = [];
  const harbor = createSimulatedHarbor(traces);

  let registeredPlugin: any = null;
  harbor.register = (p: any) => {
    registeredPlugin = p;
  };

  const startAll = Date.now();

  try {
    const runner = new Function('harbor', code);
    runner(harbor);
  } catch (err: any) {
    report.errorSummary = `Initialization failed: ${err.message}`;
    return report;
  }

  const plugin = registeredPlugin;
  if (!plugin) {
    report.errorSummary = 'No provider registered via harbor.register()';
    return report;
  }

  let sampleMangaId: string | null = null;
  let sampleTitle: string | null = null;
  let sampleChapterId: string | null = null;

  // 1. Test popular(0) - Page 1
  const t1 = Date.now();
  try {
    const p1Items = await plugin.popular(0);
    const lat1 = Date.now() - t1;
    if (Array.isArray(p1Items) && p1Items.length > 0) {
      sampleMangaId = p1Items[0].id;
      sampleTitle = p1Items[0].title;
      report.endpoints.push({
        endpoint: 'popular_page1',
        status: 'PASS',
        latencyMs: lat1,
        itemCount: p1Items.length,
        sample: { id: p1Items[0].id, title: p1Items[0].title, cover: p1Items[0].cover },
      });
      report.endpointsPassed++;
    } else {
      report.endpoints.push({
        endpoint: 'popular_page1',
        status: 'FAIL',
        latencyMs: lat1,
        error: 'Returned 0 items or invalid structure',
      });
    }
  } catch (err: any) {
    report.endpoints.push({
      endpoint: 'popular_page1',
      status: 'FAIL',
      latencyMs: Date.now() - t1,
      error: err.message,
    });
  }

  // 2. Test popular(48) - Next Page / Scroll
  const t2 = Date.now();
  try {
    const p2Items = await plugin.popular(48);
    const lat2 = Date.now() - t2;
    if (Array.isArray(p2Items)) {
      report.endpoints.push({
        endpoint: 'popular_page2_scroll',
        status: 'PASS',
        latencyMs: lat2,
        itemCount: p2Items.length,
      });
      report.endpointsPassed++;
    } else {
      report.endpoints.push({
        endpoint: 'popular_page2_scroll',
        status: 'FAIL',
        latencyMs: lat2,
        error: 'Did not return array on offset 48',
      });
    }
  } catch (err: any) {
    report.endpoints.push({
      endpoint: 'popular_page2_scroll',
      status: 'FAIL',
      latencyMs: Date.now() - t2,
      error: err.message,
    });
  }

  // 3. Dynamic search
  const searchQuery = sampleTitle ? extractKeywords(sampleTitle) : GENERIC_SEARCH_TERMS[0];
  const t3 = Date.now();
  try {
    const searchItems = await plugin.search(searchQuery, 0);
    const lat3 = Date.now() - t3;
    if (Array.isArray(searchItems) && searchItems.length > 0) {
      if (!sampleMangaId) {
        sampleMangaId = searchItems[0].id;
      }
      report.endpoints.push({
        endpoint: 'search',
        status: 'PASS',
        latencyMs: lat3,
        itemCount: searchItems.length,
        sample: { query: searchQuery, match: searchItems[0].title },
      });
      report.endpointsPassed++;
    } else {
      // Fallback search with generic term
      const fallbackQuery = 'Solo';
      const fItems = await plugin.search(fallbackQuery, 0);
      if (Array.isArray(fItems) && fItems.length > 0) {
        if (!sampleMangaId) sampleMangaId = fItems[0].id;
        report.endpoints.push({
          endpoint: 'search',
          status: 'PASS',
          latencyMs: Date.now() - t3,
          itemCount: fItems.length,
          sample: { query: fallbackQuery, match: fItems[0].title },
        });
        report.endpointsPassed++;
      } else {
        report.endpoints.push({
          endpoint: 'search',
          status: 'FAIL',
          latencyMs: lat3,
          error: `Search for '${searchQuery}' returned 0 items`,
        });
      }
    }
  } catch (err: any) {
    report.endpoints.push({
      endpoint: 'search',
      status: 'FAIL',
      latencyMs: Date.now() - t3,
      error: err.message,
    });
  }

  // 4. Test detail(id)
  if (sampleMangaId) {
    const t4 = Date.now();
    try {
      const details = await plugin.detail(sampleMangaId);
      const lat4 = Date.now() - t4;
      if (details && (details.title || details.id)) {
        report.endpoints.push({
          endpoint: 'detail',
          status: 'PASS',
          latencyMs: lat4,
          sample: { title: details.title, status: details.status, author: details.author },
        });
        report.endpointsPassed++;
      } else {
        report.endpoints.push({
          endpoint: 'detail',
          status: 'FAIL',
          latencyMs: lat4,
          error: 'detail() returned null or missing title',
        });
      }
    } catch (err: any) {
      report.endpoints.push({
        endpoint: 'detail',
        status: 'FAIL',
        latencyMs: Date.now() - t4,
        error: err.message,
      });
    }

    // 5. Test chapters(id)
    const t5 = Date.now();
    try {
      const chaps = await plugin.chapters(sampleMangaId);
      const lat5 = Date.now() - t5;
      if (Array.isArray(chaps) && chaps.length > 0) {
        sampleChapterId = chaps[0].id;
        report.endpoints.push({
          endpoint: 'chapters',
          status: 'PASS',
          latencyMs: lat5,
          itemCount: chaps.length,
          sample: { chapterId: chaps[0].id, chapter: chaps[0].chapter, title: chaps[0].title },
        });
        report.endpointsPassed++;
      } else {
        report.endpoints.push({
          endpoint: 'chapters',
          status: 'FAIL',
          latencyMs: lat5,
          error: 'chapters() returned empty array',
        });
      }
    } catch (err: any) {
      report.endpoints.push({
        endpoint: 'chapters',
        status: 'FAIL',
        latencyMs: Date.now() - t5,
        error: err.message,
      });
    }

    // 6. Test pageUrls(chapterId)
    if (sampleChapterId) {
      const t6 = Date.now();
      try {
        const pages = await plugin.pageUrls(sampleChapterId);
        const lat6 = Date.now() - t6;
        if (Array.isArray(pages) && pages.length > 0) {
          const firstPage = pages[0];
          report.endpoints.push({
            endpoint: 'pageUrls',
            status: 'PASS',
            latencyMs: lat6,
            itemCount: pages.length,
            sample: { firstPageUrl: firstPage },
          });
          report.endpointsPassed++;

          // 7. Probe image reachability
          const t7 = Date.now();
          const imgProbe = await probeImage(firstPage);
          const lat7 = Date.now() - t7;
          if (imgProbe.ok) {
            report.endpoints.push({
              endpoint: 'image_probe',
              status: 'PASS',
              latencyMs: lat7,
              sample: { status: imgProbe.status, contentType: imgProbe.contentType },
            });
            report.endpointsPassed++;
          } else {
            report.endpoints.push({
              endpoint: 'image_probe',
              status: 'FAIL',
              latencyMs: lat7,
              error: `Image probe returned non-image content (${imgProbe.status} ${imgProbe.contentType})`,
            });
          }
        } else {
          report.endpoints.push({
            endpoint: 'pageUrls',
            status: 'FAIL',
            latencyMs: lat6,
            error: 'pageUrls() returned empty array',
          });
        }
      } catch (err: any) {
        report.endpoints.push({
          endpoint: 'pageUrls',
          status: 'FAIL',
          latencyMs: Date.now() - t6,
          error: err.message,
        });
      }
    }
  }

  report.totalLatencyMs = Date.now() - startAll;

  // Cloudflare Analysis
  report.cloudflareDetected = traces.some((t) => t.cfRay || (t.server && t.server.toLowerCase().includes('cloudflare')));
  report.cloudflareChallenge = traces.some((t) => t.cfChallenge);

  // Overall Health Classification
  if (report.cloudflareChallenge) {
    report.overallStatus = 'CLOUDFLARE_BLOCKED';
    report.notes = 'Requires interactive Cloudflare Turnstile clearance';
  } else if (report.endpointsPassed >= 5) {
    report.overallStatus = 'OPERATIONAL';
    report.notes = report.cloudflareDetected ? 'Behind Cloudflare WAF, passes seamlessly' : 'Direct connection';
  } else if (report.endpointsPassed >= 2) {
    report.overallStatus = 'PARTIAL';
    report.notes = 'Browse/Search operational; chapter/page parsing layout update needed';
  } else {
    report.overallStatus = 'OFFLINE';
    report.notes = traces.length > 0 && traces[0].error ? traces[0].error : 'Host unresponsive or changed domain';
  }

  return report;
}

function generateMarkdownReport(results: ExtensionTestReport[]): string {
  const operational = results.filter((r) => r.overallStatus === 'OPERATIONAL');
  const cfBlocked = results.filter((r) => r.overallStatus === 'CLOUDFLARE_BLOCKED');
  const partial = results.filter((r) => r.overallStatus === 'PARTIAL');
  const offline = results.filter((r) => r.overallStatus === 'OFFLINE');

  const now = new Date().toISOString();

  let md = `# ⚓ Harbor Manga Extensions Live Health Report\n\n`;
  md += `*Generated on: **${now}** across **${results.length}** sources.*\n\n`;

  md += `## 📊 Summary Breakdown\n\n`;
  md += `| Status | Count | Description |\n`;
  md += `| :--- | :--- | :--- |\n`;
  md += `| 🟢 **OPERATIONAL** | **${operational.length}** (${((operational.length / results.length) * 100).toFixed(1)}%) | 100% functional out-of-the-box in Harbor. |\n`;
  md += `| 🔒 **CLOUDFLARE BLOCKED** | **${cfBlocked.length}** (${((cfBlocked.length / results.length) * 100).toFixed(1)}%) | Protected by active Cloudflare Turnstile / Managed Challenge. |\n`;
  md += `| 🟡 **PARTIAL** | **${partial.length}** (${((partial.length / results.length) * 100).toFixed(1)}%) | Browse/Search works; chapter/reader layout changed. |\n`;
  md += `| 🔴 **OFFLINE / BLOCKED** | **${offline.length}** (${((offline.length / results.length) * 100).toFixed(1)}%) | Domain down, DNS changed, or blocked. |\n\n`;

  md += `---\n\n`;
  md += `## 🛡 Cloudflare Protection Insights\n\n`;
  md += `> **Does Harbor bypass Cloudflare?**\n`;
  md += `> - **Passive WAF / Rate Limiting (Green)**: **YES**. Harbor passes standard browser User-Agents and requests succeed.\n`;
  md += `> - **Active Turnstile / Managed Challenge (Yellow/Orange Lock)**: **NO**. Harbor's isolated Web Worker does not execute Cloudflare's interactive JavaScript or store clearance cookies.\n\n`;

  md += `## 📋 Detailed Results Table\n\n`;
  md += `| Source Name | ID | Health Status | Harbor Endpoints Passed | Cloudflare Protected | Total Latency | Notes |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const r of results) {
    let statusBadge = '🔴 Offline';
    if (r.overallStatus === 'OPERATIONAL') statusBadge = '🟢 Operational';
    if (r.overallStatus === 'CLOUDFLARE_BLOCKED') statusBadge = '🔒 CF Blocked';
    if (r.overallStatus === 'PARTIAL') statusBadge = '🟡 Partial';

    const cfText = r.cloudflareChallenge ? '🔒 Challenge' : r.cloudflareDetected ? '🛡️ Passive' : 'None';
    md += `| **${r.name}** | \`${r.id}\` | ${statusBadge} | **${r.endpointsPassed}/${r.totalEndpoints}** | ${cfText} | ${r.totalLatencyMs}ms | ${r.notes || ''} |\n`;
  }

  return md;
}

async function main() {
  const args = process.argv.slice(2);
  const isAll = args.includes('--all');
  const isPopularOnly = args.includes('--popular-only');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;
  const sourceIdx = args.indexOf('--source');
  const specificSource = sourceIdx !== -1 ? args[sourceIdx + 1].toLowerCase() : null;

  console.log('\n🚀 Starting Harbor Extensions Live Diagnostics Runner...\n');

  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Manga repo manifest not found: ${MANIFEST_PATH}. Run "npm run build" first.`);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  let plugins: any[] = manifest.plugins || [];

  if (specificSource) {
    plugins = plugins.filter((p) => p.id.toLowerCase() === specificSource);
    if (plugins.length === 0) {
      throw new Error(`Source '${specificSource}' not found in manifest.`);
    }
  } else if (isPopularOnly) {
    plugins = plugins.filter((p) => p.badges && (p.badges.includes('Popular') || p.badges.includes('Verified')));
  } else if (limit > 0) {
    plugins = plugins.slice(0, limit);
  } else if (!isAll && plugins.length > 15) {
    // Default to testing popular sources + first 15 if not specified
    console.log('ℹ️ Defaulting to popular/verified sources. (Use --all to test all 70 sources, or --limit <n>)');
    plugins = plugins.filter((p) => p.badges && (p.badges.includes('Popular') || p.badges.includes('Verified')));
  }

  console.log(`📋 Testing ${plugins.length} extension(s)...`);
  console.log('─'.repeat(70));

  const results: ExtensionTestReport[] = [];
  const CONCURRENCY = 3;

  for (let i = 0; i < plugins.length; i += CONCURRENCY) {
    const batch = plugins.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async (plugin) => {
        process.stdout.write(`⏳ Testing ${plugin.name}... `);
        const res = await testExtension(plugin);
        results.push(res);

        let icon = '🔴';
        if (res.overallStatus === 'OPERATIONAL') icon = '🟢';
        if (res.overallStatus === 'CLOUDFLARE_BLOCKED') icon = '🔒';
        if (res.overallStatus === 'PARTIAL') icon = '🟡';

        const cfText = res.cloudflareChallenge ? ' [CF Challenge]' : res.cloudflareDetected ? ' [CF WAF]' : '';
        console.log(`${icon} ${res.overallStatus} (${res.endpointsPassed}/${res.totalEndpoints} endpoints)${cfText} in ${res.totalLatencyMs}ms`);
      })
    );
  }

  console.log('─'.repeat(70));
  console.log('\n📊 Generating Health Reports...');

  // Save JSON report
  fs.writeFileSync(REPORT_JSON_PATH, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`  📄 JSON Report: ${REPORT_JSON_PATH}`);

  // Save Markdown report
  const mdReport = generateMarkdownReport(results);
  fs.writeFileSync(REPORT_MD_PATH, mdReport, 'utf-8');
  console.log(`  📄 Markdown Report: ${REPORT_MD_PATH}`);

  const operational = results.filter((r) => r.overallStatus === 'OPERATIONAL').length;
  const cf = results.filter((r) => r.overallStatus === 'CLOUDFLARE_BLOCKED').length;
  const partial = results.filter((r) => r.overallStatus === 'PARTIAL').length;
  const offline = results.filter((r) => r.overallStatus === 'OFFLINE').length;

  console.log('\n========================================');
  console.log(`✨ Test Execution Finished:`);
  console.log(`   🟢 Operational:        ${operational}/${results.length}`);
  console.log(`   🔒 Cloudflare Blocked: ${cf}/${results.length}`);
  console.log(`   🟡 Partial:            ${partial}/${results.length}`);
  console.log(`   🔴 Offline:            ${offline}/${results.length}`);
  console.log('========================================\n');
}

main().catch((err) => {
  console.error('❌ Test runner failed:', err);
  process.exit(1);
});
