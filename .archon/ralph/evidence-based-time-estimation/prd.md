# Evidence-Based Time Estimation — Product Requirements

## Overview

**Problem**: The current task estimator uses broad category defaults, such as 10 minutes for any moderate coding task, then multiplies only by complexity. That makes estimates misleading for real software work because human developers spend time on comprehension, editing, review, testing, and debugging, while AI agents can generate many lines quickly but still need verification time.
**Solution**: Add an evidence-based estimation model that distinguishes human, AI-assisted human, and AI-agent work, uses calibrated software-development baselines, exposes task details through tools, and reports confidence/source metadata so users can tell when an estimate is grounded or learned.
**Branch**: `ralph/evidence-based-time-estimation`

---

## Goals & Success

### Primary Goal
Make `temporal_estimate` produce materially more realistic software-task estimates by using research-backed baselines, actor-specific speed factors, and local learning instead of a single category-duration table.

### Success Metrics
| Metric | Target | How Measured |
|--------|--------|--------------|
| Baseline transparency | Every software estimate includes baseline source, actor profile, and calibration method | Unit tests against `DurationEstimate` metadata |
| Actor-aware timing | Same coding task returns different expected ranges for `human`, `ai-assisted-human`, and `ai-agent` profiles | Unit tests for monotonic expected duration ordering |
| Local calibration preservation | Historical task learning still overrides default baselines only when confidence exceeds existing threshold | Tests around `TaskTimeEstimator.getBaseline()` behavior |
| Public tool usability | `temporal_estimate` accepts optional task detail inputs without breaking existing category/complexity calls | Tool registration tests or direct execute smoke tests |

### Non-Goals (Out of Scope)
- Full project-management forecasting from issues, PRs, and calendars — this PRD targets single-task duration estimates first.
- Automatic codebase diff analysis or LOC counting — task detail fields can support size hints, but no repository mining is required for MVP.
- Replacing DORA or SPACE productivity analytics — those are team-level measurement systems, not per-task estimator outputs.

---

## User & Context

### Target User
- **Who**: Developers and AI-agent operators using OpenClaw temporal tools to plan work.
- **Role**: They ask an assistant to estimate, schedule, or prioritize software tasks before implementation.
- **Current Pain**: Estimates collapse very different activities into the same number; a simple generated TypeScript helper and a human-authored feature with tests can both look like "moderate coding."

### User Journey
1. **Trigger**: The user asks how long a coding, testing, debugging, documentation, or review task will take.
2. **Action**: The agent calls `temporal_estimate` with category, complexity, actor profile, and optional task details such as operation type, expected files, lines, test scope, and verification level.
3. **Outcome**: The user receives a range that reflects human-vs-AI execution differences, verification overhead, historical samples, and baseline confidence.

---

## UX Requirements

### Interaction Model
This is a backend/tooling feature. Users interact through OpenClaw tools registered in `src/tools/temporal-tools.ts`, especially `temporal_estimate` and `temporal_schedule_task`. Existing calls with only `category` and `complexity` must keep working.

### States to Handle
| State | Description | Behavior |
|-------|-------------|----------|
| Empty | Caller provides only category and complexity | Fall back to current-compatible estimate plus baseline metadata |
| Loading | Tool execution while estimate is computed | No streaming state required; calculation is synchronous |
| Error | Caller passes unsupported actor or task subtype | Return a validation error through the tool parameter schema before estimator execution |
| Success | Estimate computed | Return min/expected/max, confidence, human-readable values, baseline metadata, and actor-specific notes |

---

## Research Baseline

External research used for MVP baseline assumptions:
- GitHub/Microsoft randomized experiment: developers completing a JavaScript HTTP server task with Copilot finished 55.8% faster than the control group. Source: https://arxiv.org/abs/2302.06590
- GitHub 2024 RCT: Copilot users writing API endpoints had 53.2% greater likelihood of passing all unit tests and produced more readable code, but the result is task-specific. Source: https://github.blog/news-insights/research/does-github-copilot-improve-code-quality-heres-what-the-data-says/
- DORA 2026 AI-assisted SDLC analysis: AI accelerates initial code generation, but time saved is often reallocated to prompting, auditing, and verification; 30% of developers report little or no trust in AI-generated code. Source: https://dora.dev/insights/balancing-ai-tensions/
- GitHub/CodeQL coding-time research: commit intervals are not equivalent to active coding time; short intervals often indicate uninterrupted coding, while longer intervals include breaks. Source: https://codeql.github.com/publications/measuring-software-development.pdf

