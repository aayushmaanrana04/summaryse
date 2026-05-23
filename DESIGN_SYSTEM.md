# Summaryse Design System

**Version:** 1.0  
**Last Updated:** May 2026  
**Inspired by:** Google Gemini Neural Expressive + Material Design 3 + Minimalist Premium

---

## Design Philosophy

**Expressive. Non-hindering. Uncluttered. Peaceful. Modern.**

We prioritize clarity and calmness over complexity. Every element serves a purpose. The design feels premium through intentionality, not excess.

---

## Color Palette

### Primary Colors

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Primary** | Teal | `#0EA5A8` | Buttons, links, CTAs, key UI |
| **Secondary** | Sage | `#6B9E8C` | Accents, secondary actions, subtle UI |
| **Accent** | Amber | `#F59E0B` | Highlights, micro-interactions, emphasis |

### Neutral Colors

| Role | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Background** | `#FFFFFF` | 255, 255, 255 | Primary backgrounds |
| **Surface** | `#F8F9FA` | 248, 249, 250 | Cards, panels, sections |
| **Border** | `#E5E7EB` | 229, 231, 235 | Dividers, lines, subtle separation |
| **Text Primary** | `#1F2937` | 31, 41, 55 | Headings, body text |
| **Text Secondary** | `#6B7280` | 107, 114, 128 | Meta text, descriptions |
| **Text Tertiary** | `#9CA3AF` | 156, 163, 175 | Disabled, placeholder text |

### Dark Mode Colors

| Role | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Background** | `#0F172A` | 15, 23, 42 | Dark backgrounds |
| **Surface** | `#1E293B` | 30, 41, 59 | Dark cards, panels |
| **Border** | `#334155` | 51, 65, 85 | Dark dividers |
| **Text Primary** | `#F1F5F9` | 241, 245, 249 | Dark text primary |
| **Text Secondary** | `#94A3B8` | 148, 163, 184 | Dark text secondary |

### Semantic Colors

| Role | Hex | Usage |
|------|-----|-------|
| **Success** | `#10B981` | Success states, confirmations |
| **Warning** | `#F59E0B` | Warnings, caution |
| **Error** | `#EF4444` | Errors, destructive actions |
| **Info** | `#3B82F6` | Information, hints |

### Tonal Palette (Teal Primary)

For Material Design 3 compliance:

```
Teal Tones:
- 0: #000000 (Teal-0)
- 10: #001F21 (Teal-10)
- 20: #003539 (Teal-20)
- 30: #005055 (Teal-30)
- 40: #006B72 (Teal-40)
- 50: #00868E (Teal-50)
- 60: #00A2AA (Teal-60)
- 70: #0EA5A8 (Teal-70) ← PRIMARY
- 80: #4ECDC4 (Teal-80)
- 90: #A3E9E6 (Teal-90)
- 95: #C8F7F5 (Teal-95)
- 99: #F1FFFE (Teal-99)
```

---

## Typography

### Font Family

