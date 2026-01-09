# Privacy Policy

**Effective Date**: January 2026  
**Extension**: Clean-Browsing  
**Version**: 0.5.0+

---

## Summary

Clean-Browsing is a privacy-first browser extension. **We do not collect, store, or transmit any personal data.** All your settings and preferences remain entirely on your device.

---

## Data Collection

### What We Do NOT Collect

- ❌ Browsing history
- ❌ Search queries
- ❌ Personal information
- ❌ Usage analytics or telemetry
- ❌ IP addresses
- ❌ Device identifiers
- ❌ Cookies or tracking data

### What We Store Locally

The following data is stored **only on your device** using Firefox's built-in storage API:

| Data Type | Purpose | Location |
|-----------|---------|----------|
| Widget settings | Remember your dashboard layout | Local storage |
| Appearance preferences | Maintain your theme and style choices | Local storage |
| Sidepanel bookmarks | Quick access to your favorite sites | Local storage |
| Grid positions | Save widget placement on dashboard | Local storage |

This data **never leaves your browser** and is not accessible to us or any third party.

---

## Permissions Explained

Clean-Browsing requires certain browser permissions to function. Here's what each permission does:

| Permission | What It Does | Why We Need It |
|------------|--------------|----------------|
| `storage` | Save your preferences locally | Remember settings between sessions |
| `tabs` | Access current tab information | Enable sidepanel on websites |
| `activeTab` | Interact with current page | Inject sidepanel when you click the icon |
| `webRequest` | See network request headers | Enable iframe embedding for sidepanel |
| `<all_urls>` | Access any website | Let you embed any site in sidepanel |

**Important**: While these permissions sound broad, we only use them when you explicitly interact with the extension. We do not monitor, record, or transmit any browsing activity.

---

## Third-Party Services

### No External Connections

Clean-Browsing makes **no connections to external servers** except:

1. Websites you explicitly load in the sidepanel (your choice)
2. Search engines when you use the search widget (your choice)

We do not use:
- Analytics services (no Google Analytics, Mixpanel, etc.)
- Crash reporting services
- Advertising networks
- Data brokers

---

## Data Export & Deletion

### Export Your Data

You can export your settings at any time:
1. Open the settings modal
2. Click "Export Configuration"
3. Save the JSON file

This file contains only your preferences—no personal or browsing data.

### Delete Your Data

To completely remove all Clean-Browsing data:
1. Uninstall the extension, OR
2. Clear extension data in Firefox settings:
   - `about:addons` → Clean-Browsing → Remove

---

## Children's Privacy

Clean-Browsing does not knowingly collect information from children under 13. The extension requires no account or personal information to use.

---

## Changes to This Policy

If we make changes to this privacy policy, we will:
1. Update the "Effective Date" above
2. Include changes in release notes
3. Maintain previous versions in our repository

---

## Contact

For privacy-related questions:
- Open an issue: [GitHub Issues](../../issues)
- Review our code: The extension is open source

---

## Your Rights

Since we don't collect personal data, traditional data rights (access, deletion, portability) don't apply. However, you always have:

- **Full control** over your local data via export/import
- **Complete transparency** via our open-source codebase
- **Easy removal** by uninstalling the extension

---

*This privacy policy applies to Clean-Browsing version 0.5.0 and later.*

