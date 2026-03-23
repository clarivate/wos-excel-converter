# WOS API Exporter Codebase Guide

## Project Overview

**Web of Science API Exporter** is an Electron desktop application built with TypeScript, Vue 3, and Vite that enables users to export Web of Science and InCites API data to Excel/CSV/JSON/XML formats. It implements secure IPC communication, structured logging, and rate-limited API integrations.

## Architecture Overview

### Three-Process Model (Electron)

1. **Main Process** (`src/main/`)

- Controls app lifecycle, windows, and system integration
- Entry: `src/main/index.ts` (loaded by electron-main)
- Handles all IPC communication via `src/main/IPCs.ts`
- Manages logging, configuration, and API calls to external services

2. **Renderer Process** (`src/renderer/`)

- Vue 3 SPA with Vuetify UI framework
- Entry: `src/renderer/index.html` and `src/renderer/main.ts`
- Communicates with main process exclusively through `window.mainApi` (defined in `src/types/mainApi.d.ts`)
- Isolated context: no direct Node.js access

3. **Preload Bridge** (`src/preload/index.ts`)

- **Critical security boundary**: Selectively exposes main process capabilities
- **Whitelist channels** in `mainAvailChannels` before adding new IPC features
- Routes: `send()`, `on()`, `once()`, `off()` for async/sync, and `invoke()` for request-response
- All channels must be registered in both preload and main process IPCs

### IPC Communication Pattern

```typescript
// Renderer initiates
window.mainApi.invoke('msgRequestGetAllConfigNames') // async request

// Main process handles in src/main/IPCs.ts
ipcMain.handle('msgRequestGetAllConfigNames', async () => {
  /* ... */
})

// Two-way: Main sends to all renderers
BrowserWindow.getAllWindows().forEach((win) => win.webContents.send('onLog', text))
```

**Key Files:**

- `src/preload/index.ts`: Whitelist of allowed channels
- `src/main/IPCs.ts`: All IPC handlers registered here
- `src/types/mainApi.d.ts`: Type definitions for `window.mainApi` (keep in sync)

## Build & Development Commands

### Core Workflows

```bash
npm run dev              # Start dev server with hot reload (localhost:5173)
npm run build:pre       # Format, type-check, build renderer/preload (prerequisite)
npm run build           # Full build: build:pre + package Windows app
npm run build:all       # Cross-platform: Windows, macOS, Linux
npm run test            # Build + run Playwright E2E tests
npm run lint:fix        # Auto-fix ESLint/Prettier issues
```

### Important Implementation Details

- **Dev Mode**: `npm run dev` starts Vite dev server and watches main/preload with hot reload. Main process must implement `import('./index.dev')` on ready (see `src/main/index.ts` line 56).
- **Pre-build Step**: `npm run build:pre` is required before packaging; runs format, type check, and Vite build.
- **Source Maps**: Built with `sourcemap: true` in vite config (line 49) for debugging.
- **Electron Args**: Debug ports configured in `vite.config.mts` (9228 for main, 9229 for remote debugging).

## Key Patterns & Conventions

### Logging System (`src/main/utils/LogManager.ts`)

- **Single responsibility**: All logging routes through `electron-log` via console overrides in main and renderer.
- **Log lifecycle**: Console calls → Main process → File + IPC to renderers.
- **Renderer logging**: Use `console.log/error/warn` which are intercepted and sent to main via preload's `sendToLog()`.
- **Log file archiving**: `LogManager.checkAndArchiveLogFile()` rotates logs when exceeding thresholds.
- **Access in UI**: Renderer gets last N lines via `msgRequestLogLines` IPC, file size via `msgRequestLogFileSize`.

### API Integration Pattern (`src/main/apis/`)

- **Singleton pattern**: `WosExpanded.getInstance(token)` maintains single instance per API key.
- **Rate limiting**: `throttle_scheduler.ts` intercepts Axios responses, honors `x-req-reqpersec-remaining` header.
- **Query validation**: `wos.ts` exposes `validateQuery()` and `rawQueryAsync()` before exporting data.
- **Helper abstractions**: `src/main/apis/helper/` contains response parsers (e.g., `WOSQueryFeedback`).

### State Management (`src/renderer/store/`)

- **Pinia stores**: `configs.ts` demonstrates pattern: fetch IPC data, expose reactive refs, provide actions.
- **IPC-driven state**: Always wrap IPC calls in async methods; stores are sources of truth for UI.

### Vue 3 + Vuetify Setup

- **Plugin initialization**: `src/renderer/plugins/` sets up i18n (multilingual), vuetify (Material Design), pinia (state).
- **Composition API**: Store-like patterns use `defineStore` with `ref()` and functions (not `computed`).
- **Type safety**: Explicit `mainApi` type in `src/types/mainApi.d.ts`; no implicit `any` in renderer code.

### Configuration Management (`src/main/apis/configs/`)

- **Persisted storage**: `ConfigStore` wraps `lowdb` (JSON-based) for user settings.
- **Multi-profile**: Named configs allow users to save/switch between API keys and preferences.
- **Accessed via IPC**: Renderer never directly reads configs; goes through main process IPC.

## Testing & Quality Assurance

### Playwright E2E Tests (`tests/specs/`)

- **Test structure**: Import from `fixtures.mts` which handles Electron app launch/teardown.
- **Test utility**: `testUtil.mts` provides helpers (e.g., `captureScreenshot()`).
- **App startup**: `beforeAll` in fixtures launches app from `package.json.main` (dist/main/index.js) with production NODE_ENV.
- **Window size**: Normalized to 1080x560 for consistent UI testing.
- **Queries**: Use data-testid patterns like `page.locator('#header-system-bar')`.

#### Playwright Commands

```bash
npm run test:e2e
npm run test:e2e:core
npm run test:e2e:tokens
```

