# NYASA Frontend Material 3 Design Polish & Reporting Feature Plan

This plan outlines the visual-refinement pass to elevate the NYASA frontend to Google Material Design 3 / Gemini aesthetics, and introduces a dedicated "Report Fake Information" portal for Indian users.

## 🚨 Design Refinements & Tokens

### 1. Typography System
*   Define a strict, hierarchical Material 3 type scale inside [`index.css`](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/index.css):
    *   `display-large`: For major headlines and hero focal points (Tight tracking, generous line-height).
    *   `headline-medium`: For major section headers (e.g., "Interactive Analyzer", "Why Context").
    *   `title-medium` / `title-small`: For item titles and card headers.
    *   `body-medium`: For body text (Highly readable, neutral).
    *   `label-large` / `label-small`: For tags, metadata, and monospace technical annotations.
*   Update components to reference these centralized typographic classes consistently.

### 2. Spacing & Layout Grid
*   Enforce a strict 4px/8px spacing grid. Audit and replace arbitrary padding/margins with grid steps like `p-4`, `p-6`, `p-8`, `gap-4`, `gap-6`.
*   Ensure absolute visual alignment of containers across all screen breakpoints.

### 3. Material 3 Color Palette
*   Consolidate all status colors into a proper semantic theme system inside [`index.css`](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/index.css):
    *   `Primary (Blue)`: `#005faf` (light) / `#38bdf8` (dark) for actions and primary anchors.
    *   `Supported (Green)`: `#15803d` / `#10b981` (used for matches, authentic, and supporting stance).
    *   `Contradicted/Manipulated (Red)`: `#b91c1c` / `#ef4444` (used for contradicts and suspicious forensics).
    *   `Misleading (Orange)`: `#b45309` / `#f59e0b`.
    *   `Inconclusive (Purple)`: `#6d28d9` / `#8b5cf6`.
    *   `Neutral/Unresolved (Slate)`: `#475569` / `#cbd5e1`.

### 4. Elevation, Corners & Focus
*   Apply Material 3 standard corner rounding (`rounded-2xl` for cards, `rounded-3xl` for outer sections).
*   Enforce the global M3 focus indicator ring styles (`focus-visible:ring-2 focus-visible:ring-nyasa-primary`).

---

## 🇮🇳 Feature: Indian Fake News Reporting Portal

When the NYASA assessment indicates that the content is suspicious, manipulated, synthetic, or contradicted by evidence:
1.  **Report Action Button**: Render a prominent "Report Fake Information" button next to the verdict in [`App.tsx`](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/App.tsx).
2.  **Reporting Guide Page**: Transition to a dedicated Material 3 view with instructions to report fake news in India:
    *   **PIB Fact Check Unit**: For misinformation concerning the Government of India, departments, and schemes.
        *   📧 Email: `socialmedia@pib.gov.in`
        *   📱 WhatsApp: `+91 8799711259`
        *   🌐 Portal Link: `https://factcheck.pib.gov.in/`
    *   **National Cyber Crime Reporting Portal**: For suspicious URLs, Telegram handles, and fake social accounts.
        *   🚨 Portal Link: `https://www.cybercrime.gov.in/`
    *   **Interactive Copy buttons** and clear step-by-step reporting protocols.

---

## Proposed Changes

### Component Polish & Additions

#### [MODIFY] [index.css](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/index.css)
*   Define the typography scales (`.text-display-large`, `.text-headline-medium`, etc.).
*   Extend theme tokens to consolidate M3 colors, card shapes, custom shadows, and motion properties.

#### [NEW] [ReportFakePage.tsx](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/ReportFakePage.tsx)
*   A premium Material 3 page layout rendering reporting paths (PIB Fact Check Unit vs. National Cyber Crime Reporting Portal).
*   Includes contact information, quick-copy cards, warning badges, and a "Return to Assessment" flow.

#### [MODIFY] [App.tsx](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/App.tsx)
*   Manage a new state `'report'` to navigate to the reporting instructions page.
*   Integrate the "Report Fake Information" trigger next to suspicious verdicts.
*   Refine general typography and spacing to match the Material 3 design system.

#### [MODIFY] [UploadBox.tsx](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/UploadBox.tsx)
*   Enforce rounded-2xl boundaries, interactive scale hover states, and outline glows.
*   Standardize textarea outline behavior on focus.

#### [MODIFY] [PillarsPanel.tsx](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/PillarsPanel.tsx)
*   Align margin steps and colors of expandable rows and indicator tags.

#### [MODIFY] [SourceContextMap.tsx](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/SourceContextMap.tsx)
*   Update Leaflet icons and connection vectors to reference semantic theme color values.
*   Style Leaflet popups using M3-compliant fonts, shapes, and spacing.

#### [MODIFY] [ProblemScenario.tsx](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/ProblemScenario.tsx)
*   Adjust grids, captions, and side-by-side elements to fit the spacing grid.

#### [MODIFY] [ComparisonTable.tsx](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/ComparisonTable.tsx)
*   Standardize table borders, column cards, and checkmark indicators.

#### [MODIFY] [PipelineDiagram.tsx](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/PipelineDiagram.tsx)
*   Apply M3 transition speed (200ms) and ease profiles to sequential node transitions.

---

## Verification Plan

### Automated Tests
*   `npm run build` inside the `frontend` directory to ensure zero compilation or TypeScript errors.

### Manual Verification
*   Verify that suspicious results show the "Report Fake Information" button.
*   Click the button and verify it redirects to the reporting page layout with complete PIB/Cybercrime details.
*   Check that "Return to Assessment" works and restores the state.
