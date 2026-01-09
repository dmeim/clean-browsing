# Clean-Browsing Extension - Comprehensive Implementation Plan

## Overview
This plan merges existing TODOs with critical bugs discovered through comprehensive UI/UX analysis, bug hunting, and architecture review. Items are organized by priority and implementation phases based on detailed code analysis.

> **Firefox Update (v0.5.0):** Clean-Browsing now targets Firefox-first browsers. Chrome-specific sections below are retained for historical context and should only be revisited if Chromium support returns.

---

## 🚨 PHASE 1: CRITICAL FIXES (Do First)
*These issues are breaking core functionality and preventing users from using the extension*

### ✅ ~~1.1 Fix Sidepanel Settings Modal (RESOLVED)~~
- **Status**: FIXED - The settings modal in `sidepanel.js` and `sidepanel.html` is properly implemented with correct DOM selectors and event listeners at line 837
- **Verification**: Modal element exists in `sidepanel.html:40-192` with proper IDs

### ✅ ~~1.2 Fix Broken Button Styling (RESOLVED)~~
- **Status**: FIXED - Button styling in `styles.css:1071-1127` is consistent, uses standardized patterns
- **Note**: Calculator widget buttons (`styles.css:1407-1595`) use intentionally different styling for their grid layout

### ✅ ~~1.3 Fix MV3 Service Worker Issues (NOT APPLICABLE)~~
- **Status**: N/A - Extension uses Manifest V2 (Firefox), not MV3 service workers
- **Manifest**: `manifest_version: 2` with background scripts (not service worker)
- **Note**: One remaining `window.` usage at `background.js:327` is inside `executeScript` callback (runs in content script context, not background), so it's valid

### ✅ ~~1.4 Fix Missing Files Referenced in Manifest (RESOLVED)~~
- **Status**: VERIFIED - All files in `web_accessible_resources` exist:
  - ✅ `browser-api.js` (6,602 bytes)
  - ✅ `default-settings.js` (2,216 bytes)
  - ✅ `sidepanel-ui.js` (20,453 bytes)
  - ✅ `sidepanel-embedded.js` (29,948 bytes)
  - ✅ `sidepanel-embedded.css` (11,276 bytes)
  - ✅ `sidepanel.css` (21,865 bytes)
  - ✅ `split-view.js` (7,770 bytes)
  - ✅ `resources/logo.png` (exists)

### 1.5 Fix Sidepanel Resize & Positioning (NEEDS VERIFICATION)
- **Issue**: "sidepanel not pushing website content properly" + "sidepanel resize issues"
- **Current Implementation**: `sidepanel-injector.js` uses viewport wrapper + transform approach
- **Status**: Implementation looks comprehensive with:
  - Shadow DOM isolation (lines 404-499)
  - Viewport wrapper system (lines 236-322)
  - Resize handlers (lines 1413-1489)
  - Body observer for late-injected content (lines 356-402)
- **Action Required**: TESTING needed on complex websites (Gmail, GitHub, etc.)
- **Priority**: 🟠 HIGH (needs manual verification)

### ✅ ~~1.6 Fix Memory Leaks in Event Listeners (RESOLVED)~~
- **Status**: ADDRESSED - `sidepanel.js` properly cleans up:
  - URL tracking intervals via `stopUrlTracking()` (line 539)
  - Mutation observers via `stopBodyObserver()` (line 396 in injector)
  - Event handlers stored with references for removal

---

## 🔧 PHASE 2: FUNCTIONALITY RESTORATION
*Core features working but need consistency and polish*

### 2.1 Widget Visual Consistency (MEDIUM PRIORITY)
- **Issue**: Minor inconsistencies across widget implementations
- **Current State**: Calculator widget uses specialized grid-based button styling (intentional)
- **Remaining Work**:
  - [ ] Audit search widget input styling vs global form patterns
  - [ ] Verify widget hover states and transitions are standardized
  - [ ] Add proper loading states for widgets that fetch data
- **Priority**: 🟡 MEDIUM

