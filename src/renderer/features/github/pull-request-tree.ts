import type { GitHubApiPullRequest } from '../../types/github'

export type PullRequestTreeNode = {
  pullRequest: GitHubApiPullRequest
  children: PullRequestTreeNode[]
}

function repositoryBranchKey(pullRequest: GitHubApiPullRequest, branch: string): string {
  return `${pullRequest.owner.login}/${pullRequest.repository.name}:${branch}`
}

function createsCycle(
  childId: string,
  parentId: string,
  parentByChildId: ReadonlyMap<string, string>
): boolean {
  let currentId: string | undefined = parentId
  const visited = new Set<string>()

  while (currentId) {
    if (currentId === childId) return true
    if (visited.has(currentId)) return true

    visited.add(currentId)
    currentId = parentByChildId.get(currentId)
  }

  return false
}

/**
 * Builds a display tree while preserving input order for roots and siblings.
 * A pull request is a child when its target branch matches another pull
 * request's source branch in the same repository.
 */
export function buildPullRequestTree(pullRequests: GitHubApiPullRequest[]): PullRequestTreeNode[] {
  const nodeById = new Map<string, PullRequestTreeNode>()
  const parentCandidatesByBranch = new Map<string, PullRequestTreeNode[]>()

  for (const pullRequest of pullRequests) {
    const node = { pullRequest, children: [] }
    nodeById.set(pullRequest.id, node)

    const sourceBranchKey = repositoryBranchKey(pullRequest, pullRequest.sourceBranch)
    const candidates = parentCandidatesByBranch.get(sourceBranchKey) ?? []
    candidates.push(node)
    parentCandidatesByBranch.set(sourceBranchKey, candidates)
  }

  const parentByChildId = new Map<string, string>()

  for (const pullRequest of pullRequests) {
    const targetBranchKey = repositoryBranchKey(pullRequest, pullRequest.targetBranch)
    const candidates = parentCandidatesByBranch.get(targetBranchKey) ?? []
    const parent = candidates.find(
      (candidate) =>
        candidate.pullRequest.id !== pullRequest.id &&
        !createsCycle(pullRequest.id, candidate.pullRequest.id, parentByChildId)
    )

    if (parent) {
      parentByChildId.set(pullRequest.id, parent.pullRequest.id)
    }
  }

  const roots: PullRequestTreeNode[] = []

  for (const pullRequest of pullRequests) {
    const node = nodeById.get(pullRequest.id)!
    const parentId = parentByChildId.get(pullRequest.id)
    const parent = parentId ? nodeById.get(parentId) : undefined

    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}
