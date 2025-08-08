# Visual Spec for gpt5-mini

Overview

This document defines the visual and UX spec for the gpt5-mini branch.

Color tokens

--primary: #0f172a (dark indigo)
--accent: #06b6d4 (cyan)
--muted: #64748b (slate-500)
--bg: #0b1220 (very dark)
--card-bg: #0f172a
--glass: rgba(255,255,255,0.03)

Typography

Font family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial
Headings: 600 weight; scale: h1 32px, h2 24px, h3 18px
Body: 16px / 1.5 line-height; weight 400

Spacing

4px base unit
xs 4, sm 8, md 16, lg 24, xl 32

Buttons

Primary: filled with --accent, white text, subtle shadow, 8px radius
Secondary: outline with --muted border, transparent background

Cards

Background: --card-bg; border-radius 12px; padding md; subtle glass effect

Header & layout

Fixed top header with compact left nav, centered app title, right-side controls (theme, user)

Responsive behavior

Mobile: collapse left nav into hamburger, stack content vertically

Charts

Dark theme styling, tooltip with rounded card, accent color for series, simplified legend

Accessibility

Sufficient contrast, focus outlines, keyboard-accessible controls

Implementation notes

- Add CSS variables in [`app/globals.css`](app/globals.css:1)
- Update header in [`components/ui/header.tsx`](components/ui/header.tsx:1) and layout in [`app/layout.tsx`](app/layout.tsx:1)
- Polish buttons: [`components/ui/button.tsx`](components/ui/button.tsx:1)
- Lazy-load heavy chart components and add skeleton placeholders

Commit message suggestion

feat(gpt5-mini): visual spec + initial style tokens and implementation plan