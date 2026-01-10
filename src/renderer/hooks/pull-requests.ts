import { create } from 'zustand/react'
import { GitHubApiPullRequest } from '@renderer/types/github'

type PullRequestsStore = {
  // State
  pullRequests: GitHubApiPullRequest[]
  loading: boolean
  refreshing: boolean
  lastFetchedAt: Date | null
  error: string | null

  // Actions
  fetchPullRequests: (state: 'open' | 'closed', forceRefresh?: boolean) => Promise<void>
  refreshPullRequests: (state: 'open' | 'closed') => Promise<void>
  clearPullRequests: () => void
}

const usePullRequests = create<PullRequestsStore>((set, get) => ({
  // Initial state
  pullRequests: [],
  loading: false,
  refreshing: false,
  lastFetchedAt: null,
  error: null,

  // Actions
  fetchPullRequests: async (state: 'open' | 'closed', forceRefresh: boolean = false) => {
    const { pullRequests } = get()

    // 既にデータがあり、強制リフレッシュでない場合はスキップ
    if (pullRequests.length > 0 && !forceRefresh) {
      return
    }

    set({ loading: true })
    try {
      const result = await window.api.github.getPullRequests(state)
      if (result.success && result.data) {
        set({
          pullRequests: result.data as GitHubApiPullRequest[],
          lastFetchedAt: new Date(),
          error: null
        })
      } else {
        set({ error: result.error || 'Failed to fetch pull requests' })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error occurred' })
    } finally {
      set({ loading: false })
    }
  },

  refreshPullRequests: async (state: 'open' | 'closed') => {
    set({ refreshing: true })
    try {
      const result = await window.api.github.getPullRequests(state)
      if (result.success && result.data) {
        set({
          pullRequests: result.data as GitHubApiPullRequest[],
          lastFetchedAt: new Date(),
          error: null
        })
      } else {
        set({ error: result.error || 'Failed to fetch pull requests' })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error occurred' })
    } finally {
      set({ refreshing: false })
    }
  },

  clearPullRequests: () => {
    set({
      pullRequests: [],
      lastFetchedAt: null,
      error: null
    })
  }
}))

export default usePullRequests
