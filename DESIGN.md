# EasyLearn — Design System

## Atmosphere
- **Density:** Daily App Balanced (5) — Breathable interfaces that don't overwhelm learners.
- **Variance:** Offset Asymmetric (5) — Slightly playful layout structures suitable for gamified education.
- **Motion:** Fluid CSS (6) — Tactile, rewarding feedback for quizzes, XP gains, and streaks.

## Color Palette
| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Background | Zinc 50 | `#FAFAFA` | Main app background |
| Surface | White | `#FFFFFF` | Cards, elevated containers, input fields |
| Text Primary | Charcoal | `#171717` | Headings, primary reading text |
| Text Secondary | Zinc 500 | `#71717A` | Subtitles, helper text, timestamps |
| Primary Accent | Coral Orange | `#F27A5E` | Primary CTAs, active states, active streaks |
| Gamification | Soft Emerald | `#34D399` | Correct quiz answers, XP gains, success states |
| Error/Alert | Muted Rose | `#FB7185` | Incorrect answers, destructive actions |

## Typography
- **Primary Typeface:** `Outfit` (Friendly, geometric, highly legible for learning content).
- **Secondary/Monospace:** `JetBrains Mono` (For all numbers, XP counters, streak days, and stats).
- **Constraints:** `Inter` is strictly banned. No serifs.

## Component Behaviors
- **Buttons:** Tactile push feedback on active state (`transform: scale(0.97)`). No neon outer glows or custom mouse cursors.
- **Cards:** Use ONLY when elevation communicates hierarchy. Shadows must be tinted to the background hue (no pure black/gray shadows).
- **Inputs/Forms:** Label above input, helper text optional, error text below. Generous tap targets (min 48px height).
- **Loading States:** Skeletal loaders matching layout dimensions — no generic circular spinners.
- **Empty States:** Composed compositions indicating how to populate data (e.g., "Take your first lesson to earn XP").
- **Quiz Interactions:** Explicit selected states. Clear, inline error/success reporting with contextual messages upon submission.

## Layout Principles
- **Grid Systems:** 12-column bento-style grid for the dashboard.
- **Spacing:** Generous, mathematically consistent spacing (multiples of 8px).
- **Hero Section:** Asymmetric structure. Inline image typography where contextual photos sit between words in the headline. No overlapping text.
- **Responsive Strategy:** Mobile-first vertical stacking, moving to a fluid 2-column layout on tablet, constrained to a max-width centered container (1200px) on desktop.

## Motion Philosophy
- **Engine:** CSS custom properties + `cubic-bezier(0.16, 1, 0.3, 1)` for all transitions.
- **Duration:** Fast interactions 150ms, medium reveals 300ms, hero cinematics 600ms.
- **Perpetual Micro-Motion:** Floating gamification badges, shimmer passes on streak milestones — hardware-accelerated via `transform` and `opacity` only.
- **Scroll Reveals:** Staggered opacity + translateY reveals, triggered at 20% viewport intersection.
- **BANNED Motion:** `linear` easing, `ease-in-out`, animating layout properties (`width`, `height`, `top`, `left`).

## Anti-Patterns (Banned)
- AI-purple gradient backgrounds.
- Generic 3-column equal-width feature cards.
- `Inter` as primary typeface.
- Centered hero layouts.
- Generic circular spinner loaders.
- Placeholder text like "Lorem ipsum" or "John Doe".
- Pure black (`#000000`) backgrounds or text.
- Shadows with no color (pure `rgba(0,0,0,x)`).
- Default system emojis in UI text or buttons (use custom vector SVG icons instead).
- Navigation that wraps to two lines at desktop widths.
