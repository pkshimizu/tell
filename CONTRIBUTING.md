# Contributing to tell

This document provides information for developers who want to contribute to tell.

## Development Environment Setup

### Recommended IDE

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### Requirements

- Node.js 18.0.0 or higher
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

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux

# For all platforms
$ npm run build:all
```

### Build Without Packaging (for testing)

```bash
$ npm run build:unpack
```

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

### Release Steps

1. **Update Version**

   ```bash
   # Update version in package.json
   npm version patch  # Patch version (0.0.1 -> 0.0.2)
   npm version minor  # Minor version (0.1.0 -> 0.2.0)
   npm version major  # Major version (1.0.0 -> 2.0.0)
   ```

2. **Commit and Push Changes**

   ```bash
   git add package.json package-lock.json
   git commit -m "Update version to {version}"
   git push
   ```

3. **Create Release on GitHub**
   - Go to "Releases" → "Create a new release" on the repository page
   - Enter tag name (e.g., `v0.0.2`)
   - Enter release title and description
   - Click "Publish release"

4. **Automated Build**
   - GitHub Actions will automatically start and generate binaries:
     - Windows: `tell-{version}-setup.exe` (x64)
     - macOS: `tell-{version}.dmg` (Universal: Intel & Apple Silicon)
     - Linux: AppImage, snap, deb formats
   - Generated binaries will be automatically uploaded to the release page

### Version Management

- Follow Semantic Versioning (`MAJOR.MINOR.PATCH`)
- Release tags format: `v{version}` or `release/v{version}`
- Automatic check ensures package.json version matches the release tag

## License

This project is released under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

- Issues: [GitHub Issues](https://github.com/pkshimizu/tell/issues)
- Discussions: [GitHub Discussions](https://github.com/pkshimizu/tell/discussions)
