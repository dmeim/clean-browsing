#!/bin/bash

# Manifest switching script for Clean-Browsing extension
# Switches between Chrome (Manifest V3) and Firefox (Manifest V2) manifests

EXTENSION_DIR="extension"
CHROME_MANIFEST="$EXTENSION_DIR/manifest.chrome.json"
FIREFOX_MANIFEST="$EXTENSION_DIR/manifest.firefox.json"
ACTIVE_MANIFEST="$EXTENSION_DIR/manifest.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_usage() {
    echo -e "${BLUE}Clean-Browsing Manifest Switcher${NC}"
    echo ""
    echo "Usage: ./switch-manifest.sh [browser]"
    echo ""
    echo "Available browsers:"
    echo "  firefox  - Switch to Firefox-compatible manifest (Manifest V2)"
    echo "  chrome   - Switch to Chrome-compatible manifest (Manifest V3)"
    echo "  status   - Show current active manifest"
    echo ""
    echo "Examples:"
    echo "  ./switch-manifest.sh firefox"
    echo "  ./switch-manifest.sh chrome"
    echo "  ./switch-manifest.sh status"
}

show_status() {
    if [ -f "$ACTIVE_MANIFEST" ]; then
        if cmp -s "$ACTIVE_MANIFEST" "$CHROME_MANIFEST" 2>/dev/null; then
            echo -e "${GREEN}Current manifest: Chrome (Manifest V3)${NC}"
        elif cmp -s "$ACTIVE_MANIFEST" "$FIREFOX_MANIFEST" 2>/dev/null; then
            echo -e "${YELLOW}Current manifest: Firefox (Manifest V2)${NC}"
        else
            echo -e "${RED}Current manifest: Unknown (modified or custom)${NC}"
        fi
    else
        echo -e "${RED}No active manifest found${NC}"
    fi
}

# Check if required files exist
check_files() {
    if [ ! -f "$CHROME_MANIFEST" ]; then
        echo -e "${RED}Error: Chrome manifest not found at $CHROME_MANIFEST${NC}"
        return 1
    fi
    if [ ! -f "$FIREFOX_MANIFEST" ]; then
        echo -e "${RED}Error: Firefox manifest not found at $FIREFOX_MANIFEST${NC}"
        return 1
    fi
    return 0
}

# Main script logic
case "$1" in
    "firefox")
        if ! check_files; then exit 1; fi
        cp "$FIREFOX_MANIFEST" "$ACTIVE_MANIFEST"
        echo -e "${GREEN}✓ Switched to Firefox manifest (Manifest V2)${NC}"
        echo -e "${YELLOW}→ Extension is now ready for Firefox testing${NC}"
        ;;
    "chrome")
        if ! check_files; then exit 1; fi
        cp "$CHROME_MANIFEST" "$ACTIVE_MANIFEST"
        echo -e "${GREEN}✓ Switched to Chrome manifest (Manifest V3)${NC}"
        echo -e "${YELLOW}→ Extension is now ready for Chrome testing${NC}"
        ;;
    "status")
        show_status
        ;;
    *)
        show_usage
        ;;
esac