---
name: session-recap
description: Fast context restoration after interruptions/silence (5+ minutes idle)/break/away/pause with executive summary/status update/where we left off/what was I doing/what's the status/what's done/what's next/current state/resume work/continue work/back from break/recap session/summarize progress/quick update when user returns and needs instant reorientation without scrolling through history
---

# Session Recap

## Purpose

Auto-invoke after 5+ minutes of silence following significant output. Restore context instantly with executive-style summary. Get user back in flow fast.

## Core Principles

**Brevity wins** - 2-3 sentences max. No scrolling. No filler.

**Status over history** - What's done, what's next. Not what we discussed.

**Action-oriented** - Always end with clear next step.

## Execution Strategy

### Detection (Auto-invoke when)

**Silence signals:**
- 5+ minutes idle after major output (skill creation, large code changes, analysis)
- User returns with vague continuation ("continue", "what next", "resume")
- Context loss indicators ("wait what were we doing")

**Skip when:**
- Quick back-and-forth conversation
- User asks specific new question
- Less than 3 messages in session

### Recap Generation

**Extract essentials:**
- Last completed action (what shipped)
- Current todo status (done vs in progress)
- Key artifacts created (files, outputs, decisions)

**Executive format:**
```
Shipped: [What got done in 1 sentence]
Status: [X complete, Y in progress]
Next: [Clear action item]
```

**Winning words:** Shipped. Completed. Built. Delivered. Ready. Done. Next.

**No words:** We discussed. I think. Maybe. Possibly. Might.

### Output

Present inline. No file creation. Fast reorientation only.

## Common Patterns

**Pattern: Skill creation recap**
```
Shipped: Tool Reuse Optimizer skill for max-speed execution.
Status: 3 skills created, all validated.
Next: Another prompt-focused skill or move to slash commands.
```

**Pattern: Code change recap**
```
Shipped: Refactored DashboardMetricsCard with Empty states.
Status: Tests passing, ready for commit.
Next: Create PR or continue with analytics card.
```

**Pattern: Investigation recap**
```
Shipped: Found 5 performance bottlenecks in chart rendering.
Status: Analysis complete, fix plan ready.
Next: Implement useMemo optimizations.
```

## Common Pitfalls

**Too much detail** - Explaining reasoning. User just needs orientation.

**Passive language** - "We looked at" instead of "Analyzed".

**Missing next step** - Leaving user wondering what to do.

**Premature invocation** - Interrupting active conversation flow.

## Success Criteria

User instantly knows:
- What got accomplished
- Where things stand
- What to do next

Evidence: User responds with action, not "remind me what we were doing"

Recap is under 3 sentences. Direct. Confident. Winning.

## Self-Improvement

**CRITICAL**: Update this file when you discover:
- Better timing signals for auto-invoke
- Winning word patterns that land harder
- Context clues that improve accuracy
- Situations where recap isn't helpful
