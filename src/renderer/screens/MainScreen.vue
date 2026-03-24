<script setup lang="tsx">
import ConfigManager from '@/renderer/components/managers/ConfigManager.vue'
import QueryDetailsManager from '@/renderer/components/managers/QueryDetailsManager.vue'
import TokenManager from '@/renderer/components/managers/TokenManager.vue'
</script>

<template>
  <v-container>
    <ConfigManager />
    <v-expansion-panels focusable>
      <TokenManager />
      <QueryDetailsManager />
      <v-expansion-panel>
        <v-expansion-panel-title>Export Format</v-expansion-panel-title>
        <v-expansion-panel-text>Coming next in the migration.</v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>Export Settings</v-expansion-panel-title>
        <v-expansion-panel-text>Coming next in the migration.</v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>
