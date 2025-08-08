<template>
  <!-- The side panel overlays the entire viewport when open.  A tabindex and
       keydown handler allow the panel to capture focus and close on Escape. -->
  <div
    v-if="sidePanelStore.isOpen"
    class="fixed inset-0 z-40"
    tabindex="-1"
    @keydown.esc.stop="sidePanelStore.close()"
    ref="panelContainer"
  >
    <!-- Backdrop with glassmorphism effect -->
    <transition
      enter-active-class="transition-opacity ease-in-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-in-out duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <!-- The backdrop utilises a subtle glassmorphism effect: semi‑transparent tint with blur -->
      <div
        @click="sidePanelStore.close()"
        class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md"
      ></div>
    </transition>

    <!-- Panel -->
    <transition
      enter-active-class="transform transition ease-in-out duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition ease-in-out duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        class="fixed top-0 right-0 h-full w-full max-w-2xl shadow-2xl panel-bg"
        ref="panelContent"
      >
        <!-- Render the selected component -->
        <component
          :is="sidePanelStore.view"
          v-bind="sidePanelStore.props"
          @close="sidePanelStore.close()"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { sidePanelStore } from '../stores/sidePanelStore'
import { ref, watch, nextTick } from 'vue'

// A reference to the panel container.  When the panel opens this element
// receives focus so that keyboard users can press Escape to close it.
const panelContainer = ref(null)
const panelContent = ref(null)

// Watch the isOpen state and focus the container on open.  Use nextTick
// because the element is only rendered once isOpen becomes true.
watch(
  () => sidePanelStore.isOpen,
  async (open) => {
    if (open) {
      await nextTick()
      panelContainer.value && panelContainer.value.focus()
    }
  }
)
</script>

<style scoped>
.panel-bg {
  background-color: var(--c-bg-secondary);
}
</style>