Baseline interpretation for this codebase:
- Human software work should include comprehension, implementation, local verification, and review overhead.
- AI-agent work should be faster at generation but must include explicit verification overhead, especially for unfamiliar code and tests.
- AI-assisted-human work should use a speedup factor near the Copilot controlled-task result only for small, well-scoped implementation tasks; complex integration should receive a smaller speedup.

---

## Technical Context

### Patterns to Follow
- **Similar implementation**: `src/constants.ts:20` — complexity multipliers are centralized as `Record<TaskComplexity, number>` constants.
- **Similar implementation**: `src/constants.ts:29` — current category baselines live in `BASE_DURATION_MS` and should remain available for backward compatibility.
- **Estimator pattern**: `src/engines/task-estimator.ts:18` — `TaskTimeEstimator` owns config, state, learned baselines, and estimate calculation.
- **Learning pattern**: `src/engines/task-estimator.ts:39` — task history initializes learned baselines keyed by category and complexity.
- **Confidence pattern**: `src/utils/confidence.ts:11` — confidence is derived from relevant history, sample count, and recency.
- **Tool pattern**: `src/tools/temporal-tools.ts:51` — `temporal_estimate` defines JSON-schema-like parameters and calls `ctx.taskEstimator.estimate()`.
- **Config pattern**: `src/types.ts:214` and `src/constants.ts:100` — estimator config is optional and defaults are merged in constructors/constants.
- **Docs pattern**: `README.md:85` — tool descriptions and examples should be updated in the existing README sections.

### Types & Interfaces
```typescript
export type TaskCategory =
  | "research" | "coding" | "writing" | "analysis" | "communication"
  | "scheduling" | "file-operations" | "web-browsing" | "other";

export type TaskComplexity =
  | "trivial" | "simple" | "moderate" | "complex" | "highly-complex";

export interface DurationEstimate {
  minimumMs: number;
  expectedMs: number;
  maximumMs: number;
  confidence: number;
  basedOnSamples: number;
  category: TaskCategory;
  complexity: TaskComplexity;
  humanReadable?: {
    minimum: string;
    expected: string;
    maximum: string;
  };
}

export interface TaskEstimatorConfig {
  enabled?: boolean;
  learningRate?: number;
  confidenceDecayDays?: number;
  minSamplesForEstimate?: number;
}
```

### Architecture Notes
- Add new estimator types in `src/types.ts` instead of local-only interfaces so tools, scheduler, and downstream users can share them.
- Add calibrated constants in `src/constants.ts`, keeping `BASE_DURATION_MS` intact for non-software categories and compatibility.
- Extend `TaskTimeEstimator.estimate()` with an optional detail object rather than replacing the current signature.
- Preserve learned-baseline behavior from `src/engines/task-estimator.ts:64`: learned history with enough confidence should still take precedence over defaults.
- Add validation enums beside `TASK_CATEGORIES` and `TASK_COMPLEXITIES` in `src/tools/temporal-tools.ts:34`.
- The package currently defines `npm run build` only in `package.json:12`; validation commands in this Ralph workflow may need script additions or mapped equivalents before story completion.
- No `CLAUDE.md` rules were present in the repository root during exploration.

---

## Implementation Summary

### Story Overview
| ID | Title | Priority | Dependencies |
|----|-------|----------|--------------|
| US-001 | Add estimation domain types and calibrated constants | 1 | — |
| US-002 | Apply actor-aware baseline calculation in the estimator | 2 | US-001 |
| US-003 | Expose task-detail inputs through temporal tools | 3 | US-002 |
| US-004 | Add focused estimator tests and package scripts | 4 | US-003 |
| US-005 | Document evidence-based estimation behavior | 5 | US-004 |

### Dependency Graph
```
US-001 (types/constants)
    ↓
US-002 (estimator)
    ↓
US-003 (tool/API inputs)
    ↓
US-004 (tests/scripts)
    ↓
US-005 (docs)
```

---

## Validation Requirements

Every story must pass:
- [ ] Type-check: `bun run type-check`
- [ ] Lint: `bun run lint`
- [ ] Tests: `bun run test`
- [ ] Format: `bun run format:check`

Repository note: current `package.json` only defines `build`; US-004 should add or reconcile the validation scripts so these commands are meaningful.

---

*Generated: 2026-04-29T17:58:55Z*
