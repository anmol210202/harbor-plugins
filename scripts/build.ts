import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const ROOT_DIR = process.cwd();
const PLUGINS_DIR = path.join(ROOT_DIR, 'plugins');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const REPO_TYPES = ['manga', 'ebook'] as const;
type RepoType = (typeof REPO_TYPES)[number];

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  lang: string;
  nsfw: boolean;
  icon?: string;
  entry?: string;
  description?: string;
  website?: string;
}

interface RepoMeta {
  type?: string;
  name: string;
  description?: string;
}

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function buildPlugin(pluginSrcDir: string, outDir: string, manifest: PluginManifest): Promise<string> {
  const entryFile = path.join(pluginSrcDir, 'index.ts');
  const bundleFileName = `${manifest.id}.plugin.js`;
  const outPath = path.join(outDir, bundleFileName);

  if (!fs.existsSync(entryFile)) {
    throw new Error(`Entry point not found: ${entryFile}`);
  }

  await build({
    entryPoints: [entryFile],
    outfile: outPath,
    bundle: true,
    format: 'iife',
    globalName: 'plugin',
    target: 'es2022',
    platform: 'neutral',
    minify: true,
    sourcemap: false,
    legalComments: 'none',
    footer: {
      js: '\nif (typeof plugin !== "undefined" && typeof harbor !== "undefined" && harbor.register) { var __p = (plugin && (plugin.default || plugin.plugin)) ? (plugin.default || plugin.plugin) : plugin; if (__p && __p.id && __p.name) { try { harbor.register(__p); } catch (_) {} } }',
    },
  });

  const stats = fs.statSync(outPath);
  const sizeKb = (stats.size / 1024).toFixed(2);
  console.log(`  ✔ Built ${manifest.id} -> ${bundleFileName} (${sizeKb} KB)`);

  if (stats.size > 2 * 1024 * 1024) {
    throw new Error(`Plugin bundle exceeds Harbor 2 MB limit: ${stats.size} bytes`);
  }

  return bundleFileName;
}

async function processRepoType(repoType: RepoType) {
  const typeSrcDir = path.join(PLUGINS_DIR, repoType);
  const typeDistDir = path.join(DIST_DIR, repoType);
  await ensureDir(typeDistDir);

  const metaPath = path.join(typeSrcDir, 'repo.meta.json');
  let repoMeta: RepoMeta = {
    name: `Harbor ${repoType === 'manga' ? 'Manga' : 'eBook'} Repository`,
  };

  if (fs.existsSync(metaPath)) {
    repoMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  }

  if (repoType === 'ebook') {
    repoMeta.type = 'ebook';
  }

  const entries = fs.readdirSync(typeSrcDir, { withFileTypes: true });
  const pluginManifests: PluginManifest[] = [];

  console.log(`\n📦 Building ${repoType.toUpperCase()} plugins...`);

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pluginDir = path.join(typeSrcDir, entry.name);
    const manifestPath = path.join(pluginDir, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      console.warn(`  ⚠ Skipping ${entry.name}: no manifest.json found`);
      continue;
    }

    const manifest: PluginManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const bundleFileName = await buildPlugin(pluginDir, typeDistDir, manifest);

    // Harbor resolves entry relative to repo.json
    pluginManifests.push({
      ...manifest,
      entry: bundleFileName,
    });
  }

  // Preserve any converted plugins in dist/manga/repo.json
  const existingRepoJson = path.join(typeDistDir, 'repo.json');
  if (fs.existsSync(existingRepoJson)) {
    try {
      const existing = JSON.parse(fs.readFileSync(existingRepoJson, 'utf-8'));
      if (Array.isArray(existing.plugins)) {
        for (const p of existing.plugins) {
          if (!pluginManifests.some((m) => m.id === p.id)) {
            pluginManifests.push(p);
          }
        }
      }
    } catch (_) {}
  }

  const repoManifest = {
    ...repoMeta,
    plugins: pluginManifests,
  };

  const repoJsonPath = path.join(typeDistDir, 'repo.json');
  fs.writeFileSync(repoJsonPath, JSON.stringify(repoManifest, null, 2), 'utf-8');
  console.log(`  📄 Generated ${repoType}/repo.json with ${pluginManifests.length} plugins`);

  return { repoType, meta: repoManifest, plugins: pluginManifests };
}

function copyStaticAssets() {
  if (fs.existsSync(PUBLIC_DIR)) {
    console.log('\n🌐 Copying public static assets to dist...');
    fs.cpSync(PUBLIC_DIR, DIST_DIR, { recursive: true });
  }
}

async function main() {
  console.log('🚀 Starting Harbor Plugins Build Pipeline...');
  const startTime = Date.now();

  await ensureDir(DIST_DIR);

  const buildResults = [];
  for (const repoType of REPO_TYPES) {
    const res = await processRepoType(repoType);
    buildResults.push(res);
  }

  copyStaticAssets();

  const elapsed = (Date.now() - startTime).toFixed(0);
  console.log(`\n✨ Build completed successfully in ${elapsed}ms!`);
}

main().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
