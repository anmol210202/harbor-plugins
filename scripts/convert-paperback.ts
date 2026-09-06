import fs from 'node:fs';
import path from 'node:path';
import { generateHarborPluginBundle, SourceMeta } from '../shared/adapter/paperback-runtime.js';

const ROOT_DIR = process.cwd();
const CONFIG_FILE = path.join(ROOT_DIR, 'config', 'sources.json');
const DIST_MANGA_DIR = path.join(ROOT_DIR, 'dist', 'manga');
const PLUGINS_MANGA_DIR = path.join(ROOT_DIR, 'plugins', 'manga');

interface UpstreamSource {
  id: string;
  name: string;
  description?: string;
  version: string;
  icon?: string;
  language?: string;
  contentRating?: string;
}

interface UpstreamVersioning {
  repository: {
    name: string;
    description: string;
  };
  sources: UpstreamSource[];
}

interface Config {
  upstream: {
    repo: string;
    branch: string;
    versioningUrl: string;
    rawBaseUrl: string;
  };
  syncMode: string;
  popular: string[];
  verified: string[];
  options: {
    includeNsfw: boolean;
    maxBundleSizeMb: number;
    defaultTimeoutMs: number;
  };
}

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  lang: string;
  nsfw: boolean;
  icon?: string;
  entry: string;
  description?: string;
  badges?: string[];
}

function createMockHarbor(): { register: (p: any) => void; registered?: any; http: any; parseHtml: any; log: any } {
  const h: any = {
    http: async () => ({ status: 200, ok: true, headers: {}, body: '' }),
    parseHtml: async () => ({ querySelector: () => null, querySelectorAll: () => [] }),
    register: (p: any) => { h.registered = p; },
    log: () => {},
  };
  return h;
}