**Primary:** `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

Modern, clean, reads well on screens. System font ensures platform consistency and premium feel.

### Type Scale

| Role | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|-----------------|-------|
| **Display Large** | 32px | 400 | 1.25 | 0px | Page hero, primary headings |
| **Display Medium** | 28px | 400 | 1.3 | 0px | Section titles |
| **Display Small** | 24px | 400 | 1.33 | 0px | — |
| **Headline Large** | 22px | 500 | 1.36 | 0px | Widget headers, modal titles |
| **Headline Medium** | 18px | 500 | 1.4 | 0px | — |
| **Headline Small** | 16px | 500 | 1.43 | 0px | Subheadings |
| **Title Large** | 16px | 500 | 1.5 | 0.15px | Button text, emphasis |
| **Title Medium** | 14px | 500 | 1.57 | 0.1px | — |
| **Title Small** | 12px | 500 | 1.67 | 0.1px | Labels |
| **Body Large** | 14px | 400 | 1.5 | 0.25px | Body text, primary content |
| **Body Medium** | 13px | 400 | 1.54 | 0.25px | Secondary body |
| **Body Small** | 12px | 400 | 1.67 | 0.4px | Fine print, captions |
| **Label Large** | 12px | 500 | 1.43 | 0.1px | Labels, badges |
| **Label Medium** | 11px | 500 | 1.45 | 0.5px | — |
| **Label Small** | 11px | 500 | 1.45 | 0.5px | Tiny labels |

### Best Practices

- **Hierarchy:** Use size + weight + color to create clear visual hierarchy
- **Line Length:** Aim for 50-75 characters per line for readability
- **Contrast:** All text must meet WCAG AA standards (4.5:1 minimum)
- **Spacing:** Use generous line-height for calm, readable feel

---

## Spacing System

### Base Unit: 4px

All spacing follows multiples of 4px for rhythm and alignment.

| Token | Value | Usage |
|-------|-------|-------|
| **xs** | 4px | Tight spacing, borders |
| **sm** | 8px | Compact padding |
| **md** | 12px | Default padding |
| **lg** | 16px | Standard padding |
| **xl** | 20px | Generous spacing |
| **2xl** | 24px | Large sections |
| **3xl** | 32px | Major spacing |
| **4xl** | 40px | Full height spacing |

### Common Patterns

| Element | Padding | Margin |
|---------|---------|--------|
| **Button** | 10px 16px | 0 8px |
| **Card** | 16px | 0 0 12px 0 |
| **Section** | 0 | 0 0 32px 0 |
| **Widget** | 12px 16px | 0 |

---

## Border Radius

Rounded corners add softness and modernity. Never sharp.

| Token | Value | Usage |
|-------|-------|-------|
| **sm** | 4px | Subtle rounding, borders |
| **md** | 6px | Buttons, inputs, small components |
| **lg** | 8px | Cards, containers, modals |
| **xl** | 12px | Large elements, widget container |
| **2xl** | 16px | Full-width containers |
| **full** | 9999px | Chips, pills, round buttons |

### Philosophy

- Large elements get more rounding (12-16px)
- Small elements get subtle rounding (4-6px)
- Never use 0 border radius (feels harsh)
- Pill buttons use `border-radius: 9999px`

---

## Shadows

Premium depth through subtle elevation. Not heavy, not flat.

### Shadow System

| Token | CSS | Usage |
|-------|-----|-------|
| **xs** | `0 1px 2px rgba(0,0,0,0.05)` | Hover states, slight lift |
| **sm** | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Buttons, cards |
| **md** | `0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)` | Modals, floating elements |
| **lg** | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | Dropdowns, popovers |
| **xl** | `0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)` | Modal overlays |

### Dark Mode Shadows

In dark mode, increase shadow opacity slightly:
`rgba(0,0,0,0.3)` instead of `rgba(0,0,0,0.1)`

---

## Components

### Buttons

#### Primary Button
- **Color:** Teal (#0EA5A8)
- **Padding:** 10px 16px
- **Border Radius:** 6px
- **Font Weight:** 500
- **Shadow:** sm
- **Hover:** Teal-60 (#00A2AA)
- **Active:** Teal-50 (#00868E)

#### Secondary Button
- **Color:** Sage (#6B9E8C)
- **Padding:** 10px 16px
- **Border Radius:** 6px
- **Font Weight:** 500
- **Outline:** 1px border Sage
- **Fill:** White
- **Hover:** Sage-20 (lighter shade)

#### Ghost Button
- **Background:** Transparent
- **Color:** Text Primary
- **Border:** None
- **Hover:** Surface background
- **Padding:** 10px 16px

### Card

- **Background:** White (Light) / Surface (Dark)
- **Border Radius:** 12px
- **Padding:** 16px
- **Shadow:** sm
- **Border:** 1px #E5E7EB (light) / #334155 (dark)

### Input

- **Border Radius:** 6px
- **Border:** 1px #E5E7EB (light) / #334155 (dark)
- **Padding:** 8px 12px
- **Font Size:** 14px
- **Focus:** 2px Teal border, sm shadow
- **Placeholder:** Text Tertiary

### Badge

- **Background:** Teal-95 (light) / Teal-20 (dark)
- **Color:** Teal-40 (light) / Teal-90 (dark)
- **Border Radius:** 9999px
- **Padding:** 4px 8px
- **Font Size:** 11px
- **Font Weight:** 500

---

## Animations

### Timing Functions

| Token | Value | Usage |
|-------|-------|-------|
| **ease-out** | `cubic-bezier(0.4, 0, 0.2, 1)` | Elements entering |
| **ease-in** | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving |
| **ease-in-out** | `cubic-bezier(0.4, 0, 0.2, 1)` | Interactive states |

### Duration

| Token | Value | Usage |
|-------|-------|-------|
| **fast** | 150ms | Micro-interactions, hover |
| **normal** | 300ms | Standard transitions |
| **slow** | 500ms | Entrance animations |

### Common Animations

#### Fade In
```css
animation: fadeIn 300ms ease-out;

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