### ✅ ~~2.2 Branding & Versioning Cleanup (RESOLVED)~~
- **Status**: COMPLETED
  - ✅ Manifest shows "Clean-Browsing" v0.5.0
  - ✅ Package.json shows "clean-browsing" v0.5.0
  - ✅ README badge updated to v0.5.0
  - ✅ Legacy dist archives removed
  - ✅ LICENSE copyright updated to "Clean-Browsing Contributors"
  - ✅ Legacy `switch-manifest.sh` removed

### ✅ ~~2.3 Code Duplication & Default Settings (RESOLVED)~~
- **Status**: FIXED - `default-settings.js` is now the single source of truth
- **Verification**:
  - `background.js:281-283` calls `DefaultSettings.getDefaultSidebarSettings()`
  - All files use consistent `chatgpt.com` URL (not `chat.openai.com`)
  - 5 files reference `getDefaultSidebarSettings` from shared module
- **Note**: `sidepanel.js:1481-1540` still has inline fallback defaults (acceptable for robustness)

### 2.4 Performance Optimizations  
- **Issue**: Performance problems identified in UI analysis
- **Specific Problems**:
  - Complex backdrop-filter chains affecting performance
  - Inefficient DOM queries in widget rendering
  - Heavy CSS animations on low-powered devices
  - No virtual scrolling for large widget lists
- **Fix Strategy**:
  - Optimize backdrop-filter usage with better layering
  - Cache DOM queries and use more efficient selectors
  - Add `prefers-reduced-motion` support for accessibility
  - Implement proper animation performance optimizations
- **Priority**: 🟢 LOW

---

## 🛡️ PHASE 3: SECURITY & COMPLIANCE  
*Critical for store approval and user trust*

### 3.1 Header-Bypass Controls (FIREFOX COMPLIANCE)
- **Issue**: Header removal must remain scoped to user-initiated origins
- **Current State**: `background.js` properly manages per-tab/context origin grants via `sessionsByContext` Map
- **Good Practices Already Implemented**:
  - ✅ Per-tab origin tracking (lines 9-65)
  - ✅ Cleanup on tab close (lines 68-73)
  - ✅ Session cleanup every 5 minutes (lines 76-85)
  - ✅ Only modifies `sub_frame` requests (line 94)
- **Action Items**:
  - [ ] **Add user-visible indicator** when bypass is active
  - [ ] **Document header adjustments** in README/privacy policy
  - [ ] **Review Firefox add-on policies** to ensure compliance
- **Priority**: 🟠 HIGH

### ✅ ~~3.2 Firefox Manifest Management (RESOLVED)~~
- **Current State**:
  - ✅ Single unified Firefox manifest (MV2)
  - ✅ Proper gecko settings with ID and min version
  - ✅ Package.json has Firefox-focused packaging script
- **Note**: `switch-manifest.sh` is legacy (can be removed)
- **Priority**: 🟢 LOW (cleanup only)

### ✅ ~~3.3 Security Documentation & Transparency (RESOLVED)~~
- **Status**: COMPLETED
  - ✅ Created `SECURITY.md` with:
    - Full permissions rationale
    - Header modification scope and boundaries
    - Vulnerability reporting process
    - Data handling practices
  - ✅ Created `PRIVACY_POLICY.md` for store submission
  - ⏳ User-facing bypass indicator (future enhancement)
- **Priority**: DONE

### ✅ ~~3.4 Permission Audit & Minimization (RESOLVED)~~
- **Status**: COMPLETED - All permissions documented in `SECURITY.md`
  - ✅ `storage` - justified for settings
  - ✅ `tabs` - justified for new tab functionality  
  - ✅ `activeTab` - justified for sidepanel injection
  - ✅ `webRequest` + `webRequestBlocking` - justified for header modification
  - ✅ `<all_urls>` - justified with security boundaries documented

---

## 📚 PHASE 4: DOCUMENTATION & PRESENTATION
*Professional project presentation for users and contributors*

### ✅ ~~4.1 README & Project Presentation Overhaul (MOSTLY RESOLVED)~~
- **Status**: COMPLETED
  - ✅ Version badge updated to v0.5.0
  - ✅ "Releases" links fixed to `release-notes/`
  - ✅ "Current Version" section updated
  - ⏳ Screenshots/demo GIFs (future enhancement)