- `npm run test:e2e`: runs the full Playwright suite
- `npm run test:e2e:core`: runs tests that do not require live API tokens
- `npm run test:e2e:tokens`: runs only token-backed live verification tests tagged with `@requires-token`

#### Local Token Setup for Live Tests

Create a local `.env` file in the repo root (it is gitignored) or copy from `.env.example`:

```env
WOS_EXPANDED_TOKEN=your_wos_expanded_token
INCITES_TOKEN=your_incites_token
```

- These values are loaded by `tests/env.mts`
- If tokens are missing, `tests/specs/token-live.spec.ts` is skipped automatically
- Never commit real token values to git

#### GitHub Actions

- Workflow file: `.github/workflows/playwright.yml`
- Core Playwright tests run on macOS, Windows, and Linux for normal CI coverage
- Token-backed live tests run only when repository or environment secrets are configured:
  - `WOS_EXPANDED_TOKEN`
  - `INCITES_TOKEN`
- The workflow masks token values in logs before running the live test job

### Unit Tests

- Stored in `tests/unit/` (e.g., `LogManager.spec.ts`).
- Run as part of `npm run build:pre` via `vue-tsc --noEmit` type checking.

### Linting & Formatting

- **ESLint config**: `eslint.config.ts` with Vue, TypeScript, Prettier rules.
- **Prettier integration**: Enforced in build:pre; use `npm run format:fix` to auto-fix.
- **CI note**: `npm run test:linux` uses `xvfb-run` for headless rendering on Linux CI.

## Important Files for Different Tasks

| Task | Key Files |
| --- | --- |
| Adding IPC endpoint | `src/preload/index.ts` (whitelist), `src/main/IPCs.ts` (handler), `src/types/mainApi.d.ts` (type) |
| New API integration | `src/main/apis/[service].ts` (singleton), `src/main/IPCs.ts` (expose to renderer) |
| Renderer feature | `src/renderer/screens/` or `src/renderer/components/`, + Pinia store if state needed |
| Logging/debugging | `src/main/utils/LogManager.ts` (thresholds), `src/renderer/screens/LogScreen.vue` (UI) |
| Build config | `vite.config.mts` (Vite), `buildAssets/builder/config.js` (Electron-builder), `package.json` scripts |
| Types & API surface | `src/types/mainApi.d.ts`, `tsconfig.json` (paths alias `@/*` = `src/*`) |

## Security Boundaries

1. **Preload whitelisting** (CRITICAL): Every new IPC channel must be added to `mainAvailChannels` array in `src/preload/index.ts`.
2. **No direct file system access in renderer**: All file I/O routed through main process IPCs.
3. **Context isolation enabled**: `contextIsolation: true` in `src/main/utils/Constants.ts` (line 62).
4. **API key storage**: Keys stored in persisted config; never exposed in IPC logs (handled by `ConfigStore`).

## Common Development Tasks

### Adding a New IPC Endpoint

1. Add channel name to `mainAvailChannels` in `src/preload/index.ts`
2. Register handler in `src/main/IPCs.ts` with `ipcMain.handle()` or `.on()`
3. Add type to `src/types/mainApi.d.ts` interface
4. Call via `window.mainApi.invoke()` or `.send()` in renderer

### Debugging Main Process

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Attach debugger to port 9228
# VSCode: Debug → Attach to port 9228
# Chrome DevTools: chrome://inspect
```

### Adding a New Screen/Feature

1. Create `.vue` component in `src/renderer/screens/`
2. Add route to `src/renderer/router/index.ts`
3. If state needed, create Pinia store in `src/renderer/store/`
4. Import i18n keys from `src/renderer/locales/*.json` (en.json, de.json)
5. Use Vuetify components from `@/renderer/components/`

### Handling Errors Across Processes

- **Renderer uncaught**: Caught by app.config.errorHandler in `src/renderer/main.ts`, logged via `console.error()`
- **Main uncaught**: Caught by `process.on('uncaughtException')` in `src/main/index.ts`, triggers error window
- **Render process crash**: `app.on('render-process-gone')` creates error UI

## Environment & Dependencies

### Package Manager: pnpm for Installation

**Use `pnpm` for package management operations** (installing/adding/removing packages):

```bash
pnpm install          # Install dependencies
pnpm add package      # Add package
pnpm add -D package   # Add dev dependency
pnpm remove package   # Remove package
```

**Use `npm run` for running scripts** (defined in package.json):

```bash
npm run dev           # Start development server
npm run build         # Build application
npm run test          # Run tests
npm run lint:fix      # Fix linting issues
```

Reason: This project uses `pnpm-workspace.yaml` and `pnpm-lock.yaml` for monorepo management, but package.json scripts use `npm run` syntax.

### Core Requirements

- **Node 20+** required (see `package.json` engines)
- **pnpm** (for package management)
- **Key dependencies**: Electron 39+, Vue 3, Vuetify 3, Vite 7, ExcelJS, fast-csv, axios
- **Dev dependencies**: Playwright (E2E + coverage), TypeScript, ESLint, Prettier
- **Output structure**:
  - `dist/main/index.js` (Electron main process entry)
  - `dist/preload/index.js` (Preload bridge)
  - `dist/renderer/` (Vue SPA)

## Release & Versioning

- **Version source**: `package.json` (synced to app via `src/main/utils/Constants.ts`)
- **Build artifacts**: `release/[version]/` contains installers and app data
- **Supported platforms**: Windows (exe/appx/portable), macOS (dmg), Linux (tar.gz)
- **Version checker**: `src/main/apis/version_checker.ts` fetches latest from GitHub releases

---

**Last Updated**: March 2026 **License**: GPL-3.0 **Repository**: https://github.com/clarivate/wos-api-converter
