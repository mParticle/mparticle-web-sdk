---
name: handoff
description: Generate handoff document for session context transfer and delegation. Use when user says /handoff, create handoff, hand off to new session, delegate to new session, transfer context, save session context, pass context, session handoff, context snapshot, prepare handoff, handoff document. Creates handoff-<task>-<YYYYMMDD>.md with prompt, instructions, ranked @file references, git context, working directory. Companion to /kickstart for complete context transfer workflow.
---

# Handoff

Generate a handoff document that serves as the prompt for a new focused session.

## Core Principles

**Context preservation**: Capture the "why" not just the "what" — decisions, constraints, blockers
**Relevance ranking**: Score files by recency, frequency, and goal alignment to avoid context overload
**Companion to /kickstart**: Complete context transfer workflow: `/handoff` creates, `/kickstart` restores

## Usage

```text
/handoff <goal>
```

**Example:** `/handoff fix the OAuth token refresh tests`

## Workflow

### Step 1: Parse Goal

Extract the goal from user input. This becomes the prompt for the new session.

### Step 2: Resolve Session ID

Check the conversation context for the current session ID (e.g., from a previous `/status` output). If the session ID is not available in context, **ask the user to run `/status`** before proceeding. Do not skip this or use a placeholder — the parent session ID is required for session genealogy tracing.

### Step 3: Scan Session for Files

Review the current session context for all file mentions:

- Files that were read (via Read tool)
- Files that were edited (via Edit tool)
- Files found in search results (via Grep/Glob)
- Files mentioned in conversation

### Step 4: Rank Files by Relevance

Score each file based on:

**Recency (40%):** Files mentioned recently rank higher

- Last 5 interactions: 1.0
- Last 10 interactions: 0.7
- Earlier: 0.4

**Frequency (30%):** Files mentioned multiple times rank higher

- 3+ mentions: 1.0
- 2 mentions: 0.7
- 1 mention: 0.4

**Goal Alignment (30%):** File path/name matches goal keywords

- Strong match: 1.0
- Partial match: 0.5
- No match: 0.1

### Step 5: Select Top Files

Choose top 5-10 files based on ranking. Prioritize:

- Files directly related to the goal
- Files that were actively edited
- Entry points and key interfaces

Exclude:

- Generated files, node_modules, build artifacts
- Files only tangentially mentioned
- Files over 1000 lines (prefer smaller, focused files; if a large file is essential, include it but note its size)

### Step 6: Extract Instructions

Summarize relevant context for the goal:

- What was being worked on
- Key decisions made
- Important constraints or requirements
- Any blockers or issues discovered
- Relevant architecture/design context

Keep instructions concise (3-10 bullet points). Focus on "why" context, not just "what".

### Step 7: Generate Handoff Document

Create `handoff-<task-name>-<YYYYMMDD>.md` where:

- task-name is derived from the goal (kebab-case, max 30 chars)
- YYYYMMDD is today's date for human readability

Generate date with: `date +%Y%m%d`

If a file with the same name already exists, append a sequence number: `-2`, `-3`, etc.

## Handoff Format (v1)

```markdown
# Handoff: <goal>

<!-- Handoff Format: v1 -->
<!-- Parent: {current session ID from context} -->
<!-- Created: {ISO timestamp} -->
<!-- Project: {absolute path to cwd} -->

## Prompt

<goal restated as clear instruction for the new session>

## Instructions

<relevant context extracted from session as bullet points>

- Key context point 1
- Key context point 2
- Important constraint or decision
- ...

## Relevant Files

@path/to/file1.ts
@path/to/file2.ts
@path/to/file3.ts
...

## Git Context

Branch: {current git branch name}
Uncommitted: {count} files
Recent commits:

- {commit subject 1}
- {commit subject 2}

## Working Directory

{absolute path to current working directory}
```

### Session Metadata

The HTML comment block preserves session genealogy:

- **Handoff Format**: Version tag for forward compatibility
- **Parent**: The current session ID, resolved in Step 2. Required for tracing session chains from parent to child.
- **Created**: ISO timestamp for when handoff was generated
- **Project**: The absolute working directory path