- **Priority**: DONE (screenshots optional)

### 4.2 Technical Documentation Updates
- **Issue**: Some documentation may reference outdated patterns
- **Affected Files**:
  - `docs/STYLING_GUIDE.md` - verify current patterns
  - `docs/WIDGET_DEVELOPMENT.md` - widget creation guide  
  - `docs/COMPONENT_RULES.md` - architecture patterns
  - `docs/features/*` - feature-specific documentation
- **Action Items**:
  - [ ] **Verify file references** match current implementation
  - [ ] **Update code examples** to match v0.5.0 patterns
  - [ ] **Add sidepanel feature documentation** if missing
- **Priority**: 🟡 MEDIUM

### ✅ ~~4.3 Legal & Attribution Documentation (RESOLVED)~~
- **Status**: COMPLETED
  - ✅ Created `THIRD-PARTY.md` with Day.js and browser-polyfill attributions
  - ✅ LICENSE updated with correct copyright ("Clean-Browsing Contributors")
  - ✅ Created `PRIVACY_POLICY.md` for store submission

### ✅ ~~4.4 Release Notes & Version History (RESOLVED)~~
- **Status**: COMPLETED
  - ✅ Created `release-notes/v0.5.0.md` covering Firefox-first transition
  - ✅ Fixed broken link in v0.4.0 release notes

---

## 🏗️ PHASE 5: DEVELOPMENT WORKFLOW  
*Developer experience, maintainability, and automation*

### ✅ ~~5.1 Repository Cleanup & Hygiene (RESOLVED)~~
- **Status**: COMPLETED
  - ✅ No `.DS_Store` files tracked in git (verified)
  - ✅ Legacy dist archives removed
  - ✅ `.gitignore` expanded with comprehensive patterns
  - ✅ `switch-manifest.sh` removed

### ✅ ~~5.2 Build System & Packaging Improvements (MOSTLY RESOLVED)~~
- **Current State**: `package.json` has working Firefox packaging script
- **Good Practices Already Implemented**:
  - ✅ `npm run package` excludes `.DS_Store` via rsync
  - ✅ Version pulled from manifest automatically
  - ✅ `npm run lint` - ESLint with 0 errors
  - ✅ `npm run lint:fix` - Auto-fix lint issues
  - ✅ `npm run format` - Prettier formatting
  - ✅ `npm run format:check` - Check formatting
- **Remaining**:
  - [ ] **Add validation** of package contents before distribution

### 5.3 CI/CD Pipeline Enhancements
- **Current State**: Basic validation exists
- **Action Items**:
  - [ ] **Add extension validation** using web-ext for Firefox
  - [ ] **Add JSON validation** for manifests and settings
  - [ ] **Add basic smoke tests** for extension loading
- **Priority**: 🟢 LOW

### ✅ ~~5.4 Code Quality & Development Tools (RESOLVED)~~
- **Status**: COMPLETED - **0 errors, 34 warnings** (down from 182 problems)
  - ✅ ESLint configuration (`.eslintrc.json`) with WebExtension globals
  - ✅ Prettier configuration (`.prettierrc`, `.prettierignore`)
  - ✅ Package.json lint scripts (`npm run lint`, `npm run format`)
  - ✅ Fixed `configQuickAll` undefined variable bug in settings.js
  - ✅ Configured cross-file globals (settings, renderWidgets, widgetGrid, etc.)
  - ✅ Tuned rules for extension architecture (empty catches, self-assign, case declarations)
  - ⏳ Remaining 34 warnings are informational (unused vars used cross-file, `==` vs `===`)
  - ⏳ Pre-commit hooks (optional, future enhancement)

---

## 🎨 PHASE 6: UX & ACCESSIBILITY ENHANCEMENTS
*Polish, user experience improvements, and modern UI standards*

