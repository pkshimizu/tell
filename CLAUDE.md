# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Electron desktop application built with React and TypeScript using the electron-vite build system. The application follows Electron's standard multi-process architecture.

## Development Commands

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Type checking
npm run typecheck              # Check both node and web
npm run typecheck:node         # Check main/preload processes only
npm run typecheck:web          # Check renderer process only

# Code quality
npm run lint                   # Run ESLint
npm run format                 # Format with Prettier
npm run fix                    # Run format, lint, and typecheck

# Build
npm run build                  # Type check + production build
npm run build:mac              # Build macOS app
npm run build:win              # Build Windows app
npm run build:linux            # Build Linux app (AppImage, snap, deb)
npm run build:unpack           # Build without packaging (for testing)

# Database (Drizzle ORM)
npm run db:generate            # Generate migration files from schema
npm run db:migrate             # Apply migrations to database
npm run db:push                # Push schema directly to database (dev only)
npm run db:studio              # Launch Drizzle Studio (GUI tool)
```

## Architecture

### Process Structure

The application follows Electron's standard three-process architecture:

1. **Main Process** (`src/main/`) - Node.js environment that controls application lifecycle and creates browser windows
2. **Preload Scripts** (`src/preload/`) - Bridge between main and renderer processes with secure IPC exposure via contextBridge
3. **Renderer Process** (`src/renderer/`) - React application running in the browser window

### Path Aliases

Path aliases are configured for cleaner and maintainable imports. **Always use absolute path imports with aliases instead of relative paths** (e.g., `./` or `../`).

Available aliases:

- `@renderer/*` → `src/renderer/*`
- `@main/*` → `src/main/*`
- `@preload/*` → `src/preload/*`
- `@resources/*` → `resources/*`

These work in both main process (tsconfig.node.json) and renderer process (tsconfig.web.json).

**Example:**

```typescript
// ✅ Good - use path aliases
import TText from '@renderer/components/display/text'
import { theme } from '@renderer/theme'
import icon from '@resources/icon.png?asset'

// ❌ Bad - avoid relative paths
import App from './App'
import { theme } from './theme'
import icon from '../../resources/icon.png?asset'
```

ESLint is configured to enforce this rule with `import/no-relative-parent-imports` and `import/no-relative-packages`.

### TypeScript Configuration

- `tsconfig.node.json` - Main and preload processes (Node.js environment)
- `tsconfig.web.json` - Renderer process (browser environment, React)
- Both configs use composite project references for faster builds

### IPC Communication

When adding IPC handlers:

1. Add handler in `src/main/index.ts` using `ipcMain.on()` or `ipcMain.handle()`
2. Expose API in `src/preload/index.ts` via `contextBridge.exposeInMainWorld()`
3. Add TypeScript types in `src/preload/index.d.ts`
4. Use in renderer via `window.electron` or `window.api`

### Build System

- Uses electron-vite for fast HMR and optimized builds
- Configuration in `electron.vite.config.ts`
- Main process uses externalizeDepsPlugin to exclude node_modules from bundle
- Renderer process uses Vite's React plugin with Fast Refresh

### Application Distribution

- electron-builder configuration in `electron-builder.yml`
- App ID: `com.electron.app`
- Supports Windows (NSIS installer), macOS (DMG), and Linux (AppImage/snap/deb)
- Auto-update capability via electron-updater (configured for generic provider)

### Database (Drizzle ORM + SQLite)

The application uses Drizzle ORM with SQLite for data persistence.

**Directory Structure:**

- `src/main/database/` - Database configuration and connection
- `src/main/database/schemas/` - Table schema definitions
- `src/main/database/migrations/` - Migration files (auto-generated)
- `src/main/repositories/` - Repository classes for data access

**Database Location:**

- Development: `./data/app.db`
- Production: User data directory (`app.getPath('userData')`)

**Workflow:**

1. Define schema in `src/main/database/schemas/`
2. Export schema from `src/main/database/schemas/index.ts`
3. Generate migration: `npm run db:generate`
4. Apply migration: `npm run db:push` (dev) or `npm run db:migrate` (prod)
5. Create Repository class in `src/main/repositories/` for data operations

See `src/main/database/README.md` and `src/main/repositories/README.md` for detailed usage.
