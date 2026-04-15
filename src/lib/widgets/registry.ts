import type { WidgetDefinition } from "./types.js";

const registry = new Map<string, WidgetDefinition<any>>();

export function registerWidget<T>(def: WidgetDefinition<T>): void {
  if (registry.has(def.id)) {
    console.warn(`[registry] widget "${def.id}" is already registered — overwriting`);
  }
  registry.set(def.id, def as WidgetDefinition<any>);
}

export function getWidget(id: string): WidgetDefinition<any> | undefined {
  return registry.get(id);
}

export function listWidgets(): WidgetDefinition<any>[] {
  return Array.from(registry.values());
}
