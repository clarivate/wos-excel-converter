<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import {
  parseFieldTags,
  getFieldTagSuggestions,
  WOS_BOOLEAN_OPERATORS
} from '@/renderer/utils/wosFieldTags'
import type { FieldTag } from '@/renderer/utils/wosFieldTags'

interface Props {
  modelValue: string
  label?: string
  hint?: string
  disabled?: boolean
  placeholder?: string
  persistentHint?: boolean
  autocomplete?: string
  spellcheck?: boolean
  autocorrect?: string
  autocapitalize?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  hint: '',
  disabled: false,
  placeholder: '',
  persistentHint: false,
  autocomplete: 'off',
  spellcheck: false,
  autocorrect: 'off',
  autocapitalize: 'off'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement>()
const highlighterRef = ref<HTMLDivElement>()
const autocompleteMenuOpen = ref(false)
const autocompletePos = ref<{ top: number; left: number } | null>(null)
const selectedSuggestionIndex = ref(-1)
const fieldTagSuggestions = ref<FieldTag[]>([])

// Sync scroll between textarea and highlighter
const onScroll = (): void => {
  if (!textareaRef.value || !highlighterRef.value) return
  highlighterRef.value.scrollTop = textareaRef.value.scrollTop
  highlighterRef.value.scrollLeft = textareaRef.value.scrollLeft
}

// Generate highlighted HTML for syntax
const highlightedHTML = computed(() => {
  const text = props.modelValue
  const fieldTags = parseFieldTags(text)

  if (fieldTags.length === 0) return escapeHtml(text)

  let html = ''
  let lastEnd = 0

  for (const tag of fieldTags) {
    // Add text before this tag
    html += escapeHtml(text.substring(lastEnd, tag.start))

    // Add highlighted field tag
    const tagCode = text.substring(tag.start, tag.start + tag.code.length)
    const equalSign = text.substring(tag.start + tag.code.length, tag.end)
    html += `<span class="wos-field-tag">${escapeHtml(tagCode)}</span>${escapeHtml(equalSign)}`

    lastEnd = tag.end
  }

  // Add remaining text
  html += escapeHtml(text.substring(lastEnd))

  return html
})

// Sanitize HTML
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

// Handle textarea input
const handleInput = (event: Event): void => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

// Handle autocomplete suggestions
const handleTextareaKeyup = (): void => {
  if (!textareaRef.value) return

  const cursorPos = textareaRef.value.selectionStart
  const text = props.modelValue
  const textBeforeCursor = text.substring(0, cursorPos)
  const lastLine = textBeforeCursor.split('\n').pop() || ''
  const lastWord = lastLine.split(/[\s()]+/).pop() || ''

  // Show autocomplete if typing a potential field tag (1-3 letters before =)
  if (/^[A-Z]{1,3}$/.test(lastWord)) {
    fieldTagSuggestions.value = getFieldTagSuggestions(text, cursorPos)

    if (fieldTagSuggestions.value.length > 0) {
      autocompleteMenuOpen.value = true
      selectedSuggestionIndex.value = 0

      // Calculate position for autocomplete menu
      const textareaRect = textareaRef.value.getBoundingClientRect()
      const lineHeight = parseInt(window.getComputedStyle(textareaRef.value).lineHeight)
      const lines = textBeforeCursor.split('\n')
      const lineNumber = lines.length - 1
      const colNumber = (lines[lines.length - 1] || '').length

      // Approximate column position (rough calculation)
      const charWidth = 8 // Average character width in monospace
      autocompletePos.value = {
        top: textareaRect.top + lineHeight * (lineNumber + 1),
        left: textareaRect.left + colNumber * charWidth
      }
    } else {
      autocompleteMenuOpen.value = false
    }
  } else {
    autocompleteMenuOpen.value = false
    selectedSuggestionIndex.value = -1
  }
}

// Handle keyboard navigation in autocomplete
const handleTextareaKeydown = (event: KeyboardEvent): void => {
  if (!autocompleteMenuOpen.value) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedSuggestionIndex.value = Math.min(
      selectedSuggestionIndex.value + 1,
      fieldTagSuggestions.value.length - 1
    )
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, 0)
  } else if (event.key === 'Enter' || event.key === 'Tab') {
    event.preventDefault()
    insertSuggestion(fieldTagSuggestions.value[selectedSuggestionIndex.value])
  } else if (event.key === 'Escape') {
    autocompleteMenuOpen.value = false
  }
}

