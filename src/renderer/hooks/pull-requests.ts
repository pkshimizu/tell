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
  setPullRequests: (pullRequests: GitHubApiPullRequest[]) => void
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  setError: (error: string | null) => void
  clearPullRequests: () => void
}

const usePullRequestsStore = create<PullRequestsStore>((set) => ({
  // Initial state
  pullRequests: [],
  loading: false,
  refreshing: false,
  lastFetchedAt: null,
  error: null,

  // Actions
  setPullRequests: (pullRequests: GitHubApiPullRequest[]) => {
    set({
      pullRequests,
      lastFetchedAt: new Date(),
      error: null
    })
  },

  setLoading: (loading: boolean) => {
    set({ loading })
  },

  setRefreshing: (refreshing: boolean) => {
    set({ refreshing })
  },

  setError: (error: string | null) => {
    set({ error })
    // エラーが発生してもpullRequestsは保持する（既存データを維持）
  },

  clearPullRequests: () => {
    set({
      pullRequests: [],
      lastFetchedAt: null,
      error: null
    })
  }
}))

export default function usePullRequests() {
  const store = usePullRequestsStore()

  const fetchPullRequests = async (state: 'open' | 'closed', forceRefresh: boolean = false) => {
    // 既にデータがあり、強制リフレッシュでない場合はスキップ
    if (store.pullRequests.length > 0 && !forceRefresh) {
      return
    }

    store.setLoading(true)
    try {
      const result = await window.api.github.getPullRequests(state)
      if (result.success && result.data) {
        store.setPullRequests(result.data as GitHubApiPullRequest[])
      } else {
        store.setError(result.error || 'Failed to fetch pull requests')
      }
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      store.setLoading(false)
    }
  }

  const refreshPullRequests = async (state: 'open' | 'closed') => {
    store.setRefreshing(true)
    try {
      const result = await window.api.github.getPullRequests(state)
      if (result.success && result.data) {
        store.setPullRequests(result.data as GitHubApiPullRequest[])
      } else {
        store.setError(result.error || 'Failed to fetch pull requests')
      }
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      store.setRefreshing(false)
    }
  }

  return {
    pullRequests: store.pullRequests,
    loading: store.loading,
    refreshing: store.refreshing,
    lastFetchedAt: store.lastFetchedAt,
    error: store.error,
    fetchPullRequests,
    refreshPullRequests,
    clearPullRequests: store.clearPullRequests
  }
}
