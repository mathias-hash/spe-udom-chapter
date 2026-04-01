# Agile Workflow

This project uses a lightweight Agile process designed for a small team delivering a Django backend and React frontend together.

## Goals

- Deliver working software in small increments
- Keep backend, frontend, and security work aligned
- Make planning, review, and improvement part of the normal workflow

## Roles

- `Product Owner`: sets priorities and accepts completed work
- `Scrum Master / Team Lead`: runs the process and removes blockers
- `Developers`: build, test, document, and verify features
- `Stakeholders`: admins, chapter leadership, and end users who give feedback

One person can cover multiple roles if the team is small.

## Sprint Cadence

- Sprint length: `2 weeks`
- Planning: first day of sprint
- Standup: `15 minutes`, at least 3 times per week
- Backlog refinement: mid-sprint
- Review/demo: last working day of sprint
- Retrospective: after the review

## Board States

- `Backlog`
- `Ready`
- `In Progress`
- `In Review`
- `In Testing`
- `Done`

Rules:

- Pull work only from `Ready`
- Prefer one active task per developer
- Move to `Done` only after acceptance criteria are satisfied

## Work Item Types

- `Epic`
- `Story`
- `Task`
- `Bug`
- `Spike`

## Story Format

`As a <role>, I want <goal>, so that <benefit>.`

Every story should include:

- Acceptance criteria
- Estimate
- Priority
- Dependencies
- Test notes

Use [agile/story-template.md](./agile/story-template.md).

## Estimation

Use story points:

- `1` tiny
- `2` small
- `3` medium
- `5` complex
- `8` large
- `13` too large, split it

## Definition Of Ready

A story is ready when:

- Outcome is clear
- Acceptance criteria are written
- Scope fits in one sprint
- Dependencies are understood
- Testing approach is known

## Definition Of Done

A story is done when:

- Code is implemented
- Permissions and security impact are reviewed
- Relevant validation/tests are updated where appropriate
- Frontend/backend integration is checked if both are touched
- Build/checks pass or known exceptions are recorded
- Documentation is updated if behavior changed

## Project-Specific Agile Rules

- Any role-based change must be verified in both backend and frontend
- Any upload feature must include validation and access review
- Any public UI change should be checked on desktop and mobile
- Security work can interrupt sprint scope if it fixes a serious risk

## Working Files

- [agile/product-backlog.md](./agile/product-backlog.md)
- [agile/current-sprint.md](./agile/current-sprint.md)
- [agile/sprint-planning-template.md](./agile/sprint-planning-template.md)
- [agile/standup-template.md](./agile/standup-template.md)
- [agile/retrospective-template.md](./agile/retrospective-template.md)
- [agile/release-template.md](./agile/release-template.md)