#### Slide Up
```css
animation: slideUp 300ms ease-out;

@keyframes slideUp {
  from {
    transform: translateY(16px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

#### Scale Bounce
```css
animation: scaleBounce 300ms cubic-bezier(0.34, 1.56, 0.64, 1);

@keyframes scaleBounce {
  from { transform: scale(0.95); }
  to { transform: scale(1); }
}
```

### Principles

- Use ease-out for entering (feels natural)
- Keep animations under 500ms (not distracting)
- Prefer translation + opacity over scale alone
- Stagger child animations by 50-100ms for flow

---

## Accessibility

### Color Contrast

- **Text on background:** 4.5:1 minimum (WCAG AA)
- **UI components:** 3:1 minimum
- **Large text:** 3:1 minimum

### Interactive Elements

- **Minimum touch target:** 44px × 44px
- **Focus state:** Always visible (2px outline Teal)
- **Keyboard navigation:** Full support
- **ARIA labels:** All interactive elements

### Motion

- **Respect `prefers-reduced-motion`:**
  ```css
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; }
  }
  ```

---

## Writing Guidelines

### Tone

- **Friendly, not corporate**
- **Clear and direct**
- **Empowering, not controlling**
- **Reassuring about privacy**

### Labels & Copy

| Context | Style | Example |
|---------|-------|---------|
| **Buttons** | Verb + object | "Copy Summary", "Regenerate" |
| **Headers** | Benefit-focused | "Ready. Offline." |
| **Errors** | Clear, actionable | "Model failed to load. Please retry." |
| **Help text** | Reassuring | "One-time setup only" |

---

## Usage Examples

### Widget Header
```
🔒 Summaryse
Private. Offline.
```

### Loading State
```
🔄 Setting up on first use...
Downloading AI model (1.4 GB, ~2-3 min)
```

### Summary Display
```
• First bullet point
• Second bullet point
• Third bullet point

✓ 500 words → 50 words (90% shorter)
Generated instantly | Offline
```

### Button Group
```
[📋 Copy Summary]  (Primary, Teal)
[🔄 Regenerate]    (Secondary, Sage)
[✕ Close]          (Ghost)
```

---

## Dark Mode Strategy

### Automatic Detection
Use `prefers-color-scheme: dark` media query. No manual toggle needed.

### Color Adjustments
- Backgrounds: `#0F172A` (very dark blue-gray)
- Surfaces: `#1E293B`
- Text: `#F1F5F9`
- Borders: `#334155`
- Shadows: Increase opacity by 3x

### Implementation
```css
@media (prefers-color-scheme: dark) {
  .element {
    background: #0F172A;
    color: #F1F5F9;
  }
}
```

---

## Design Tokens Summary

### Quick Reference

```
Primary: #0EA5A8 (Teal)
Secondary: #6B9E8C (Sage)
Accent: #F59E0B (Amber)

Text Primary: #1F2937
Text Secondary: #6B7280
Background: #FFFFFF
Surface: #F8F9FA
Border: #E5E7EB

Border Radius: 6px (buttons), 12px (cards), 16px (containers)
Shadow: 0 1px 3px rgba(0,0,0,0.1)
Spacing: Multiples of 4px
Font: system-ui, sans-serif
```

---

## Next Steps

1. **Implement tokens in CSS variables**
2. **Update all components to match**
3. **Test dark mode across all states**
4. **Verify accessibility (WCAG AA)**
5. **Get user feedback on feel**

---

**Status:** Ready for implementation  
**Approval:** Pending design review
