<script setup lang="tsx">
import { DefaultLayout } from '@/renderer/components/layout'
</script>

<template>
  <DefaultLayout>
    <router-view />
  </DefaultLayout>
</template>

<style>
html {
  overflow-y: auto !important;
  user-select: none;
}
html,
body {
  width: 100%;
  height: 100%;
}

/* Dark mode: swap visual emphasis between expansion panel title and text content.
   By default Vuetify makes the active-panel title lighter via a white overlay;
   we flip this so the title darkens on interaction and the text content is brighter. */
.v-theme--dark .v-expansion-panel-title {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity)) !important;
}

.v-theme--dark .v-expansion-panel-title__overlay {
  /* Use a dark overlay instead of currentColor (white) so hover/active darkens the title */
  background-color: rgba(0, 0, 0, 0.8) !important;
}

.v-theme--dark .v-expansion-panel-text__wrapper {
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}
</style>
