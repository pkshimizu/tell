import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  github: {
    createAccount: (personalAccessToken: string) =>
      ipcRenderer.invoke('github:createAccount', personalAccessToken),
    getAccounts: () => ipcRenderer.invoke('github:getAccounts'),
    getOwners: (accountId: number) => ipcRenderer.invoke('github:getOwners', accountId),
    getRepositories: (accountId: number, organizationLogin: string) =>
      ipcRenderer.invoke('github:getRepositories', accountId, organizationLogin),
    addRepository: (
      accountId: number,
      ownerLogin: string,
      ownerHtmlUrl: string,
      ownerAvatarUrl: string | null,
      repositoryName: string,
      repositoryHtmlUrl: string
    ) =>
      ipcRenderer.invoke(
        'github:addRepository',
        accountId,
        ownerLogin,
        ownerHtmlUrl,
        ownerAvatarUrl,
        repositoryName,
        repositoryHtmlUrl
      ),
    getRegisteredRepositories: (accountId: number, ownerLogin: string) =>
      ipcRenderer.invoke('github:getRegisteredRepositories', accountId, ownerLogin),
    removeRepository: (accountId: number, ownerLogin: string, repositoryName: string) =>
      ipcRenderer.invoke('github:removeRepository', accountId, ownerLogin, repositoryName),
    getPullRequests: (state: 'open' | 'closed') =>
      ipcRenderer.invoke('github:getPullRequests', state)
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
