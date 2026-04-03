# Farah frontend issue plan

`gh auth status` is currently failing for account `KiwiFarah`, so these are ready-to-paste issue drafts until GitHub CLI is re-authenticated.

## Issue 1

**Title**
`[FE] Build shared tutor dashboard shell for participation workflows`

**Description**
Create the shared frontend shell for the tutor-facing participation marking flows shown in the wireframes. This includes the dashboard landing page, persistent navigation between Dashboard, Mark Participation, and Unit Configuration, and summary widgets for weekly marking progress.

This issue exists to establish the visual structure that both assigned tickets depend on. It should stay frontend-only and use mock data until backend contracts are agreed with the rest of the team.

**Acceptance criteria**
- Dashboard route is implemented in Next.js App Router.
- Shared navigation links to dashboard, marking, and configuration screens.
- Progress summary cards reflect enabled weeks and marking completion states.
- Layout is responsive for desktop and tablet/mobile widths.

**Suggested branch**
`feature/dashboard-shell-issue-1`

**Suggested commits**
- `feat: add shared tutor dashboard shell`
- `style: refine responsive dashboard layout`

## Issue 2

**Title**
`[FE] T-201 build week selection flow for tutor marking`

**Description**
Implement the week selection screen for the participation marking workflow. Tutors should be able to view all configured weeks, see whether each week is locked, in progress, or ready, and open the correct workshop/week marking screen from this page.

This issue covers FR-3.1 and supports the touch-friendly marking UI by making week navigation explicit.

**Acceptance criteria**
- Week selection route lists configured weeks from mock state.
- Each week shows workshop label, week label, status, and marking progress.
- Locked weeks are visually distinct from active weeks.
- Tapping a week opens the corresponding marking screen.

**Suggested branch**
`feature/t-201-week-selection-issue-2`

**Suggested commits**
- `feat: add participation week selection screen`
- `style: add status styling for week cards`

## Issue 3

**Title**
`[FE] T-201 build touch-friendly 0-3 marking cards`

**Description**
Build the marking screen for a selected participation week using large touch-friendly student cards. Tutors must be able to review each student, see quick context, and assign a participation score from 0 to 3 using clear tap targets.

This is the core UI for FR-3.1 and FR-3.2.

**Acceptance criteria**
- Dynamic marking route exists for each enabled week.
- Student cards display name, student number, team, prior context, and 0-3 score options.
- Score buttons are large enough for touch interaction.
- Selected score is visually obvious and updates immediately in local state.
- Marking page includes back navigation to week selection and a lock action placeholder.

**Suggested branch**
`feature/t-201-touch-marking-cards-issue-3`

**Suggested commits**
- `feat: add touch-friendly student marking cards`
- `feat: add selected week marking route`

## Issue 4

**Title**
`[FE] T-401 build week selection and weighting dashboard`

**Description**
Implement the unit configuration interface for participation weeks and score weighting. Admin users should be able to select active weeks, adjust the maximum weekly participation score, review the total participation points, and trigger lock checkpoints such as Week 6 Lock and Week 12 Lock.

This issue covers FR-1.1 and FR-1.2.

**Acceptance criteria**
- Configuration route displays selectable participation weeks.
- Locked weeks cannot be toggled off.
- Max weekly score can be adjusted in the UI.
- Dashboard summary shows selected weeks and total participation points.
- Save action and lock actions provide visible frontend feedback.

**Suggested branch**
`feature/t-401-config-dashboard-issue-4`

**Suggested commits**
- `feat: add unit configuration dashboard`
- `feat: add weighting summary and lock controls`

## Recommended execution order

1. Create Issue 1 and branch from `main`.
2. Implement the shared shell and dashboard.
3. Commit and open a PR linked to Issue 1.
4. Create Issue 2 from updated `main`.
5. Implement week selection and commit.
6. Create Issue 3 from updated `main`.
7. Implement the touch-friendly marking cards and commit.
8. Create Issue 4 from updated `main`.
9. Implement the configuration dashboard and commit.
10. Open separate PRs if your team wants narrow review, or one PR only if your team has explicitly agreed to bundle T-201 and T-401 together.
