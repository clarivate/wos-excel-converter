<script setup lang="tsx">
import HeaderLayout from '@/renderer/components/layout/HeaderLayout.vue'
import FooterLayout from '@/renderer/components/layout/FooterLayout.vue'
</script>

<template>
  <v-app>
    <v-layout>
      <header-layout />
      <v-main>
        <slot />
      </v-main>
    </v-layout>
    <footer-layout />
  </v-app>
</template>
