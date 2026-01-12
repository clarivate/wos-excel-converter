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
  >
    <v-row>
      <v-col cols="2">
        <v-btn
          size="large"
          color="primary"
        >
          {{ t('footer.export') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-footer>
</template>
<style scoped></style>
