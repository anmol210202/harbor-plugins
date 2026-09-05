import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const REQUIRED_MANGA_METHODS = ['popular', 'search', 'detail', 'chapters', 'pageUrls'];
const REQUIRED_EBOOK_METHODS = ['popular', 'search', 'detail', 'chapters', 'content'];

const FORBIDDEN_GLOBALS = [
  'fetch(',
  'XMLHttpRequest',
  'WebSocket',
  'importScripts',
  'localStorage',
  'sessionStorage',
  'document.',
  'window.',
];

interface MockHarbor {
  http: () => Promise<any>;
  grpc: () => Promise<any>;
  parseHtml: () => Promise<any>;
  register: (provider: any) => void;
  log: (...args: any[]) => void;
  registeredProvider?: any;
}

function createMockHarbor(): MockHarbor {
  const harbor: MockHarbor = {
    http: async () => ({ status: 200, ok: true, headers: {}, body: '' }),
    grpc: async () => ({ status: 200, ok: true, headers: {}, body: new Uint8Array(), messages: [], trailers: {} }),
    parseHtml: async () => ({ querySelector: () => null, querySelectorAll: () => [] }),
    register: (provider) => {
      harbor.registeredProvider = provider;
    },
    log: () => {},
  };
  return harbor;
}

function validateForbiddenGlobals(code: string, fileName: string) {
  for (const forbidden of FORBIDDEN_GLOBALS) {
    if (code.includes(forbidden)) {
      console.warn(`  ⚠️  Warning in ${fileName}: contains potentially forbidden global call '${forbidden}'`);
    }
  }
}

function testPluginExecution(code: string, fileName: string, requiredMethods: string[]) {
  const harbor = createMockHarbor();

  try {
    const runner = new Function('harbor', code);
    runner(harbor);
  } catch (err) {
    throw new Error(`Failed to evaluate ${fileName}: ${(err as Error).message}`);
  }

  const provider = harbor.registeredProvider;
  if (!provider) {
    throw new Error(`${fileName} did not register any provider with harbor.register()`);
  }

  if (!provider.id) {
    throw new Error(`${fileName}: provider is missing 'id' property`);
  }
  if (!provider.name) {
    throw new Error(`${fileName}: provider is missing 'name' property`);
  }

  for (const method of requiredMethods) {
    if (typeof provider[method] !== 'function') {
      throw new Error(`${fileName}: provider is missing required method '${method}'`);
    }
  }

  console.log(`  ✔ Validated ${fileName} (id: ${provider.id}) - all required methods present`);
}

function validateRepo(repoType: 'manga' | 'ebook') {
  const repoDir = path.join(DIST_DIR, repoType);
  const repoJsonPath = path.join(repoDir, 'repo.json');

  console.log(`\n🔍 Validating ${repoType.toUpperCase()} repo...`);

  if (!fs.existsSync(repoJsonPath)) {
    throw new Error(`Missing repo manifest: ${repoJsonPath}`);
  }

  const manifestContent = fs.readFileSync(repoJsonPath, 'utf-8');
  const manifest = JSON.parse(manifestContent);

  if (!manifest.name) {
    throw new Error(`${repoType}/repo.json is missing 'name'`);
  }

  if (repoType === 'ebook' && manifest.type !== 'ebook') {
    throw new Error(`ebook/repo.json must have "type": "ebook"`);
  }

  if (!Array.isArray(manifest.plugins)) {
    throw new Error(`${repoType}/repo.json must have a 'plugins' array`);
  }

  console.log(`  ✔ repo.json is valid (contains ${manifest.plugins.length} plugins)`);

  const requiredMethods = repoType === 'manga' ? REQUIRED_MANGA_METHODS : REQUIRED_EBOOK_METHODS;

  for (const plugin of manifest.plugins) {
    if (!plugin.id || !plugin.name || !plugin.entry) {
      throw new Error(`Plugin entry invalid: must have id, name, and entry`);
    }

    const pluginFilePath = path.join(repoDir, plugin.entry);
    if (!fs.existsSync(pluginFilePath)) {
      throw new Error(`Bundle file not found: ${pluginFilePath}`);
    }

    const stats = fs.statSync(pluginFilePath);
    if (stats.size > 2 * 1024 * 1024) {
      throw new Error(`Bundle ${plugin.entry} exceeds 2MB limit: ${stats.size} bytes`);
    }

    const code = fs.readFileSync(pluginFilePath, 'utf-8');
    validateForbiddenGlobals(code, plugin.entry);
    testPluginExecution(code, plugin.entry, requiredMethods);
  }
}

async function main() {
  console.log('🧪 Starting Harbor Compatibility & Sanity Validation...');

  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('dist directory does not exist. Run "npm run build" first.');
  }

  validateRepo('manga');
  validateRepo('ebook');

  console.log('\n🎉 All Harbor plugins and manifests passed validation with flying colors!');
}

main().catch((err) => {
  console.error('\n❌ Validation failed:', err.message);
  process.exit(1);
});
