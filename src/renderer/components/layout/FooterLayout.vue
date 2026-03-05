<script setup lang="tsx">
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

const route: any = useRoute()

const isCurrentRoute = (path: string): boolean => {
  return path === route.path
}
</script>
<template>
  <v-footer
    v-if="!isCurrentRoute('/about')"
    app
    elevation="5"
    density="default"
    color="background"
    class="d-flex justify-start pa-0"
  >
    <v-btn
      size="large"
      class="ma-0"
      color="primary"
      variant="flat"
      rounded="0"
    >
      {{ t('footer.export') }}
    </v-btn>
    <v-row class="pa-2">
      <v-col cols="2"> hi </v-col>
    </v-row>
  </v-footer>
</template>
<style scoped></style>