// Insert selected suggestion
const insertSuggestion = (tag: FieldTag): void => {
  if (!textareaRef.value) return

  const cursorPos = textareaRef.value.selectionStart
  const text = props.modelValue
  const textBeforeCursor = text.substring(0, cursorPos)
  const lastLine = textBeforeCursor.split('\n').pop() || ''
  const lastWord = lastLine.split(/[\s()]+/).pop() || ''

  // Remove the partially typed field tag
  const beforeWord = textBeforeCursor.substring(0, textBeforeCursor.length - lastWord.length)
  const afterCursor = text.substring(cursorPos)

  // Insert completed field tag with = and space
  const newText = beforeWord + tag.code + '= ' + afterCursor
  emit('update:modelValue', newText)

  // Move cursor after the inserted tag
  nextTick(() => {
    if (textareaRef.value) {
      const newCursorPos = beforeWord.length + tag.code.length + 2 // +2 for '= '
      textareaRef.value.setSelectionRange(newCursorPos, newCursorPos)
      textareaRef.value.focus()
    }
  })

  autocompleteMenuOpen.value = false
}

// Update on model value change
watch(
  () => props.modelValue,
  () => {
    nextTick(() => {
      onScroll()
    })
  }
)
</script>

<template>
  <div class="wos-query-highlighter">
    <!-- Hidden highlighter for syntax highlighting -->
    <div
      ref="highlighterRef"
      class="wos-highlighter"
      :style="{ color: 'transparent', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }"
    >
      <div
        class="wos-highlighter-content"
        v-html="highlightedHTML"
      />
    </div>

    <!-- Actual textarea input -->
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :label="label"
      :hint="hint"
      :disabled="disabled"
      :placeholder="placeholder"
      :spellcheck="spellcheck"
      :autocorrect="autocorrect"
      :autocapitalize="autocapitalize"
      :autocomplete="autocomplete"
      class="wos-textarea"
      @input="handleInput"
      @scroll="onScroll"
      @keyup="handleTextareaKeyup"
      @keydown="handleTextareaKeydown"
    />

    <!-- Autocomplete menu -->
    <div
      v-if="autocompleteMenuOpen && autocompletePos"
      class="wos-autocomplete-menu"
      :style="{
        top: `${autocompletePos.top}px`,
        left: `${autocompletePos.left}px`
      }"
    >
      <div
        v-for="(tag, index) in fieldTagSuggestions"
        :key="tag.code"
        class="wos-autocomplete-item"
        :class="{ active: index === selectedSuggestionIndex }"
        @click="insertSuggestion(tag)"
      >
        <div class="wos-autocomplete-code">{{ tag.code }}</div>
        <div class="wos-autocomplete-label">{{ tag.label }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wos-query-highlighter {
  position: relative;
  display: inline-block;
  width: 100%;
}

.wos-highlighter {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: inherit;
  border: inherit;
  overflow: hidden;
  pointer-events: none;
  background: transparent;
  font-family: monospace;
  font-size: inherit;
  line-height: inherit;
  letter-spacing: inherit;
}

.wos-highlighter-content {
  display: inline-block;
  width: 100%;
  min-height: 100%;
}

.wos-textarea {
  position: relative;
  background: transparent;
  color: inherit;
  font-family: monospace;
  font-size: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  outline: none;
  resize: none;
  caret-color: currentColor;
  z-index: 2;
}

/* Light theme: field tags in blue-ish color */
:root {
  color-scheme: light;
}

.wos-field-tag {
  font-weight: bold;
  color: #1976d2;
}

@media (prefers-color-scheme: dark) {
  .wos-field-tag {
    color: #42a5f5;
  }
}

.wos-autocomplete-menu {
  position: fixed;
  background: var(--v-background-base);
  border: 1px solid var(--v-border-color);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  min-width: 250px;
}

.wos-autocomplete-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s;
}

.wos-autocomplete-item:hover,
.wos-autocomplete-item.active {
  background-color: var(--v-hover-base);
}

.wos-autocomplete-code {
  font-weight: bold;
  color: #1976d2;
  min-width: 40px;
  font-family: monospace;
}

@media (prefers-color-scheme: dark) {
  .wos-autocomplete-code {
    color: #42a5f5;
  }
}

.wos-autocomplete-label {
  color: var(--v-text-base);
  font-size: 0.875rem;
}
</style>
