---
name: kickstart
description: Initialize session from handoff document with context restore, file loading, environment verification. Use when user says /kickstart, load handoff, start from handoff, begin from handoff, resume from handoff, restore session, reload context, session init, fresh session, new session from handoff, continue from handoff, pick up where I left off, kickstart session. Reads handoff-*.md files created by /handoff skill. Verifies git branch, working directory, loads @file references, presents instructions summary.
---

# Kickstart

Initialize a new session from a handoff document created by `/handoff`.

## Core Principles

**Context maximization**: Clear conversation before loading to give handoff files maximum context budget
**Graceful degradation**: Warn on mismatches but proceed — user decides whether to fix
**Companion to /handoff**: Complete context handoff workflow: `/handoff` creates, `/kickstart` restores

## Usage

```text
/kickstart [path-to-handoff.md]
/kickstart                        # Uses most recent handoff-*.md in cwd
```

**Examples:**

- `/kickstart handoff-oauth-tests-20260207.md`
- `/kickstart` (auto-finds latest handoff file)

## Execution

### Step 0: Clear Context

Ask user to run `/clear` to flush conversation context. Wait for confirmation before proceeding.

Example prompt:

```text
Before loading the handoff, please run /clear to free up context space.
Let me know when done and I'll continue.
```

### Step 1: Find Handoff File

**If path provided:** Use that file directly.

**If no path provided:** Find most recent handoff file in the current working directory:

```bash
find . -maxdepth 1 -name 'handoff-*.md' -print0 | xargs -0 ls -t 2>/dev/null | head -1
```

**If no handoff file found**, report error:

```text
No handoff file found. Specify a path or ensure handoff-*.md exists in the current directory.
```

### Step 2: Read and Parse Handoff Document

Read the handoff file and extract these sections:

- **Session Metadata** (HTML comment): Parent session ID, creation timestamp, project path
- **Prompt**: The goal/task for this session
- **Instructions**: Context bullet points
- **Relevant Files**: @file references to load
- **Git Context**: Branch, uncommitted files, recent commits
- **Working Directory**: Expected working directory

If required sections (Prompt, Relevant Files) are missing, warn but proceed:

```text
Warning: Handoff file appears incomplete. Missing sections: Prompt
Proceeding with available information...
```

### Step 3: Verify Environment

Run these checks in order (directory first, then git state):

**Working Directory Check:**

- Compare current working directory with handoff's Working Directory
- If different, warn:

  ```text
  Warning: Working directory mismatch:
     Expected: /Users/dev/workspace/auth-service
     Current:  /Users/dev

  Consider: cd /Users/dev/workspace/auth-service
  ```

**Git Branch Check:**

- Run `git branch --show-current` to get current branch
- Compare with handoff's Git Context branch
- If different, warn:

  ```text
  Warning: Git branch mismatch:
     Expected: fix/oauth-refresh-tests
     Current:  main

  Consider: git checkout fix/oauth-refresh-tests
  ```

**Uncommitted Changes Check:**

- Run `git status --porcelain | wc -l` to count uncommitted files
- If count differs significantly from handoff, note it (informational only)

### Step 4: Load Context Files

For each @file in the Relevant Files section:

- Read the file using the Read tool
- If a file exceeds 500 lines, read only the first 200 lines and note the truncation
- Track results: files loaded successfully vs. files that failed (moved/deleted)
- If a file fails to load, log a warning and continue with remaining files

Report loading summary:

```text
Loaded 4/5 files (1 not found: @src/auth/old-file.ts)
```

### Step 5: Present Instructions

Read the Instructions section and present key context points as part of the initialization summary. These provide context about:

- What was being worked on
- Key decisions made
- Important constraints or requirements
- Blockers or issues discovered

### Step 6: Confirm Ready

Output session initialization summary:

```text
Session initialized from handoff-oauth-tests-20260207.md

Goal: Fix the failing OAuth token refresh tests in the authentication module

Context loaded:
- 5 instruction points
- 4/4 files loaded

Environment:
- Working directory: matches
- Git branch: fix/oauth-refresh-tests

Parent session: abc123-def456-session-id
Handoff created: 2026-02-07T14:30:00Z

Ready to begin. What's the first step?
```

If there were warnings (directory mismatch, branch mismatch, missing files), include them before "Ready to begin".

## Error Handling

**Handoff File Not Found**:

```text
Handoff file not found: handoff-missing.md

Try:
- Check the filename spelling
- Run: ls handoff-*.md to see available handoff files
- Run /kickstart without arguments to use the most recent handoff
```

**Files No Longer Exist**:

```text
Warning: Some files from handoff no longer exist:
- @src/auth/old-file.ts (not found)

Loaded 3 of 4 files successfully.
```

## Notes

- Companion to `/handoff` for a complete context handoff workflow
- Session metadata enables tracing session genealogy (parent -> child sessions)
- Environment checks are warnings only — user decides whether to switch directories/branches
- If running `/kickstart` in a fresh terminal, you may need to `cd` to the project first
- Files over 500 lines are partially loaded (first 200 lines) to avoid overwhelming context

## Success Criteria

- [ ] Handoff file located and parsed successfully
- [ ] All required sections extracted (Prompt, Instructions, Relevant Files, Git Context)
- [ ] Environment verified (working directory, git branch, uncommitted changes)
- [ ] Context files loaded (with warnings for missing files)
- [ ] Initialization summary presented with goal, context count, and environment status
- [ ] User informed of any mismatches or warnings before starting work

## Self-Improvement

**Update triggers**:

- New handoff format fields added by `/handoff` skill (keep parser in sync)
- Common failure patterns during kickstart (add to Error Handling)
- User feedback on missing context after kickstart (improve file loading strategy)

**Discoveries**:
