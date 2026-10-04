# Contributing to tell

This document provides information for developers who want to contribute to tell.

## Development Environment Setup

### Recommended IDE

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### Requirements

- Node.js 20.0.0 or higher (CI builds with Node.js 20)
- npm 9.0.0 or higher
- Git

### Project Setup

```bash
# Clone the repository
$ git clone https://github.com/pkshimizu/tell.git
$ cd tell

# Install dependencies
$ npm install
```

## Development

### Start Development Server

```bash
$ npm run dev
```

The development server will start with hot reload enabled. The application will automatically reload when you make changes to the code.

### Code Quality Checks

```bash
# TypeScript type checking
$ npm run typecheck

# ESLint code checking
$ npm run lint

# Prettier code formatting
$ npm run format

# Run all checks
$ npm run fix
```

### Testing

```bash
# Run tests
$ npm test

# Check test coverage
$ npm run test:coverage
```

## Building

### Building for Each Platform

```bash
# For Windows
$ npm run build:win

# For macOS (unsigned Universal ZIP for local use)
$ npm run build:mac
```

Local builds do not embed the update configuration, so they never receive in-app updates.
Release builds use a dedicated configuration that produces the signed and notarized macOS
DMG/ZIP, the Windows installer and the update files. See [Build configuration](#build-configuration).

### Build Without Packaging (for testing)

```bash
$ npm run build:unpack
```

### Build configuration

electron-builder settings are split into three files:

| File                           | Purpose                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `electron-builder.base.yml`    | Settings shared by every build (app ID, files, icons, `extendInfo`, Windows NSIS installer, GitHub `publish` used for the update files)     |
| `electron-builder.yml`         | Default local build: unsigned, non-notarized Universal ZIP; `publish: null`, so no update configuration is embedded                         |
| `electron-builder.release.yml` | Release build (CI only): Developer ID signed and Apple notarized Universal DMG and ZIP; also used for the Windows build to get `latest.yml` |

The latter two `extends` the base file. `mac.target` is intentionally declared in each
derived file instead of the base one, because `extends` concatenates arrays — putting it
in the base would produce both a ZIP and a DMG. For the same reason `publish` is a mapping,
not an array.

The release asset file names are defined once in `.github/scripts/release-state.mjs`
(`releaseAssets`). If you change an `artifactName`, update it as well; the tests in
`.github/scripts/release-state.test.mjs` fail when the two disagree.

## Architecture

tell is a desktop application built with Electron + React + TypeScript.

### Directory Structure

```
tell/
├── src/
│   ├── main/           # Main process (Node.js environment)
│   │   ├── database/   # Database related
│   │   ├── models/     # Data models
│   │   └── repositories/# Repository pattern implementation
│   ├── preload/        # Preload scripts (IPC communication)
│   └── renderer/       # Renderer process (React)
│       ├── components/ # Common UI components
│       ├── features/   # Feature-specific components
│       ├── contexts/   # React Context
│       ├── hooks/      # Custom hooks
│       └── routes/     # Routing
├── resources/          # Application resources
├── docs/               # Documentation
└── electron.vite.config.ts # Vite configuration
```

### Database

- Using SQLite + Drizzle ORM
- Schema definitions: `src/main/database/schemas/`
- Migrations: `src/main/database/migrations/`

```bash
# Generate migrations
$ npm run db:generate

# Run migrations
$ npm run db:migrate

# Start Drizzle Studio (Database management UI)
$ npm run db:studio
```

## Pull Request Guidelines

1. **Branch Naming Convention**
   - Feature: `feature/issue-number-description`
   - Bug fix: `fix/issue-number-description`
   - Documentation: `docs/description`

2. **Commit Messages**
   - Can be in English or Japanese
   - Clearly describe what was changed

3. **Testing**
   - Add tests for new features
   - Ensure existing tests pass

4. **Review**
   - Request review after creating a Pull Request
   - Make changes based on feedback

## Release Process

Releases are created from a **release pull request**. Merging it is the approval of the release;
the tag, the GitHub Release and the uploads are created automatically.

### One-time setup

- **Settings → Actions → General → Workflow permissions**: enable
  **Allow GitHub Actions to create and approve pull requests** (Prepare Release creates the pull
  request with `GITHUB_TOKEN`).
- The `release` label must exist (it excludes release pull requests from the release notes).
- macOS signing secrets: `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`,
  `APPLE_TEAM_ID`.

### Release steps

1. **Prepare the release pull request**: **Actions → Prepare Release → Run workflow** on `main`,
   choosing `patch`, `minor` or `major`. The workflow bumps `package.json` / `package-lock.json`
   on a `release/v{version}` branch and opens a pull request labeled `release`, with a preview of
   the release notes. It refuses to run while the current version is not published yet, while
   another release pull request is open, or when the next version already has a release.
2. **Merge the release pull request.** `main` requires pull requests, and the last push is made by
   the bot, so approve the pull request yourself or merge with the administrator bypass.
3. **Wait for the Release workflow.** On the merge it creates a **draft** release `v{version}`,
   builds Windows and macOS, verifies the artifacts (signature, notarization, update files),
   uploads them and then publishes the release. The release is marked as Latest only when it is
   the newest published version.

Notes:

- Pull requests created with `GITHUB_TOKEN` do not trigger `pull_request` workflows.
- **Do not publish or edit the draft in the GitHub UI while the workflow is running.** The upload
  job refuses to touch a draft that was published or retargeted in the meantime.
- **Avoid publishing a release manually.** Publishing moves Latest immediately, and in-app updates
  fail until the build has uploaded the artifacts and update files (30 minutes or more). The
  `release: published` path is kept only for compatibility.
- **If the build fails**, fix it on `main` and run **Actions → Release → Run workflow** on `main`
  (`workflow_dispatch`). It moves the existing draft to the latest commit and rebuilds it.
- **To discard a failed draft**, delete it with `gh release delete v{version} --yes`. A draft has no
  git tag until it is published, so there is no tag to clean up.
- A `package.json` change that does not bump the version (e.g. a dependency update) does not start a
  release.

### Release artifacts

| Platform | Files                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Windows  | `tell-{version}-win-setup.exe` (NSIS installer, x64), `tell-{version}-win-setup.exe.blockmap`, `latest.yml`                           |
| macOS    | `tell-{version}-universal-mac.dmg`, `tell-{version}-universal-mac.zip`, `tell-{version}-universal-mac.zip.blockmap`, `latest-mac.yml` |

The DMG is for manual installation. The ZIP, the blockmaps and `latest*.yml` are used by the in-app
updater (`electron-updater`); the update files are uploaded after the binaries they refer to.

The Windows installer is not code-signed, so `electron-updater` relies only on the sha512 in
`latest.yml` (see #76).

### Release notes

Release notes are generated from merged pull requests and grouped by label (see
`.github/release.yml`): `enhancement` → 新機能, `bug` → 不具合修正, `documentation` → ドキュメント,
others → その他. Pull requests labeled `release` are excluded.

### Version Management

- Follow Semantic Versioning (`MAJOR.MINOR.PATCH`)
- Release tags format: `v{version}` (the legacy `release/v{version}` format is no longer used)
- A new version must be newer than the latest published release

## License

This project is released under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

- Issues: [GitHub Issues](https://github.com/pkshimizu/tell/issues)
- Discussions: [GitHub Discussions](https://github.com/pkshimizu/tell/discussions)
