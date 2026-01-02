# tell

<div align="center">
  <img src="resources/icon.png" alt="tell Logo" width="128" height="128">
  <h3>Your Personal GitHub Assistant</h3>
  <p>tell automatically collects and monitors information that matters to you from GitHub</p>
</div>

## ✨ Features

tell is a desktop application that helps you stay on top of your GitHub activities without constantly checking your browser.

### 📋 Main Features

- **📊 Pull Request Dashboard**: View all open pull requests at a glance
- **🔄 Real-time Updates**: Automatically refreshes every 5 minutes
- **👤 Smart Filtering**: See only PRs where you're involved (author, assignee, or reviewer)
- **🏢 Multi-Repository Support**: Monitor multiple repositories from different organizations
- **💾 Offline Support**: Works offline with cached data

## 📸 Screenshots

<img width="1012" height="892" alt="tell Application Screenshot" src="docs/images/tell-app-screenshot.png" />

## 📥 Installation

### Download

1. Visit the [Releases page](https://github.com/pkshimizu/tell/releases)
2. Download the appropriate installer for your operating system:
   - **Windows**: `tell-{version}-setup.exe`
   - **macOS**: `tell-{version}.dmg`
   - **Linux**: Choose from AppImage, snap, or deb format

### Platform-specific Installation

#### Windows

1. Double-click the downloaded `.exe` file
2. Follow the installation wizard
3. The application will be added to your Start menu

#### macOS

1. Open the downloaded `.dmg` file
2. Drag the tell app to your Applications folder
3. On first launch, you may need to allow the app in System Preferences → Security & Privacy

#### Linux

- **AppImage**: Make it executable with `chmod +x` and run directly
- **Snap**: `sudo snap install tell-{version}.snap --dangerous`
- **Deb**: `sudo dpkg -i tell-{version}.deb`

## 🚀 Getting Started

### Initial Setup

1. **Launch tell** from your applications menu
2. **Configure GitHub Integration**:
   - Click on the Settings icon in the sidebar
   - Navigate to GitHub settings

### GitHub Personal Access Token Setup

To use tell, you need to create a GitHub Personal Access Token:

1. **Go to GitHub Settings**:
   - Click your profile picture on GitHub
   - Select "Settings" → "Developer settings" → "Personal access tokens" → "Tokens (classic)"

2. **Create New Token**:
   - Click "Generate new token" → "Generate new token (classic)"
   - Give your token a descriptive name (e.g., "tell Desktop App")
   - Select expiration (we recommend 90 days for security)
   - Select the following scopes:
     - `repo` (Full control of private repositories)
     - `read:org` (Read org and team membership)
     - `read:user` (Read user profile data)

3. **Copy the Token**:
   - Copy the generated token immediately (you won't be able to see it again)
   - Paste it into tell's GitHub settings

4. **Select Repositories**:
   - Choose which repositories you want to monitor
   - tell will start fetching pull request information

### Using tell

#### Viewing Pull Requests

- The home screen displays all open pull requests from your selected repositories
- PRs are grouped by repository for easy navigation
- Each PR shows:
  - Title and creation/update times
  - Author information
  - Assignees
  - Reviewers with their review status

#### Filtering Options

- **"Only my PRs"**: Toggle this to see only PRs where you're involved
- **Refresh**: Manually refresh the PR list at any time

## 🔧 Troubleshooting

### Common Issues

#### "Authentication Failed" Error

- Verify your Personal Access Token hasn't expired
- Ensure the token has the required permissions
- Try regenerating a new token on GitHub

#### Pull Requests Not Showing

- Check that repositories are selected in settings
- Verify you have access to the repositories
- Try clicking the refresh button

#### Application Won't Start

- **Windows**: Check Windows Defender or antivirus settings
- **macOS**: Allow the app in System Preferences → Security & Privacy
- **Linux**: Ensure execution permissions are set

### Getting Help

If you encounter issues:

1. Check the [FAQ](https://github.com/pkshimizu/tell/wiki/FAQ)
2. Search [existing issues](https://github.com/pkshimizu/tell/issues)
3. Create a [new issue](https://github.com/pkshimizu/tell/issues/new) with details about your problem

## 🤝 Contributing

We welcome contributions! If you're interested in improving tell, please see our [Contributing Guide](CONTRIBUTING.md) for development setup and guidelines.

## 📝 License

tell is open source software licensed under the MIT License. See the LICENSE file for more details.

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/), [React](https://react.dev/), and [TypeScript](https://www.typescriptlang.org/)
- Icons from [React Icons](https://react-icons.github.io/react-icons/)
- UI components powered by [Material-UI](https://mui.com/)

---

<div align="center">
  Made with ❤️ by the tell team
  <br>
  <a href="https://github.com/pkshimizu/tell">GitHub</a> •
  <a href="https://github.com/pkshimizu/tell/issues">Issues</a> •
  <a href="https://github.com/pkshimizu/tell/discussions">Discussions</a>
</div>
