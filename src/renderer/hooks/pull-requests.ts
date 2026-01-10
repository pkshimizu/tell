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
  fetchPullRequests: (state: 'open' | 'closed', forceRefresh?: boolean) => Promise<void>
  refreshPullRequests: (state: 'open' | 'closed') => Promise<void>
}

const usePullRequestsStore = create<PullRequestsStore>((set, get) => ({
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
  },

  fetchPullRequests: async (state: 'open' | 'closed', forceRefresh: boolean = false) => {
    const { pullRequests, setLoading, setPullRequests, setError } = get()

    // 既にデータがあり、強制リフレッシュでない場合はスキップ
    if (pullRequests.length > 0 && !forceRefresh) {
      return
    }

    setLoading(true)
    try {
      const result = await window.api.github.getPullRequests(state)
      if (result.success && result.data) {
        setPullRequests(result.data as GitHubApiPullRequest[])
      } else {
        setError(result.error || 'Failed to fetch pull requests')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  },

  refreshPullRequests: async (state: 'open' | 'closed') => {
    const { setRefreshing, setPullRequests, setError } = get()

    setRefreshing(true)
    try {
      const result = await window.api.github.getPullRequests(state)
      if (result.success && result.data) {
        setPullRequests(result.data as GitHubApiPullRequest[])
      } else {
        setError(result.error || 'Failed to fetch pull requests')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setRefreshing(false)
    }
  }
}))

export default function usePullRequests() {
  const store = usePullRequestsStore()

  return {
    pullRequests: store.pullRequests,
    loading: store.loading,
    refreshing: store.refreshing,
    lastFetchedAt: store.lastFetchedAt,
    error: store.error,
    fetchPullRequests: store.fetchPullRequests,
    refreshPullRequests: store.refreshPullRequests,
    clearPullRequests: store.clearPullRequests
  }
}