function testPlugin(code: string, id: string): boolean {
  try {
    const mockHarbor = createMockHarbor();
    const runner = new Function('harbor', code);
    runner(mockHarbor);

    const p = mockHarbor.registered;
    if (!p || !p.id || !p.name) return false;

    const req = ['popular', 'search', 'detail', 'chapters', 'pageUrls'];
    for (const m of req) {
      if (typeof p[m] !== 'function') return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Harbor-Plugin-Sync/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Harbor-Plugin-Sync/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function main() {
  console.log('🔄 Starting Automated Manga Upstream Conversion Pipeline...');

  if (!fs.existsSync(CONFIG_FILE)) {
    throw new Error(`Config file not found: ${CONFIG_FILE}`);
  }

  const config: Config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  if (!fs.existsSync(DIST_MANGA_DIR)) {
    fs.mkdirSync(DIST_MANGA_DIR, { recursive: true });
  }

  console.log(`📡 Fetching upstream registry from: ${config.upstream.versioningUrl}`);
  const versioning = await fetchJson<UpstreamVersioning>(config.upstream.versioningUrl);
  console.log(`📦 Found ${versioning.sources.length} available upstream sources.\n`);

  const popularSet = new Set(config.popular.map((s) => s.toLowerCase()));
  const verifiedSet = new Set(config.verified.map((s) => s.toLowerCase()));

  const convertedManifests: PluginManifest[] = [];
  let successCount = 0;
  let skippedCount = 0;

  // Process sources concurrently in batches of 5 to optimize network throughput
  const BATCH_SIZE = 5;
  for (let i = 0; i < versioning.sources.length; i += BATCH_SIZE) {
    const batch = versioning.sources.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (source) => {
        const sourceLower = source.id.toLowerCase();
        const isPopular = popularSet.has(sourceLower);
        const isVerified = verifiedSet.has(sourceLower);
        const isNsfw = source.contentRating === 'ADULT' || source.contentRating === 'MATURE';

        if (!config.options.includeNsfw && isNsfw) {
          skippedCount++;
          return;
        }

        const pluginId = sourceLower.replace(/[^a-z0-9-_]/g, '-');
        const bundleFileName = `${pluginId}.plugin.js`;
        const bundleUrl = `${config.upstream.rawBaseUrl}/${source.id}/index.js`;

        try {
          const rawCode = await fetchText(bundleUrl);

          const meta: SourceMeta = {
            id: pluginId,
            name: source.name || source.id,
            version: source.version || '1.0.0',
            description: source.description || `Manga source for ${source.name}`,
            icon: `${config.upstream.rawBaseUrl}/${source.id}/static/icon.png`,
            language: source.language || 'en',
            contentRating: source.contentRating,
            isPopular,
            isVerified,
          };

          const wrappedCode = generateHarborPluginBundle(rawCode, meta);
          const sizeBytes = Buffer.byteLength(wrappedCode, 'utf-8');

          if (sizeBytes > config.options.maxBundleSizeMb * 1024 * 1024) {
            console.warn(`  ⚠️ Skipping ${source.name}: exceeds max bundle size (${(sizeBytes / 1024 / 1024).toFixed(2)} MB)`);
            skippedCount++;
            return;
          }

          const isValid = testPlugin(wrappedCode, pluginId);
          if (!isValid) {
            console.warn(`  ⚠️ Skipping ${source.name}: failed Harbor compatibility validation`);
            skippedCount++;
            return;
          }

          // Write bundle file to dist/manga/
          const destPath = path.join(DIST_MANGA_DIR, bundleFileName);
          fs.writeFileSync(destPath, wrappedCode, 'utf-8');

          const badges: string[] = [];
          if (isVerified) badges.push('Verified');
          if (isPopular) badges.push('Popular');

          let badgePrefix = '';
          if (badges.length > 0) {
            badgePrefix = `[${badges.join(' | ')}] `;
          }

          convertedManifests.push({
            id: pluginId,
            name: source.name,
            version: source.version || '1.0.0',
            lang: source.language || 'en',
            nsfw: isNsfw,
            icon: meta.icon,
            entry: bundleFileName,
            description: `${badgePrefix}${source.description || 'Manga source for ' + source.name}`,
            badges: badges.length > 0 ? badges : undefined,
          });

          const badgeIndicator = badges.length > 0 ? ` [${badges.join(', ')}]` : '';
          console.log(`  ✔ Converted ${source.name} (v${source.version})${badgeIndicator} -> ${(sizeBytes / 1024).toFixed(1)} KB`);
          successCount++;
        } catch (err: any) {
          console.warn(`  ⚠️ Failed to process ${source.name}: ${err.message}`);
          skippedCount++;
        }
      })
    );
  }

  // Also include any custom manual plugins from plugins/manga/
  const manualEntries = fs.readdirSync(PLUGINS_MANGA_DIR, { withFileTypes: true });
  for (const entry of manualEntries) {
    if (!entry.isDirectory()) continue;
    const manualManifestPath = path.join(PLUGINS_MANGA_DIR, entry.name, 'manifest.json');
    if (fs.existsSync(manualManifestPath)) {
      const manualManifest = JSON.parse(fs.readFileSync(manualManifestPath, 'utf-8'));
      if (!convertedManifests.some((m) => m.id === manualManifest.id)) {
        convertedManifests.push(manualManifest);
      }
    }
  }

  // Sort manifests: Verified first, then Popular, then alphabetical
  convertedManifests.sort((a, b) => {
    const aVerified = a.badges?.includes('Verified') ? 1 : 0;
    const bVerified = b.badges?.includes('Verified') ? 1 : 0;
    if (bVerified !== aVerified) return bVerified - aVerified;

    const aPopular = a.badges?.includes('Popular') ? 1 : 0;
    const bPopular = b.badges?.includes('Popular') ? 1 : 0;
    if (bPopular !== aPopular) return bPopular - aPopular;

    return a.name.localeCompare(b.name);
  });

  const repoMetaPath = path.join(PLUGINS_MANGA_DIR, 'repo.meta.json');
  let repoMeta = { name: 'Harbor Manga Repository', description: 'Comprehensive community manga source plugins' };
  if (fs.existsSync(repoMetaPath)) {
    repoMeta = JSON.parse(fs.readFileSync(repoMetaPath, 'utf-8'));
  }

  const fullRepoManifest = {
    ...repoMeta,
    plugins: convertedManifests,
  };

  const repoJsonPath = path.join(DIST_MANGA_DIR, 'repo.json');
  fs.writeFileSync(repoJsonPath, JSON.stringify(fullRepoManifest, null, 2), 'utf-8');

  console.log('\n========================================');
  console.log(`🎉 Upstream Sync & Conversion Complete!`);
  console.log(`   - Converted & Verified: ${successCount} sources`);
  console.log(`   - Skipped / Failed:     ${skippedCount} sources`);
  console.log(`   - Total in repo.json:   ${convertedManifests.length} plugins`);
  console.log(`   - Output Manifest:      ${repoJsonPath}`);
  console.log('========================================\n');
}

main().catch((err) => {
  console.error('\n❌ Conversion pipeline failed:', err);
  process.exit(1);
});
