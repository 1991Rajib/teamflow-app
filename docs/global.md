# TeamFlow — Global Design Rules

The 10 rules below are the source of truth for TeamFlow's visual design direction. All component, page, and styling decisions must follow them.

---

## Rule 1 — One Brand, Used Consistently

Use a single primary brand color (indigo) for all primary actions and interactive emphasis:

- Create Project
- Create Task
- Add Member
- Send Invitation
- Upgrade
- Save
- Submit
- Confirm

Secondary colors must support the primary brand color, not compete with it. Do not introduce a second brand color for the same type of action.

---

## Rule 2 — Clear Action Hierarchy

Every action must communicate its intent through a consistent treatment:

- **Primary action** — solid brand background, white text, clear hover/focus.
- **Secondary action** — neutral surface, neutral text, subtle border.
- **Tertiary / link action** — text only, brand color, no background.
- **Destructive action** — solid destructive color (red), white text.

A primary action must never appear visually weaker than a secondary action on the same surface.

---

## Rule 3 — Destructive Color is Reserved

Red is reserved for destructive intent and destructive feedback only:

- Delete
- Remove
- Cancel Subscription
- Destructive warnings

Red must not be used for status badges, decorative accents, or non-destructive states.

---

## Rule 4 — Semantic Colors Are Predictable

Use the same color family for the same meaning across the entire product:

- **Success** — green (emerald)
- **Warning** — amber
- **Error** — red
- **Information** — blue (or neutral brand-tinted)

The same semantic meaning must use the same general color family everywhere. A success state must never be rendered with red or amber, and so on.

---

## Rule 5 — Backgrounds and Surfaces Have a Hierarchy

Maintain a clear elevation hierarchy from page to modal:

1. Page background
2. Sidebar / Header
3. Cards
4. Elevated cards / popovers
5. Dropdowns
6. Modals
7. Inputs

Each layer must be visually distinguishable. Cards must not disappear into the page background. Modals must be clearly separated. Inputs must be identifiable.

---

## Rule 6 — Text Hierarchy is Consistent

Use a consistent four-level text scale across the product:

- **Primary text** — strongest, easiest to read.
- **Secondary text** — less prominent, still clearly readable.
- **Muted text** — subtle, still readable.
- **Placeholder text** — clearly distinguishable from real input values, never invisible.

Do not use extremely dark text on dark backgrounds or extremely light text on light backgrounds. Muted text must remain readable, not just decorative.

---

## Rule 7 — Borders Are Subtle and Consistent

Borders define structure, not decoration.

- Cards, inputs, dropdowns, and modals share the same border treatment.
- Borders are subtle in both Light Mode and Dark Mode.
- A border must never be near-invisible in one section and visually loud in another without intent.

---

## Rule 8 — Interactive States Follow One Pattern

Hover, active, selected, focus, and disabled states follow a single pattern across the product:

- **Hover** — subtle surface darken/lighten, never a brand color shift.
- **Active / Selected** — clear visual treatment, uses brand-tinted surface or brand text.
- **Focus** — visible, accessible focus ring on every interactive element.
- **Disabled** — clearly non-interactive, reduced opacity, no hover effect.

If a navigation item uses a specific active treatment, similar navigation items use the same treatment. Buttons of the same kind behave consistently.

---

## Rule 9 — Status Colors Are Semantic, Not Decorative

Task and project statuses (TODO, IN_PROGRESS, DONE, LOW, MEDIUM, HIGH, etc.) use the same status palette everywhere.

Status colors must:

- Be semantically meaningful.
- Be readable in Light and Dark Mode.
- Not collide with success / error / warning semantic colors.
- Not make unrelated UI look like an alert.

---

## Rule 10 — Use Color Intentionally

TeamFlow is a professional SaaS product. Color communicates hierarchy, action, status, feedback, and importance — nothing else.

- Neutral UI elements stay neutral.
- Do not over-color cards, buttons, badges, or sections.
- Avoid decoration that does not carry meaning.
- A component that does not need color should not have color.

---

## Light & Dark Mode

Every rule above must hold in both Light Mode and Dark Mode. A consistent product means a consistent visual language across themes — not two separate design systems.