### ✅ ~~6.1 Accessibility Compliance & Improvements (RESOLVED)~~
- **Status**: COMPLETED
  - ✅ Keyboard navigation for modals (Escape, Tab trapping)
  - ✅ ARIA labels for all icon-only buttons
  - ✅ Focus management in modals (focus trap, restore on close)
  - ✅ Global keyboard shortcuts (s=settings, w=widgets, e=edit)
  - ✅ `role="dialog"` and `aria-modal` attributes on modals
  - ✅ `aria-live` regions for dynamic content
  - ⏳ Color contrast audit (future enhancement)

### ✅ ~~6.2 Performance Optimization & Polish (MOSTLY RESOLVED)~~
- **Status**: COMPLETED
  - ✅ `prefers-reduced-motion` support added to CSS
  - ✅ Enhanced focus-visible styles for keyboard users
  - ⏳ Skeleton loading states (future enhancement)

### 6.3 Modern UI Enhancements
- **Enhancement Opportunities**:
  - [ ] **Add micro-interactions** for better feedback
  - [ ] **Implement dark/light theme toggle**
  - [ ] **Add toast notifications** for user actions
- **Priority**: 🟢 LOW

---

## 📋 SIMPLIFIED IMPLEMENTATION SCHEDULE

### 🟠 **IMMEDIATE (This Week)**
1. [ ] Test sidepanel on complex websites (Gmail, GitHub, Reddit)
2. [x] ~~Update README version badge (0.3.0 → 0.5.0)~~
3. [x] ~~Fix README "Releases" link~~

### 🟡 **SHORT-TERM (Next 2 Weeks)**
1. [x] ~~Remove legacy dist files and committed `.DS_Store` files~~
2. [x] ~~Create `SECURITY.md` with permissions rationale~~
3. [x] ~~Add v0.5.0 release notes~~
4. [x] ~~Remove legacy `switch-manifest.sh`~~

### 🟢 **MEDIUM-TERM (Next Month)**
1. [x] ~~Add THIRD-PARTY attribution notices~~
2. [x] ~~Create PRIVACY_POLICY.md~~
3. [x] ~~Add accessibility improvements (ARIA labels, keyboard nav)~~
4. [x] ~~Add ESLint/Prettier configuration~~

---

## 🎯 SUCCESS METRICS & VALIDATION

### ✅ Completed Items
- Settings modal functionality
- Button styling consistency
- Default settings consolidation
- Manifest file references
- Event listener cleanup patterns
- Firefox manifest configuration
- README version badge & links
- Legacy dist files removed
- Legacy switch-manifest.sh removed
- SECURITY.md created
- PRIVACY_POLICY.md created
- THIRD-PARTY.md created
- LICENSE updated
- v0.5.0 release notes
- .gitignore expanded
- ESLint/Prettier configuration (0 errors, 34 warnings)
- Fixed `configQuickAll` undefined bug
- ARIA labels for accessibility
- Keyboard navigation for modals
- Focus management in modals
- Reduced motion support

### 🔄 In Progress
- Sidepanel resize/positioning (needs testing)

### ⏳ Pending
- Address remaining 34 ESLint warnings (informational)
- Color contrast audit
- Skeleton loading states

---

## 📝 FINAL NOTES

- **Priority Legend**: 🔴 Critical Blocker | 🟠 High Priority | 🟡 Medium Priority | 🟢 Low Priority  
- **Estimated Remaining Timeline**: 2-3 weeks for high priority items
- **Key Finding**: Many critical issues from original plan have already been addressed in v0.5.0
- **Main Focus Areas**: Security documentation, testing, and polish

---

## 🗑️ REMOVED ITEMS (Already Fixed)

The following items were in the original plan but have been verified as resolved:

1. **Sidepanel Settings Modal** - Working correctly with proper DOM selectors
2. **MV3 Service Worker Issues** - Not applicable (using MV2)
3. **Missing Manifest Files** - All files verified to exist
4. **Code Duplication** - `default-settings.js` now single source of truth
5. **ChatGPT URL Inconsistency** - All files use `chatgpt.com`
6. **Memory Leaks** - Proper cleanup implemented
7. **Manifest Switching** - No longer needed (Firefox-only)
