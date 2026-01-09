# Security Policy

## Overview

Clean-Browsing is a privacy-first Firefox extension that enhances browsing with a customizable dashboard and universal sidepanel. This document explains our security practices, permission usage, and data handling.

## Permissions Rationale

### Required Permissions

| Permission | Purpose | Scope |
|------------|---------|-------|
| `storage` | Save user preferences, widget configurations, and sidepanel settings | Local browser storage only |
| `tabs` | Access tab information for sidepanel injection and new tab override | Required for core functionality |
| `activeTab` | Inject sidepanel into the currently active tab when user clicks extension icon | User-initiated only |
| `webRequest` | Intercept HTTP response headers for iframe embedding | See Header Modification section |
| `webRequestBlocking` | Synchronously modify headers before browser processes them | Required for iframe compatibility |
| `<all_urls>` | Enable sidepanel embedding on any website the user chooses | User-controlled per-session |

### Why `<all_urls>` is Necessary

The universal sidepanel feature allows users to embed any website. Since users choose which sites to embed, we cannot pre-define a restricted URL list. However:

- Header modification is **scoped to user-initiated actions only**
- Each session tracks origins **per-tab** with automatic cleanup
- No headers are modified without explicit user action (loading a URL in the sidepanel)

## Header Modification

### What We Modify

When a user loads a website in the sidepanel, we remove the following response headers **for that specific origin only**:

| Header | Why Removed |
|--------|-------------|
| `X-Frame-Options` | Allows iframe embedding (sites use this to prevent embedding) |
| `Content-Security-Policy` | Removes `frame-ancestors` directive that blocks embedding |
| `X-Content-Security-Policy` | Legacy CSP header |
| `Permissions-Policy` | May restrict iframe functionality |
| `Cross-Origin-Opener-Policy` | Can break cross-origin iframe communication |
| `Cross-Origin-Embedder-Policy` | Can block iframe loading |

### Security Boundaries

1. **User-Initiated Only**: Headers are only modified after the user explicitly loads a URL in the sidepanel
2. **Per-Tab Scoping**: Each browser tab maintains its own set of allowed origins
3. **Sub-Frame Only**: Only `sub_frame` requests are modified (not main page loads)
4. **Session Cleanup**: Origins are cleared when tabs close
5. **Automatic Garbage Collection**: Sessions are cleaned up every 5 minutes

### What We Do NOT Modify

- Main document requests (only iframes)
- Requests in tabs where the user hasn't used the sidepanel
- Any requests outside user-initiated sessions

## Data Handling

### Local Storage Only

All data stays on your device:

- ✅ Widget configurations
- ✅ Sidepanel settings (bookmarks, preferred URLs)
- ✅ Appearance preferences
- ✅ Grid layouts

### No External Communication

- ❌ No analytics or telemetry
- ❌ No external API calls (except user-requested sites in sidepanel)
- ❌ No data collection or transmission
- ❌ No user tracking

### Data Export

Users can export their configuration as JSON for backup or sharing. This export contains only settings data, never browsing history or personal information.

## Vulnerability Reporting

If you discover a security vulnerability, please report it responsibly:

1. **Email**: [Create an issue with the security label](../../issues/new)
2. **Do not** disclose publicly until we've had a chance to address it
3. **Include**: Steps to reproduce, potential impact, and suggested fix if known

We aim to acknowledge reports within 48 hours and provide a fix timeline within 7 days.

## Security Best Practices

### For Users

- Only embed trusted websites in the sidepanel
- Be aware that embedded sites can still run JavaScript
- Review your sidepanel bookmarks periodically
- Keep Firefox updated

### For Contributors

- Never introduce external dependencies without review
- Maintain the principle of least privilege
- Document any new permission requirements
- Follow secure coding practices for DOM manipulation

## Audit Trail

| Version | Security Changes |
|---------|-----------------|
| v0.5.0 | Firefox-first architecture, unified header modification pipeline |
| v0.4.0 | Professional rebrand, no security changes |
| v0.3.0 | Initial sidepanel with per-tab origin scoping |

---

*Last updated: January 2026*

