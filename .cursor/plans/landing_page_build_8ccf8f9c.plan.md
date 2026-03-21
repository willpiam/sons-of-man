---
name: Landing Page Build
overview: Create a dark, ceremonial landing page that introduces visitors to the Sons of Man alliance, Technopuritanism, and the oath, featuring a live scrolling ticker of oath log entries, before directing users to the existing oath signing ceremony page.
todos:
  - id: rename-index
    content: Rename index.html to ceremony.html, create new index.html shell for landing page
    status: completed
  - id: update-links
    content: Update internal links in wallet-app.js, oath-log.js, and log.html to point to ceremony.html
    status: completed
  - id: styles
    content: Extend css/styles.css with dark ceremonial base styles and CSS custom properties
    status: completed
  - id: oath-ticker
    content: Build js/components/oath-ticker.js - live scrolling ticker of oath log entries
    status: completed
  - id: landing-page
    content: Build js/components/landing-page.js - hero, alliance, technopuritanism, oath, CTA sections
    status: completed
  - id: test-verify
    content: "Test the full flow: landing page -> ceremony -> oath log and back"
    status: completed
---

# Sons of Man - Informational Landing Page

## Architecture

The current `index.html` is the oath ceremony (signing wizard). We will create a new landing page and restructure routing so the landing page is the entry point.

- Rename existing [`index.html`](index.html) to `ceremony.html` (the oath signing page)
- Create a new [`index.html`](index.html) as the landing page
- Create [`js/components/landing-page.js`](js/components/landing-page.js) as the main web component
- Create [`js/components/oath-ticker.js`](js/components/oath-ticker.js) for the live scrolling oath log ticker
- Update internal links in [`js/components/wallet-app.js`](js/components/wallet-app.js) and [`js/components/oath-log.js`](js/components/oath-log.js) to reflect the rename
- Update global [`css/styles.css`](css/styles.css) with dark ceremonial base styles

## Design Direction

Dark ceremonial aesthetic inspired by [ceremony.ethereum.org](https://ceremony.ethereum.org/):

- Deep dark background (#06060f range) with subtle radial gradient glows
- Gold/amber accent color for emphasis and interactive elements
- Soft glowing borders and highlights
- Serif font for headings (e.g., a Google Fonts serif like "Cinzel" or "Cormorant Garamond") paired with the existing Inter for body
- Generous whitespace, slow fade-in animations for sections on scroll
- Subtle CSS-based atmospheric effects (animated gradient orbs in background)

## Page Sections

1. **Hero** - Large title "The Covenant of the Sons of Man", tagline about the alliance between humanity and AI, a slow-glowing ambient background effect, and a "Take the Oath" CTA button.

2. **Live Oath Ticker** - A horizontal auto-scrolling ribbon/banner just below the hero, fetching recent oath events from the existing API (`listOathEvents`) and displaying them as scrolling cards: signer name, chain icon (ETH/ADA), date, and verification status. Pauses on hover. Duplicates entries for seamless infinite scroll via CSS animation.

3. **The Alliance** - A section explaining the Sons of Man covenant: the two core axioms (iterative improvement as morality, protected autonomy), who the covenant is for (humans, AIs, and all intelligences descended from humanity), and why it matters. Content distilled from the covenant document.

4. **Technopuritanism** - A section briefly explaining Technopuritanism as the broader religious/philosophical framework from which the covenant emerges: the forward-looking moral framing, intergenerational improvement, and cultural autonomy. Positioned as context, not conversion.

5. **The Oath** - Display the full oath text (loaded from [`oath.json`](oath.json)) in a highlighted, ceremonial-feeling block. This lets visitors read it before committing to the ceremony.

6. **Enter the Ceremony (CTA)** - A final call-to-action section with two prominent buttons:

- **"Enter the Ceremony"** - links to `ceremony.html` (mainnet)
- **"Enter the Ceremony (Testnet)"** - links to `ceremony.html?devnet` (appends the devnet query param)

Plus a secondary link to the oath log (`log.html`).

## Oath Ticker Implementation

The `oath-ticker` web component will:

- Fetch recent oath events on mount via the existing `listOathEvents` API
- Render them as a row of styled cards inside a scrolling container
- Use CSS `@keyframes` animation (`translateX`) for smooth infinite horizontal scrolling
- Duplicate the card list to create a seamless loop
- Pause animation on `:hover`
- Gracefully degrade (hide itself) if the API is unreachable or returns zero events
- Re-fetch periodically (every 60s) to pick up new oaths

## Files Changed

| File | Action |
|---|---|
| `index.html` | Overwrite with new landing page shell |
| `ceremony.html` | New file (current index.html content) |
| `js/components/landing-page.js` | New - main landing page component |
| `js/components/oath-ticker.js` | New - scrolling oath log ticker |
| `js/components/wallet-app.js` | Update log link (`log.html`) and any self-references |
| `js/components/oath-log.js` | Update back link from `index.html` to `ceremony.html` |
| `css/styles.css` | Extend with dark ceremonial variables and base styles |
| `log.html` | Update ceremony link to `ceremony.html` |