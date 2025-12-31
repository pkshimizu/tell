# Pull Request Rules

## Branch Requirements

### 1. Feature Branch Only

- Pull requests must be created from `feature/*` branches only
- Verify current branch name matches the `feature/*` pattern
- If not matching, display error message: "Pull requests can only be created from feature/\* branches"
- Exit the process if branch pattern doesn't match

## Pull Request Content Generation

### 2. Analyze Commit History and Changes

- Use `git log main..HEAD --oneline` to review branch commit history
- Use `git diff main...HEAD` to review all changes in the branch
- Generate pull request title (1 line summary) and description from commits and changes

### 3. Follow Pull Request Template

- Follow the format defined in `.github/pull_request_template.md` if it exists
- **Summary**: One-line brief description of the pull request
- **Related Issue**: Only include if Issue ID can be determined
  - Format: `- fixes: https://github.com/{owner}/{repo}/issues/{issue_id}`
- **Details**: List specific additions and changes as bullet points

## Creation Process

### 4. Create Pull Request

- Push to remote if branch doesn't exist: `git push -u origin {branch_name}`
- Create pull request using `gh pr create` command
- Use `main` as the base branch
- Display the pull request URL after creation

## Step-by-Step Procedure

1. Verify current branch name matches `feature/*` pattern
2. Analyze branch changes using `git log` and `git diff`
3. Generate pull request title and description
4. Check remote branch existence and push if needed
5. Create pull request with `gh pr create`
6. Display the created pull request URL

## Language and Style Guidelines

- Write pull request content in Japanese for this project
- Base descriptions on commit messages, keeping them clear and concise
- Organize technical details as bullet points
- Use clear, descriptive language that explains the "why" not just the "what"
