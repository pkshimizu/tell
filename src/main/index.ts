import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  nativeImage,
  NativeImage,
  Menu
} from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '@resources/icon.png?asset'
import { githubService } from '@main/services/github-service'
import { githubStoreRepository } from '@main/repositories/store/settings/github-repository'
import { settingsService } from '@main/services/settings-service'
import { initializeStore, getStore } from '@main/store'
import { createOrShowDebugStoreWindow } from '@main/windows/debug-store'
import { WindowStateService } from '@main/services/window-state-service'

let windowStateService: WindowStateService | null = null

function createWindow(): void {
  // Use PNG icon for all platforms - simpler and more reliable
  let iconPath: string | NativeImage | undefined

  if (is.dev && process.platform === 'darwin') {
    // macOS in development needs nativeImage
    const projectRoot = resolve(__dirname, '..', '..')
    const devIconPath = join(projectRoot, 'build', 'icon.png')
    iconPath = nativeImage.createFromPath(devIconPath)
  } else {
    // Production and other platforms can use the imported icon directly
    iconPath = icon
  }

  // Get saved window state
  const windowState = windowStateService?.getWindowState() || {
    width: 900,
    height: 780,
    isMaximized: false,
    isFullScreen: false
  }

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 900,
    minHeight: 780,
    show: false,
    autoHideMenuBar: true,
    ...(iconPath && { icon: iconPath }), // アプリケーションアイコンを設定
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Restore maximized or fullscreen state
  if (windowState.isMaximized) {
    mainWindow.maximize()
  }
  if (windowState.isFullScreen) {
    mainWindow.setFullScreen(true)
  }

  // Start managing window state
  windowStateService?.manage(mainWindow)

  // ウィンドウ作成直後のサイズを確認し、必要に応じて修正
  const actualBounds = mainWindow.getBounds()
  if (windowState.height && Math.abs(actualBounds.height - windowState.height) > 10) {
    mainWindow.setSize(windowState.width, windowState.height)
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupApplicationMenu(): void {
  if (process.platform === 'darwin') {
    // macOS requires a menu bar, so create with app menu and edit menu
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: app.name,
        submenu: [
          {
            label: 'About ' + app.name,
            role: 'about'
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: () => {
              app.quit()
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'Command+Z',
            role: 'undo'
          },
          {
            label: 'Redo',
            accelerator: 'Command+Shift+Z',
            role: 'redo'
          },
          { type: 'separator' },
          {
            label: 'Cut',
            accelerator: 'Command+X',
            role: 'cut'
          },
          {
            label: 'Copy',
            accelerator: 'Command+C',
            role: 'copy'
          },
          {
            label: 'Paste',
            accelerator: 'Command+V',
            role: 'paste'
          },
          {
            label: 'Select All',
            accelerator: 'Command+A',
            role: 'selectAll'
          }
        ]
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  } else {
    // Windows and Linux - create minimal menu for keyboard shortcuts
    // Menu bar will be hidden due to autoHideMenuBar: true
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'Ctrl+Z',
            role: 'undo'
          },
          {
            label: 'Redo',
            accelerator: 'Ctrl+Shift+Z',
            role: 'redo'
          },
          { type: 'separator' },
          {
            label: 'Cut',
            accelerator: 'Ctrl+X',
            role: 'cut'
          },
          {
            label: 'Copy',
            accelerator: 'Ctrl+C',
            role: 'copy'
          },
          {
            label: 'Paste',
            accelerator: 'Ctrl+V',
            role: 'paste'
          },
          {
            label: 'Select All',
            accelerator: 'Ctrl+A',
            role: 'selectAll'
          }
        ]
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Initialize electron-store (ESM package requires dynamic import)
  await initializeStore()

  // Initialize window state service
  const store = getStore()
  windowStateService = new WindowStateService(store)

  // Set up custom application menu
  setupApplicationMenu()

  // Set app user model id for windows
  electronApp.setAppUserModelId('net.noncore.tell')

  // Set dock icon for macOS in development
  if (process.platform === 'darwin' && is.dev) {
    const projectRoot = resolve(__dirname, '..', '..')
    const iconPath = join(projectRoot, 'build', 'icon.png')
    const image = nativeImage.createFromPath(iconPath)
    if (!image.isEmpty()) {
      app.dock.setIcon(image)
    }
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // GitHub Service IPC handlers
  ipcMain.handle('settings:github:addAccount', async (_, personalAccessToken: string) => {
    try {
      const account = await settingsService.addGitHubAccount(personalAccessToken)
      return { success: true, data: account }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  })
  ipcMain.handle('settings:github:getAccounts', async () => {
    try {
      const accounts = githubStoreRepository.findAllAccounts()
      return { success: true, data: accounts }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  })
  ipcMain.handle('github:getOwners', async (_, accountId: string) => {
    try {
      const owners = await githubService.getOwners(accountId)
      return { success: true, data: owners }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  })
  ipcMain.handle('github:getRepositories', async (_, accountId: string, ownerLogin: string) => {
    try {
      const repositories = await githubService.getRepositories(accountId, ownerLogin)
      return { success: true, data: repositories }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  })
  ipcMain.handle(
    'settings:github:addRepository',
    async (
      _,
      accountId: string,
      ownerLogin: string,
      ownerHtmlUrl: string,
      ownerAvatarUrl: string | null,
      repositoryName: string,
      repositoryHtmlUrl: string
    ) => {
      try {
        const repository = await settingsService.addGitHubRepository(
          accountId,
          ownerLogin,
          ownerHtmlUrl,
          ownerAvatarUrl,
          repositoryName,
          repositoryHtmlUrl
        )
        return { success: true, data: repository }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    }
  )
  ipcMain.handle(
    'settings:github:getRepositories',
    async (_, accountId: string, ownerLogin: string) => {
      try {
        const repositories = await settingsService.getGitHubRepositories(accountId, ownerLogin)
        return { success: true, data: repositories }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    }
  )
  ipcMain.handle(
    'settings:github:removeRepository',
    async (_, accountId: string, ownerLogin: string, repositoryName: string) => {
      try {
        await settingsService.removeGitHubRepository(accountId, ownerLogin, repositoryName)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    }
  )
  ipcMain.handle('settings:github:getAllRegisteredRepositories', async () => {
    try {
      const repositories = settingsService.getAllRegisteredRepositories()
      return { success: true, data: repositories }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  })
  ipcMain.handle('github:getPullRequests', async (_, state: 'open' | 'closed') => {
    try {
      const pullRequests = await githubService.getPullRequests(state)
      return { success: true, data: pullRequests }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  })

  // App version IPC handler
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  // Theme IPC handlers
  ipcMain.handle('theme:get', async () => {
    try {
      const store = getStore()
      const theme = store.get('settings.theme.mode', 'system')
      return theme
    } catch (error) {
      console.error('Failed to get theme:', error)
      return 'system'
    }
  })

  ipcMain.handle('theme:set', async (_, mode: 'light' | 'dark' | 'system') => {
    try {
      const store = getStore()
      store.set('settings.theme.mode', mode)
      return { success: true }
    } catch (error) {
      console.error('Failed to set theme:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Pull Requests Settings IPC handlers
  ipcMain.handle('settings:pullRequests:get', async () => {
    try {
      const store = getStore()
      const settings = store.get('settings.pullRequests')
      return { success: true, data: settings }
    } catch (error) {
      console.error('Failed to get pull requests settings:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle(
    'settings:pullRequests:set',
    async (
      _,
      sortBy: 'createdAt' | 'updatedAt' | 'author',
      sortOrder: 'asc' | 'desc',
      reloadInterval: 1 | 3 | 5 | 10 | 15
    ) => {
      try {
        const store = getStore()
        store.set('settings.pullRequests', { sortBy, sortOrder, reloadInterval })
        return { success: true }
      } catch (error) {
        console.error('Failed to set pull requests settings:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  )

  // Debug Store IPC handlers (開発モードのみ)
  if (is.dev) {
    // electron-storeの全データを取得
    ipcMain.handle('debug:store:getAll', async () => {
      try {
        const store = getStore()
        const data = store.store
        // JSON文字列に変換してrendererに渡す
        const jsonString = JSON.stringify(data, null, 2)
        return { success: true, data: jsonString }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    })

    // electron-storeのconfig.jsonファイルを開く
    ipcMain.handle('debug:store:openConfig', async () => {
      try {
        const store = getStore()
        // electron-storeのpathプロパティでconfig.jsonのパスを取得
        const configPath = store.path
        // デフォルトのアプリケーションで開く
        await shell.openPath(configPath)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    })

    // キーボードショートカットの登録 (Cmd/Ctrl+Shift+D)
    globalShortcut.register('CommandOrControl+Shift+D', () => {
      createOrShowDebugStoreWindow()
    })
  }

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