### Git Context Details

Capture git state to help the new session verify environment:

- Run `git branch --show-current` for branch name
- Run `git status --porcelain | wc -l` for uncommitted file count
- Run `git log --oneline -3` for recent commit subjects
- If no git repo, omit this section entirely

## Example Output

```markdown
# Handoff: Fix OAuth token refresh tests

<!-- Handoff Format: v1 -->
<!-- Parent: abc123-def456-session-id -->
<!-- Created: 2026-02-07T14:30:00Z -->
<!-- Project: /Users/dev/workspace/auth-service -->

## Prompt

Fix the failing OAuth token refresh tests in the authentication module. The tests are timing out due to mock configuration issues.

## Instructions

- The OAuth service uses a singleton pattern in `src/auth/oauth-service.ts`
- Token refresh logic is in the `refreshToken()` method
- Tests were failing because the mock timer wasn't advancing properly
- Need to use `jest.useFakeTimers()` with `modern` mode
- The `TokenStore` interface was recently updated to be async

## Relevant Files

@src/auth/oauth-service.ts
@src/auth/**tests**/oauth-service.test.ts
@src/auth/token-store.ts
@src/auth/types.ts

## Git Context

Branch: fix/oauth-refresh-tests
Uncommitted: 2 files
Recent commits:

- refactor: extract token validation logic
- feat: add async TokenStore interface
- test: add initial OAuth service tests

## Working Directory

/Users/dev/workspace/auth-service
```

## File Location

Save the handoff document to the **current working directory** with filename:
`handoff-<task-name>-<YYYYMMDD>.md`

Example: `handoff-oauth-tests-20260207.md`

The date suffix provides human readability and chronological ordering.

## Post-Generation Actions

After writing the handoff document, perform these steps:

### 1. Copy Start Command to Clipboard

Generate the kickstart command with **absolute path** and copy to clipboard.

**macOS:**

```bash
echo 'cc "/kickstart /absolute/path/to/handoff-<task-name>-<YYYYMMDD>.md"' | pbcopy
```

**Linux:**

```bash
echo 'cc "/kickstart /absolute/path/to/handoff-<task-name>-<YYYYMMDD>.md"' | xclip -selection clipboard
```

If clipboard command fails (e.g. no `pbcopy`/`xclip` available), skip silently and display the command for manual copy instead.

### 2. Display Success Message

Output to terminal:

```
Handoff created: handoff-<task-name>-<YYYYMMDD>.md

Start command (copied to clipboard):
   cc "/kickstart /absolute/path/to/handoff-<task-name>-<YYYYMMDD>.md"

Next: Open new terminal -> paste -> enter
```

If clipboard copy failed:

```
Handoff created: handoff-<task-name>-<YYYYMMDD>.md

Start a new session with:
   cc "/kickstart /absolute/path/to/handoff-<task-name>-<YYYYMMDD>.md"
```

### 3. Open in Editor (Optional Review)

If the user has `cursor` or `code` available, offer to open for review.

**Note:** The current session stays open, allowing multiple handoffs for different goals.

## Notes

- The @file syntax allows the new session to quickly load relevant context
- Keep the file list focused (5-10 files) to avoid overwhelming the new session
- Instructions should provide "why" context, not just "what"
- The goal in the Prompt section can be expanded/clarified from the user's input
- The companion `/kickstart` skill initializes a new session from a handoff document
- Old handoff files can be safely deleted once the new session is established

## Success Criteria

- [ ] Handoff file created with all sections (Prompt, Instructions, Relevant Files, Git Context, Working Directory)
- [ ] Session metadata includes parent session ID (not a placeholder)
- [ ] Files ranked and top 5-10 selected by relevance scoring
- [ ] Instructions capture "why" context (decisions, constraints, blockers)
- [ ] Kickstart command copied to clipboard or displayed for manual copy

## Self-Improvement

**Update triggers**:

- New sections needed by `/kickstart` (keep format in sync)
- File ranking heuristics need tuning (adjust weights)
- New post-generation actions (e.g., git stash, branch creation)

**Discoveries**:
