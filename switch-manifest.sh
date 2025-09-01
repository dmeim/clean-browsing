#!/bin/bash

# Clean-Browsing Extension Status Script
# The extension now uses a unified cross-browser approach!
# 
# SIMPLIFIED: No more manifest switching needed!
# The current manifest.json works in both Chrome and Firefox.

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
    echo -e "${BLUE}Clean-Browsing Extension Manager${NC}"
    echo ""
    echo -e "${GREEN}✅ EXTENSION SIMPLIFIED!${NC}"
    echo -e "The extension now uses a unified Manifest V2 approach that works in both Chrome and Firefox."
    echo ""
    echo "Usage: ./switch-manifest.sh [command]"
    echo ""
    echo "Available commands:"
    echo "  status     - Show current manifest information"
    echo "  legacy     - Restore old manifest switching (Chrome MV3/Firefox MV2)"
    echo "  cleanup    - Remove old Chrome/Firefox specific manifests"
    echo ""
    echo "Examples:"
    echo "  ./switch-manifest.sh status"
    echo "  ./switch-manifest.sh cleanup"
}

show_status() {
    echo -e "${BLUE}Clean-Browsing Extension Status${NC}"
    echo ""
    
    if [ -f "$ACTIVE_MANIFEST" ]; then
        VERSION=$(grep '"version"' "$ACTIVE_MANIFEST" | sed 's/.*"version": *"\([^"]*\)".*/\1/')
        MANIFEST_VERSION=$(grep '"manifest_version"' "$ACTIVE_MANIFEST" | sed 's/.*"manifest_version": *\([0-9]*\).*/\1/')
        
        echo -e "${GREEN}✅ Current manifest: Unified Cross-Browser (Manifest V${MANIFEST_VERSION})${NC}"
        echo -e "   Version: $VERSION"
        echo -e "   File: extension/manifest.json"
        echo ""
        echo -e "${YELLOW}Browser Compatibility:${NC}"
        echo -e "   ✅ Chrome: Supported (Manifest V2)"
        echo -e "   ✅ Firefox: Supported (Native Manifest V2)"
        echo ""
        echo -e "${BLUE}Features:${NC}"
        echo -e "   ✅ Unified API wrapper (browser-api.js)"
        echo -e "   ✅ Single webRequest implementation"
        echo -e "   ✅ No Chrome-specific declarativeNetRequest"
        echo -e "   ✅ Simplified header modification"
        echo ""
        
        if [ -f "$CHROME_MANIFEST" ] || [ -f "$FIREFOX_MANIFEST" ]; then
            echo -e "${YELLOW}Legacy files detected:${NC}"
            [ -f "$CHROME_MANIFEST" ] && echo -e "   📁 $CHROME_MANIFEST (no longer needed)"
            [ -f "$FIREFOX_MANIFEST" ] && echo -e "   📁 $FIREFOX_MANIFEST (no longer needed)"
            echo -e "   Run './switch-manifest.sh cleanup' to remove them"
        fi
    else
        echo -e "${RED}❌ No active manifest found${NC}"
        echo -e "   Expected: $ACTIVE_MANIFEST"
    fi
}

cleanup_legacy() {
    echo -e "${YELLOW}Cleaning up legacy manifest files...${NC}"
    
    if [ -f "$CHROME_MANIFEST" ]; then
        rm "$CHROME_MANIFEST"
        echo -e "${GREEN}✅ Removed: $CHROME_MANIFEST${NC}"
    fi
    
    if [ -f "$FIREFOX_MANIFEST" ]; then
        rm "$FIREFOX_MANIFEST"
        echo -e "${GREEN}✅ Removed: $FIREFOX_MANIFEST${NC}"
    fi
    
    # Also remove frame-rules.json if it exists (Chrome MV3 specific)
    if [ -f "$EXTENSION_DIR/frame-rules.json" ]; then
        rm "$EXTENSION_DIR/frame-rules.json"
        echo -e "${GREEN}✅ Removed: frame-rules.json (Chrome MV3 specific)${NC}"
    fi
    
    echo -e "${GREEN}✅ Legacy cleanup complete!${NC}"
}

restore_legacy() {
    echo -e "${YELLOW}This would restore the old Chrome MV3/Firefox MV2 switching system.${NC}"
    echo -e "${RED}WARNING: This undoes the simplification and adds complexity back.${NC}"
    echo ""
    read -p "Are you sure you want to restore legacy switching? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Legacy restoration not implemented in this simplified version.${NC}"
        echo -e "If you need the old system, check the git history."
    else
        echo -e "${GREEN}Keeping the simplified approach. Good choice!${NC}"
    fi
}

# Main script logic
case "$1" in
    "status"|"")
        show_status
        ;;
    "cleanup")
        cleanup_legacy
        ;;
    "legacy")
        restore_legacy
        ;;
    *)
        show_usage
        ;;
esac