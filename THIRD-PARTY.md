# Third-Party Licenses

Clean-Browsing includes the following third-party libraries. We thank the authors for their contributions to open source.

---

## Day.js

**Location**: `extension/libs/dayjs/`  
**Version**: 1.x  
**License**: MIT  
**Website**: https://day.js.org/  
**Repository**: https://github.com/iamkun/dayjs

### Files Included
- `dayjs.min.js` - Core library
- `plugin/advancedFormat.js` - Extended formatting tokens
- `plugin/localizedFormat.js` - Localized date formats

### License Text

```
MIT License

Copyright (c) 2018-present, iamkun

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## webextension-polyfill

**Location**: `extension/libs/browser-polyfill.js`  
**Version**: 0.x  
**License**: MPL-2.0  
**Website**: https://github.com/nicknisi/webextension-polyfill  
**Original**: https://github.com/nicknisi/nicknisi-polyfill (Mozilla)

### Purpose
Provides a Promise-based `browser.*` API that works consistently across Firefox and Chromium browsers. Clean-Browsing uses this to maintain a unified codebase.

### License Text

```
Mozilla Public License Version 2.0

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
```

---

## Summary

| Library | License | Usage |
|---------|---------|-------|
| Day.js | MIT | Date/time formatting in widgets |
| webextension-polyfill | MPL-2.0 | Cross-browser API compatibility |

All included libraries are compatible with Clean-Browsing's MIT license and are used in accordance with their respective license terms.

---

*Last updated: January 2026*

