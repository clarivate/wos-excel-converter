<script setup lang="tsx">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { openLogFile, throwError } from '@/renderer/utils'

const logs = ref('')
const textareaRef = ref<any>(null)
const MAX_LINES = 100

const handleLog = (_event: any, message: string) => {
  const currentLines = logs.value.split('\n')
  currentLines.push(message)

  if (currentLines.length > MAX_LINES) {
    logs.value = currentLines.slice(-MAX_LINES).join('\n')
  } else {
    logs.value = currentLines.join('\n')
  }

  // Auto-scroll to bottom
  nextTick(() => {
    if (textareaRef.value?.$el) {
      const textarea = textareaRef.value.$el.querySelector('textarea')
      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight
      }
    }
  })
}
const openLog = () => {
  console.info('Opening log file')
  openLogFile()
}

onMounted(() => {
  window.mainApi.on('onLog', handleLog)
})

onBeforeUnmount(() => {
  window.mainApi.off('onLog', handleLog)
})
</script>

<template>
  <v-container
    class="fill-height d-flex flex-column"
    fluid
  >
    <v-row
      no-gutters
      class="flex-grow-1 w-100"
    >
      <v-col
        cols="12"
        class="d-flex flex-column"
      >
        <v-btn
          variant="text"
          color="primary"
          size="small"
          prepend-icon="mdi-file-document-outline"
          @click="openLog"
        >
          Open Log File
        </v-btn>
        <v-btn
          variant="text"
          color="primary"
          size="small"
          prepend-icon="mdi-file-document-outline"
          @click="throwError('Opps', false)"
        >
          Throw renderer error
        </v-btn>
        <v-btn
          variant="text"
          color="primary"
          size="small"
          prepend-icon="mdi-file-document-outline"
          @click="throwError('Opps', true)"
        >
          Throw main error
        </v-btn>
        <v-textarea
          ref="textareaRef"
          v-model="logs"
          label="Application Logs"
          readonly
          variant="outlined"
          no-resize
          class="log-textarea flex-grow-1"
          density="compact"
          bg-color="background"
          color="primary"
          hide-details
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Ensure the container takes full height of the parent */
.fill-height {
  height: 70%;
}

/* Force the Vuetify textarea control to expand to its container's height */
:deep(.log-textarea) {
  display: flex;
  flex-direction: column;
}

:deep(.log-textarea .v-input__control) {
  flex-grow: 0.9;
}

:deep(.log-textarea .v-field) {
  flex-grow: 1;
  display: flex;
}

:deep(.log-textarea .v-field__field) {
  height: 100%;
}

:deep(.log-textarea textarea) {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.8rem;
  height: 100% !important; /* This is the key to make it fill the space */
  overflow-y: auto;
}
</style>
