import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { UpdateSnapshot } from '@main/models/update'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  github: {
    getOwners: (accountId: number) => ipcRenderer.invoke('github:getOwners', accountId),
    getRepositories: (accountId: number, organizationLogin: string) =>
      ipcRenderer.invoke('github:getRepositories', accountId, organizationLogin),
    getPullRequests: (state: 'open' | 'closed') =>
      ipcRenderer.invoke('github:getPullRequests', state)
  },
  settings: {
    github: {
      addAccount: (personalAccessToken: string) =>
        ipcRenderer.invoke('settings:github:addAccount', personalAccessToken),
      getAccounts: () => ipcRenderer.invoke('settings:github:getAccounts'),
      addRepository: (
        accountId: number,
        ownerLogin: string,
        ownerHtmlUrl: string,
        ownerAvatarUrl: string | null,
        repositoryName: string,
        repositoryHtmlUrl: string
      ) =>
        ipcRenderer.invoke(
          'settings:github:addRepository',
          accountId,
          ownerLogin,
          ownerHtmlUrl,
          ownerAvatarUrl,
          repositoryName,
          repositoryHtmlUrl
        ),
      getRepositories: (accountId: number, ownerLogin: string) =>
        ipcRenderer.invoke('settings:github:getRepositories', accountId, ownerLogin),
      removeRepository: (accountId: number, ownerLogin: string, repositoryName: string) =>
        ipcRenderer.invoke(
          'settings:github:removeRepository',
          accountId,
          ownerLogin,
          repositoryName
        ),
      getAllRegisteredRepositories: () =>
        ipcRenderer.invoke('settings:github:getAllRegisteredRepositories'),
      updateAccountToken: (accountId: string, personalAccessToken: string) =>
        ipcRenderer.invoke('settings:github:updateAccountToken', accountId, personalAccessToken),
      deleteAccount: (accountId: string) =>
        ipcRenderer.invoke('settings:github:deleteAccount', accountId)
    },
    pullRequests: {
      get: () => ipcRenderer.invoke('settings:pullRequests:get'),
      set: (
        sortBy: 'createdAt' | 'updatedAt' | 'author',
        sortOrder: 'asc' | 'desc',
        reloadInterval: 1 | 3 | 5 | 10 | 15
      ) => ipcRenderer.invoke('settings:pullRequests:set', sortBy, sortOrder, reloadInterval)
    }
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion')
  },
  update: {
    getStatus: () => ipcRenderer.invoke('update:getStatus'),
    check: () => ipcRenderer.invoke('update:check'),
    install: () => ipcRenderer.invoke('update:install'),
    dismiss: (version: string) => ipcRenderer.invoke('update:dismiss', version),
    // 解除関数は ipcRenderer.on に渡したラッパーを外す（callback を渡しても外れない）
    onStatus: (callback: (snapshot: UpdateSnapshot) => void) => {
      const listener = (_: IpcRendererEvent, snapshot: UpdateSnapshot): void => callback(snapshot)
      ipcRenderer.on('update:status', listener)
      return () => {
        ipcRenderer.removeListener('update:status', listener)
      }
    }
  },
  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    set: (mode: 'light' | 'dark' | 'system') => ipcRenderer.invoke('theme:set', mode)
  },
  // Debug Store API (開発モードのみ)
  debug: {
    store: {
      getAll: () => ipcRenderer.invoke('debug:store:getAll'),
      openConfig: () => ipcRenderer.invoke('debug:store:openConfig')
    }
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
