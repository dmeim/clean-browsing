<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { uiStore } from "./uiStore.svelte.js";
</script>

<Dialog.Root
  open={uiStore.settingsOpen}
  onOpenChange={(v) => uiStore.setSettingsOpen(v)}
>
  <Dialog.Content class="bg-slate-900 border-slate-700 text-slate-100">
    <Dialog.Header>
      <Dialog.Title class="text-slate-100">Settings</Dialog.Title>
      <Dialog.Description class="text-slate-400">
        Configure global preferences and widget defaults.
      </Dialog.Description>
    </Dialog.Header>

    <div class="py-4 space-y-3 text-sm text-slate-300">
      <p>Settings panel — sections will be added here.</p>
      <ul class="list-disc list-inside space-y-1 text-slate-400">
        <li>Appearance &amp; theme</li>
        <li>Grid dimensions</li>
        <li>Widget defaults</li>
        <li>Import / export layout</li>
      </ul>
    </div>
  </Dialog.Content>
</Dialog.Root>
