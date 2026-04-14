<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  recordsFound: number | null
  chipId?: string
}>()

const recordsOverLimit = computed(() => props.recordsFound !== null && props.recordsFound > 100000)
const recordsFormatted = computed(() =>
  props.recordsFound !== null ? new Intl.NumberFormat('en-US').format(props.recordsFound) : ''
)
</script>

<template>
  <v-tooltip
    v-if="recordsFound !== null && recordsOverLimit"
    location="top"
    max-width="300"
  >
    <template #activator="{ props: tooltipProps }">
      <v-chip
        :id="chipId"
        v-bind="tooltipProps"
        size="small"
        color="warning"
        variant="outlined"
      >
        <span class="text-medium-emphasis">
          {{ t('query.summary.records-short') }}: {{ recordsFormatted }}
        </span>
      </v-chip>
    </template>
    <span>{{ t('query.summary.records-over-limit-warning') }}</span>
  </v-tooltip>

  <v-chip
    v-else-if="recordsFound !== null"
    :id="chipId"
    size="small"
    variant="outlined"
  >
    {{ t('query.summary.records-short') }}: {{ recordsFormatted }}
  </v-chip>
</template>
