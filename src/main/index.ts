import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '@resources/icon.png?asset'
import { githubService } from '@main/services/github-service'
import { githubStoreRepository } from '@main/repositories/store/settings/github-repository'
import { settingsService } from '@main/services/settings-service'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 780,
    minWidth: 900,
    minHeight: 780,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // GitHub Service IPC handlers
  ipcMain.handle('github:createAccount', async (_, personalAccessToken: string) => {
    try {
      const account = await settingsService.createAccount(personalAccessToken)
      return { success: true, data: account }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  })
  ipcMain.handle('github:getAccounts', async () => {
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
    'github:addRepository',
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
        const repository = await settingsService.addRepository(
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
    'github:getRegisteredRepositories',
    async (_, accountId: string, ownerLogin: string) => {
      try {
        const repositories = await settingsService.getRegisteredRepositories(accountId, ownerLogin)
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
    'github:removeRepository',
    async (_, accountId: string, ownerLogin: string, repositoryName: string) => {
      try {
        await settingsService.removeRepository(accountId, ownerLogin, repositoryName)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    }
  )
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
