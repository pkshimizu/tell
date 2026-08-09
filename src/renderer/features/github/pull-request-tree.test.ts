import { describe, expect, it } from 'vitest'
import type { GitHubApiPullRequest } from '../../types/github'
import { buildPullRequestTree, type PullRequestTreeNode } from './pull-request-tree'

function createPullRequest(
  id: string,
  sourceBranch: string,
  targetBranch: string,
  repositoryName = 'repository'
): GitHubApiPullRequest {
  return {
    id,
    number: Number(id),
    owner: { login: 'owner', htmlUrl: '', avatarUrl: null },
    repository: { name: repositoryName, htmlUrl: '' },
    author: { name: 'author', htmlUrl: '', avatarUrl: '' },
    assignees: [],
    reviewers: [],
    title: id,
    htmlUrl: '',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    sourceBranch,
    targetBranch,
    statusChecks: null
  }
}

function simplify(nodes: PullRequestTreeNode[]): unknown[] {
  return nodes.map((node) => ({
    id: node.pullRequest.id,
    children: simplify(node.children)
  }))
}

describe('buildPullRequestTree', () => {
  it('builds a three-level stack', () => {
    const result = buildPullRequestTree([
      createPullRequest('1', 'one', 'main'),
      createPullRequest('2', 'two', 'one'),
      createPullRequest('3', 'three', 'two')
    ])

    expect(simplify(result)).toEqual([
      { id: '1', children: [{ id: '2', children: [{ id: '3', children: [] }] }] }
    ])
  })

  it('does not connect matching branches across repositories', () => {
    const result = buildPullRequestTree([
      createPullRequest('1', 'one', 'main', 'first'),
      createPullRequest('2', 'two', 'one', 'second')
    ])

    expect(simplify(result)).toEqual([
      { id: '1', children: [] },
      { id: '2', children: [] }
    ])
  })

  it('keeps a pull request at the root when its parent is absent', () => {
    const result = buildPullRequestTree([createPullRequest('1', 'one', 'missing')])

    expect(simplify(result)).toEqual([{ id: '1', children: [] }])
  })

  it('uses the first parent candidate in input order', () => {
    const result = buildPullRequestTree([
      createPullRequest('1', 'shared', 'main'),
      createPullRequest('2', 'shared', 'main'),
      createPullRequest('3', 'child', 'shared')
    ])

    expect(simplify(result)).toEqual([
      { id: '1', children: [{ id: '3', children: [] }] },
      { id: '2', children: [] }
    ])
  })

  it('does not make a pull request its own parent', () => {
    const result = buildPullRequestTree([createPullRequest('1', 'one', 'one')])

    expect(simplify(result)).toEqual([{ id: '1', children: [] }])
  })

  it('breaks cycles and includes every pull request once', () => {
    const result = buildPullRequestTree([
      createPullRequest('1', 'one', 'two'),
      createPullRequest('2', 'two', 'one')
    ])

    expect(simplify(result)).toEqual([{ id: '2', children: [{ id: '1', children: [] }] }])
  })

  it('preserves input order between siblings', () => {
    const result = buildPullRequestTree([
      createPullRequest('1', 'one', 'main'),
      createPullRequest('3', 'three', 'one'),
      createPullRequest('2', 'two', 'one')
    ])

    expect(simplify(result)).toEqual([
      {
        id: '1',
        children: [
          { id: '3', children: [] },
          { id: '2', children: [] }
        ]
      }
    ])
  })
})
