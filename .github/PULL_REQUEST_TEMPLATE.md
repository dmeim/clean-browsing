# Pull Request

## Summary

What does this change do, and why?

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] New widget
- [ ] Refactor / internal cleanup
- [ ] Documentation
- [ ] Build / CI / tooling
- [ ] Breaking change

## Widget changes (if applicable)

- [ ] New widget folder under `src/lib/widgets/<id>/` with `<Name>.svelte`, `<Name>Settings.svelte`, and `definition.ts`
- [ ] `registerWidget(def)` called at the bottom of `definition.ts`
- [ ] `import "./<id>/definition.js";` added to `src/lib/widgets/index.ts`
- [ ] Followed the conventions in [`docs/WIDGET_DEVELOPMENT.md`](../docs/WIDGET_DEVELOPMENT.md)

## Testing

- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] `npm run check` passes (0 errors, 0 warnings)
- [ ] `npm run build` succeeds
- [ ] Loaded `dist/manifest.json` via `about:debugging#/runtime/this-firefox` and verified the change works in Firefox
- [ ] Regressions checked: existing widgets still render, edit mode still works, light/dark still toggles

## Version bump

Clean Browsing uses `X.Y.Z` semver. By default only the patch (Z) digit moves — only bump Y or X if a maintainer explicitly says so.

- [ ] `package.json` version bumped
- [ ] `public/manifest.json` version bumped to match
- [ ] `docs/release-notes/vX.Y.Z.md` updated or created (if the change is user-visible)

## Screenshots / recordings

Attach before/after for any UI change.

## Additional notes

Anything a reviewer should know — open questions, follow-ups, related issues.
