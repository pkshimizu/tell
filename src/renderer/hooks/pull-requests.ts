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
    store.setError(null) // Clear previous errors
    try {
      const result = await window.api.github.getPullRequests(state)
      if (result.success && result.data) {
        store.setPullRequests(result.data as GitHubApiPullRequest[])
      } else {
        store.setError(result.error || 'Failed to fetch pull requests')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      store.setError(errorMessage)
      console.error('Failed to fetch pull requests:', err)
    } finally {
      store.setLoading(false)
    }
  }

  const refreshPullRequests = async (state: 'open' | 'closed') => {
    store.setRefreshing(true)
    // Don't clear error on refresh to keep showing previous errors until successful
    try {
      const result = await window.api.github.getPullRequests(state)
      if (result.success && result.data) {
        store.setPullRequests(result.data as GitHubApiPullRequest[])
        store.setError(null) // Clear error only on successful fetch
      } else {
        store.setError(result.error || 'Failed to refresh pull requests')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      store.setError(errorMessage)
      console.error('Failed to refresh pull requests:', err)
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
