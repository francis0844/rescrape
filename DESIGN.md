# Design

## Design Intent

ReScrape is an internal admin surface for budget-controlled source discovery. The interface should feel precise and durable: a restrained operations console for people making scoped decisions, not a marketing site.

## Theme

Operators use this during focused desk work, often comparing settings and source states on a laptop or external display in ordinary office light. Use a light theme with tinted neutral surfaces, crisp borders, and restrained color for navigation and state.

## Color

Use OKLCH tokens. Neutrals lean slightly cool-green to avoid flat grayscale. Accent color is reserved for primary actions, focus states, and selected navigation.

```css
:root {
  --background: oklch(0.985 0.006 165);
  --surface: oklch(0.963 0.008 165);
  --surface-strong: oklch(0.928 0.01 165);
  --text: oklch(0.205 0.012 165);
  --text-muted: oklch(0.455 0.014 165);
  --border: oklch(0.852 0.012 165);
  --accent: oklch(0.47 0.118 185);
  --accent-strong: oklch(0.39 0.12 185);
  --accent-soft: oklch(0.91 0.04 185);
  --warning: oklch(0.66 0.13 75);
  --danger: oklch(0.58 0.16 28);
  --success: oklch(0.55 0.12 150);
}
```

## Typography

Use a native system sans stack for the product UI: `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`. Keep hierarchy compact and steady.

- Page titles: 1.5rem, 650 weight
- Section headings: 1rem, 650 weight
- Body: 0.9375rem, 400 weight
- Labels: 0.8125rem, 600 weight
- Metadata: 0.8125rem, 400 weight

## Layout

Use a persistent sidebar and a bounded content column. The shell should keep navigation, auth state, and system status visible without crowding the empty Phase 0 pages.

- Sidebar width: 17rem desktop, top navigation on small screens
- Main max width: 72rem
- Page padding: 1rem mobile, 2rem desktop
- Border radius: 8px for panels and controls
- Spacing scale: 4, 8, 12, 16, 24, 32

## Components

- Buttons: solid accent for primary, bordered neutral for secondary, clear focus ring.
- Inputs: tinted surface, 1px border, visible focus ring, no decorative shadows.
- Panels: use only where content is grouped for operation. Do not nest cards.
- Empty states: concise operational copy that states current availability without marketing language.
- Navigation: icon plus text, selected item uses accent-soft background and accent text.

## Motion

Use 150ms transitions for hover, focus, and selected navigation only. Respect `prefers-reduced-motion`; no page-load choreography.
