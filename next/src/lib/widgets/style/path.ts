// Typed path helpers for deep-partial override objects. Path is an array of
// string keys ("border", "width") — arrays are not traversed.

export type OverridePath = readonly string[];

export function getAtPath(root: unknown, path: OverridePath): unknown {
  let cur: unknown = root;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

export function hasAtPath(root: unknown, path: OverridePath): boolean {
  let cur: unknown = root;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return false;
    if (!(key in (cur as Record<string, unknown>))) return false;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur !== undefined;
}

export function setAtPath<T extends object>(root: T, path: OverridePath, value: unknown): T {
  if (path.length === 0) return root;
  const out: Record<string, unknown> = { ...(root as Record<string, unknown>) };
  let parent = out;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const existing = parent[key];
    const cloned: Record<string, unknown> =
      existing && typeof existing === "object" && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    parent[key] = cloned;
    parent = cloned;
  }
  parent[path[path.length - 1]] = value;
  return out as T;
}

export function unsetAtPath<T extends object>(root: T, path: OverridePath): T {
  if (path.length === 0) return root;
  // Walk down, cloning each node along the path.
  const out: Record<string, unknown> = { ...(root as Record<string, unknown>) };
  const stack: Record<string, unknown>[] = [out];
  let parent = out;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const existing = parent[key];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      return root; // nothing to unset
    }
    const cloned = { ...(existing as Record<string, unknown>) };
    parent[key] = cloned;
    parent = cloned;
    stack.push(parent);
  }
  const leaf = path[path.length - 1];
  if (!(leaf in parent)) return root;
  delete parent[leaf];

  // Prune any now-empty intermediate objects so diffs stay compact.
  for (let i = stack.length - 1; i > 0; i--) {
    const node = stack[i];
    if (Object.keys(node).length === 0) {
      const parentNode = stack[i - 1];
      delete parentNode[path[i - 1]];
    } else {
      break;
    }
  }
  return out as T;
}
