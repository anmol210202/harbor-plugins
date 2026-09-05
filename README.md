# ⚓ Harbor Plugins Repository

A production-grade, modular, and optimized repository architecture for building, managing, and hosting **Manga** and **eBook** plugins for the [Harbor reader](https://github.com/) application.

---

## 🌟 Key Highlights

- **Dual-URL Architecture**: Completely separated repository endpoints for Manga and eBooks:
  - **Manga Repository**: `https://<user>.github.io/<repo>/manga/repo.json`
  - **eBook Repository**: `https://<user>.github.io/<repo>/ebook/repo.json`
- **Native Harbor Compatibility**: Full adherence to Harbor's sandboxed Web Worker environment (no DOM, no direct `fetch`, strict size limit < 2 MB, automatic bridge registration).
- **TypeScript + esbuild Pipeline**: Zero-bloat, tree-shaken, ultra-fast compilation with strict type safety for `MangaProvider`, `EBookProvider`, and the `harbor` host bridge.
- **Automated Sanity Validation**: Built-in verification script tests plugin AST, lifecycle methods (`popular`, `search`, `detail`, `chapters`, `pageUrls`/`content`), bundle sizes, and flags forbidden globals before deployment.
- **Interactive Web Portal**: Bundled web landing page at root (`/`) with 1-click copy buttons and live plugin catalog.
- **GitHub Pages CI/CD**: Ready-to-go GitHub Actions workflows for automated PR validation and one-push deployment.

---

## 📁 Repository Structure

```text
harbor-plugins/
├── .github/
│   └── workflows/
│       ├── deploy.yml            # Automated GitHub Pages build & deployment
│       └── ci.yml                # CI pull request checks (typecheck, build, validate)
├── plugins/
│   ├── manga/                    # Manga source plugins
│   │   ├── repo.meta.json        # Manga repository metadata
│   │   └── example-manga/        # Sample Manga source
│   │       ├── manifest.json     # Plugin metadata (id, name, version, lang, icon)
│   │       └── index.ts          # Strongly typed MangaProvider implementation
│   └── ebook/                    # eBook source plugins
│       ├── repo.meta.json        # eBook repository metadata ("type": "ebook")
│       └── example-ebook/        # Sample eBook source
│           ├── manifest.json     # Plugin metadata
│           └── index.ts          # Strongly typed EBookProvider implementation
├── shared/
│   ├── types/
│   │   ├── harbor.d.ts           # Complete Harbor host bridge types (harbor.http, grpc, parseHtml)
│   │   ├── manga.ts              # MangaProvider, MangaChapter, MangaSummary, MangaTag
│   │   └── ebook.ts              # EBookProvider, EBookChapter, EBookVolume, EBookSummary, EBookTag
│   └── utils/
│       ├── url.ts                # abs(), URL normalization (prevents Harbor drops)
│       └── text.ts               # cleanTitle(), calcPage(), text cleaners
├── scripts/
│   ├── build.ts                  # Bundles TS plugins via esbuild and compiles repo.json files
│   ├── validate.ts               # Verifies method contracts, size limits, and sandboxing
│   └── serve.ts                  # Local development server with CORS
├── public/                       # Web portal static assets (landing page & styles)
│   ├── index.html                # Web dashboard with 1-click copy buttons
│   └── style.css
├── dist/                         # Compiled artifacts (published to GitHub Pages)
│   ├── index.html
│   ├── manga/
│   │   ├── repo.json             # Manifest for Harbor Manga
│   │   └── example-manga.plugin.js
│   └── ebook/
│       ├── repo.json             # Manifest for Harbor eBook
│       └── example-ebook.plugin.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Plugins & Manifests
Compiles TypeScript sources in `plugins/` into single `.plugin.js` bundles in `dist/` and generates `dist/manga/repo.json` & `dist/ebook/repo.json`:
```bash
npm run build
```

### 3. Validate Plugin Compatibility
Runs mock Harbor worker runtime tests on all bundles to guarantee they satisfy Harbor's requirements:
```bash
npm run validate
```

### 4. Run Local Dev Server
Starts a local HTTP server with full CORS support on port `8080`:
```bash
npm run serve
```
Endpoints:
- Manga Repo: `http://localhost:8080/manga/repo.json`
- eBook Repo: `http://localhost:8080/ebook/repo.json`
- Web Dashboard: `http://localhost:8080/`

---

## 📖 How to Add Repositories in Harbor

### Adding Manga Sources
1. In Harbor, navigate to **Manga** → **Set up a source** → **Extensions**.
2. Paste your Manga repository URL:
   ```text
   https://<your-username>.github.io/<repo-name>/manga/repo.json
   ```
3. Click **Install** on your desired sources.

### Adding eBook Sources
1. In Harbor, navigate to **eBook** → **Sources** → **Extensions**.
2. Paste your eBook repository URL:
   ```text
   https://<your-username>.github.io/<repo-name>/ebook/repo.json
   ```
3. Click **Install** on your desired sources.

---

## 🛠 Adding a New Plugin

### Adding a Manga Source

1. Create a directory inside `plugins/manga/<your-plugin-id>/`.
2. Add `manifest.json`:
   ```json
   {
     "id": "my-manga-source",
     "name": "My Manga Source",
     "version": "1.0.0",
     "lang": "en",
     "nsfw": false,
     "icon": "https://example.com/icon.png",
     "description": "Source for reading manga from Example.com",
     "website": "https://example.com"
   }
   ```
3. Create `index.ts`:
   ```typescript
   import type { MangaProvider, MangaSummary, MangaChapter } from '@shared/types/manga.js';
   import { createUrlResolver } from '@shared/utils/url.js';

   const BASE = 'https://example.com';
   const resolveUrl = createUrlResolver(BASE);

   export const plugin: MangaProvider = {
     id: 'my-manga-source',
     name: 'My Manga Source',
     async popular(offset, tagId) { /* ... */ },
     async search(query, offset, tagId) { /* ... */ },
     async detail(id) { /* ... */ },
     async chapters(id) { /* ... */ },
     async pageUrls(chapterId) { /* ... */ }
   };

   harbor.register(plugin);
   ```
4. Run `npm run build && npm run validate`.

---

### Adding an eBook Source

1. Create a directory inside `plugins/ebook/<your-plugin-id>/`.
2. Add `manifest.json`:
   ```json
   {
     "id": "my-ebook-source",
     "name": "My eBook Source",
     "version": "1.0.0",
     "lang": "en",
     "nsfw": false,
     "icon": "https://example.com/icon.png",
     "description": "Source for eBooks from Example.com",
     "website": "https://example.com"
   }
   ```
3. Create `index.ts`:
   ```typescript
   import type { EBookProvider, EBookSummary, EBookChapter } from '@shared/types/ebook.js';

   export const plugin: EBookProvider = {
     id: 'my-ebook-source',
     name: 'My eBook Source',
     async popular(offset, tagId) { /* ... */ },
     async search(query, offset, tagId) { /* ... */ },
     async detail(id) { /* ... */ },
     async chapters(id) { /* ... */ },
     async content(chapterId) { /* ... */ }
   };

   harbor.register(plugin);
   ```
4. Run `npm run build && npm run validate`.

---

## ⚡ Harbor Worker Rules & Constraints Cheat Sheet

| Rule | Harbor Requirement | How This Setup Helps |
| :--- | :--- | :--- |
| **Networking** | Only `harbor.http(...)` and `harbor.grpc(...)`. No `fetch`, `XMLHttpRequest`, or `WebSocket`. | Validated by `npm run validate`. Shared types provide full autocomplete for `harbor.http`. |
| **HTML Parsing** | `harbor.parseHtml(...)`. No DOM globals (`document`, `window`). Scripts/styles are stripped. | `HDocument` and `HElement` types with helper selectors provided in `shared/types/harbor.d.ts`. |
| **Absolute URLs** | All `cover`, `pageUrls`, and `siteUrl` must be absolute `http(s)://` or Harbor drops them. | `createUrlResolver(BASE)` in `shared/utils/url.ts` guarantees clean absolute URLs. |
| **Bundle Size** | Plugin file must be **< 2 MB**. | `esbuild` minifies and strips dead code; build pipeline checks and warns if size limit is exceeded. |
| **Manifest Portability** | `entry` in `repo.json` is relative to `repo.json`. | The build system emits relative filenames (`"entry": "plugin.plugin.js"`), making repos 100% portable. |

---

## 🌐 Deploying to GitHub Pages

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial Harbor plugins setup"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. The `.github/workflows/deploy.yml` workflow will automatically trigger, build the plugins, run validation, and publish to GitHub Pages!

---

## 📜 License

MIT
