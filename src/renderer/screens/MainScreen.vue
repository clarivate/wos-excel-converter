<script setup lang="tsx">
import ConfigManager from '@/renderer/components/layout/ConfigManager.vue'
import TokenManager from '@/renderer/components/layout/TokenManager.vue'
</script>

<template>
  <v-container>
    <ConfigManager />
    <v-expansion-panels focusable>
      <TokenManager />
      <v-expansion-panel>
        <v-expansion-panel-title>Query Details</v-expansion-panel-title>
        <v-expansion-panel-text>Coming next in the migration.</v-expansion-panel-text>
      </v-expansion-panel>
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
