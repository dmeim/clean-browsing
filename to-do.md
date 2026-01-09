Project Cleanup TODOs

Branding & Versioning
- [ ] Decide on a single product name ("Clean-Browsing" vs "Clean NewTab") and apply consistently across code and docs.
- [ ] Remove legacy "NewTab PlusProMaxUltra" references across docs and assets.
- [ ] Align version numbers across files (badge, package, manifests):
  - README badge: `README.md:3`
  - Package: `package.json:3`, `package-lock.json`
  - Manifest: `extension/manifest.json`
- [ ] Update alt text/branding in UI where applicable: `extension/newtab.html:245`, `extension/newtab.html:598`.
- [ ] Update `LICENSE` copyright line to match the chosen brand.

Manifest & Background (Firefox)
- [ ] Keep `extension/manifest.json` in sync with package version and permissions.
- [ ] Validate `browser.webRequest` logic after each major refactor.
- [ ] Consider centralizing manifest versioning (single source of truth) or document the sync process.

Header-Bypass Rules (webRequest)
- [ ] Ensure per-tab origin tracking remains user-initiated and is cleaned up on tab close.
- [ ] Keep user-facing messaging clear about iframe limitations and header adjustments.

Defaults & Duplication
- [ ] Unify sidepanel default sites (use either `chat.openai.com` or `chatgpt.com` consistently):
  - `extension/settings.js`
  - `extension/background.js`
  - `extension/sidepanel-embedded.js`
  - `extension/sidepanel-injector.js`
- [ ] Extract shared default sidepanel settings to a single module to avoid drift and duplication across files.

Documentation & README
- [ ] Fix README "Releases" link (currently `./releases/`) to point to GitHub Releases or `dist/`.
- [ ] Update "Current Version" in README to 0.4.x and recent highlights.
- [ ] Replace legacy product name in docs (UI/Styling/Components/Features):
  - `docs/STYLING_GUIDE.md`
  - `docs/WIDGET_DEVELOPMENT.md`
  - `docs/COMPONENT_RULES.md`
  - `docs/UI_BEHAVIOR.md`
  - `docs/features/*`
- [ ] Fix file-name reference mismatch in sidepanel doc ("sidebar" vs "sidepanel"): `docs/features/sidepanel-extension.md`.
- [ ] Update `CONTRIBUTING.md` closing section to new name.
- [ ] Add THIRD-PARTY notices for Day.js and plugins.

Packaging & CI
- [ ] Remove/rename legacy dist archives (`dist/NewTab-PlusProMaxUltra-*.zip`); regenerate with new naming.
- [ ] Update packaging scripts to exclude `.DS_Store` and other junk files; ensure consistent naming: `package.json` scripts.
- [ ] Decide whether `switch-manifest.sh` should be retired or updated for Firefox-only tooling.
- [ ] Update CI to validate both manifests or switch to a known target before reading `extension/manifest.json`:
  - `.github/workflows/test.yml`
- [ ] Optionally add ESLint/Prettier (dev-only) and run in CI for basic hygiene.

Repo Hygiene
- [ ] Expand `.gitignore` to ignore `**/.DS_Store` and optionally `dist/` outputs.
- [ ] Remove committed `.DS_Store` files from the repo (e.g., `extension/resources/.DS_Store`, `extension/.DS_Store`).
- [ ] Confirm policy for tracking `extension/manifest.json` (currently ignored but present). Ensure workflow regenerates it as needed.
- [ ] Remove unused/legacy files if not needed (e.g., `extension/sidepanel.html` and any unused `sidepanel.js`).

UX, Accessibility & Performance
- [ ] Audit sidepanel keyboard navigation and ARIA roles; ensure focus management on open/close.
- [ ] Validate injected sidepanel wrapper (`#clean-browsing-viewport-wrapper`) does not break layout on complex apps; provide opt-out if needed.
- [ ] Verify error states provide clear fallbacks (open in new tab) and consistent messaging.

Security & Privacy
- [ ] Add `SECURITY.md` describing scope of header modifications, permissions rationale, and reporting process.
- [ ] Add explicit in-app toggle to enable/disable header-bypass features globally.

Code Quality & Tests
- [ ] Normalize formatting (optional Prettier config for contributors, no runtime impact).
- [ ] Add lightweight tests/scripts to sanity-check both manifests and MV3 service worker constraints (no `window` usage).
- [ ] Consider small unit/integration checks for widget registry and settings import/export.

Housekeeping
- [ ] Clarify chosen brand in release notes and keep future notes consistent (`release-notes/`).
- [ ] Ensure `browser_specific_settings` only appears in Firefox manifest.
- [ ] Add CODEOWNERS if desired and update repository links in docs to match repo name.
