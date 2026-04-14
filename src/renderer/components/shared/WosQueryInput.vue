<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import {
  getFieldTagSuggestions,
  isInsideQuotes,
  WOS_RESERVED_WORDS
} from '@/renderer/utils/wosFieldTags'
import type { FieldTag } from '@/renderer/utils/wosFieldTags'

// ── Types ───────────────────────────────────────────────────────────────────
interface Props {
  modelValue: string
  label?: string
  hint?: string
  disabled?: boolean
  placeholder?: string
  persistentHint?: boolean
  variant?:
    | 'outlined'
    | 'plain'
    | 'filled'
    | 'solo'
    | 'solo-filled'
    | 'solo-inverted'
    | 'underlined'
  id?: string
  spellcheck?: boolean
}

/** Unified autocomplete suggestion – field tag or boolean operator */
interface SuggestionItem {
  code: string
  label: string
  description: string
  kind: 'tag' | 'bool'
}

// ── Static data ──────────────────────────────────────────────────────────────
const BOOL_ITEMS: SuggestionItem[] = [
  { code: 'AND', label: 'AND', description: 'Both conditions must be true', kind: 'bool' },
  { code: 'OR', label: 'OR', description: 'Either condition can be true', kind: 'bool' },
  {
    code: 'NOT',
    label: 'NOT',
    description: 'Excludes records matching the next term',
    kind: 'bool'
  },
  {
    code: 'NEAR',
    label: 'NEAR',
    description: 'Terms within a specified word distance',
    kind: 'bool'
  },
  {
    code: 'SAME',
    label: 'SAME',
    description: 'Terms in the same sentence or address',
    kind: 'bool'
  }
]

const reservedWordSet = new Set(WOS_RESERVED_WORDS)

// ── Props / emits ────────────────────────────────────────────────────────────
const props = withDefaults(defineProps<Props>(), {
  label: '',
  hint: '',
  disabled: false,
  placeholder: '',
  persistentHint: false,
  variant: 'outlined',
  id: '',
  spellcheck: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ── Refs ─────────────────────────────────────────────────────────────────────
const textareaRef = ref<HTMLTextAreaElement>()
const highlighterRef = ref<HTMLDivElement>()
const autocompleteMenuRef = ref<HTMLDivElement>()
const autocompleteOpen = ref(false)
const autocompletePos = ref<{ top: number; left: number } | null>(null)
const selectedSuggestionIndex = ref(-1)
const suggestions = ref<SuggestionItem[]>([])
const isFocused = ref(false)

const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'])

// v-field needs active+focused to float the label properly
const isActive = computed(() => isFocused.value || props.modelValue.length > 0)

// ── Scroll sync ───────────────────────────────────────────────────────────────
const syncScroll = (): void => {
  if (!textareaRef.value || !highlighterRef.value) return
  highlighterRef.value.scrollTop = textareaRef.value.scrollTop
  highlighterRef.value.scrollLeft = textareaRef.value.scrollLeft
}

// ── Highlighter ───────────────────────────────────────────────────────────────
const escapeHtml = (raw: string): string =>
  raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Token-by-token syntax highlighter.
 * - Field tags: ANY [A-Za-z]{2,5}= pattern — case-insensitive, documented or not.
 * - Reserved words: AND / OR / NOT / NEAR / SAME (only when followed by whitespace or `(`).
 * - Both are suppressed inside quoted strings.
 */
const highlightedHTML = computed((): string => {
  const text = props.modelValue
  if (!text) return ''

  let html = ''
  let i = 0
  let inQuotes = false
  let quoteChar = ''

  while (i < text.length) {
    const ch = text[i]

    // Track quote context
    if ((ch === '"' || ch === "'") && (i === 0 || text[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true
        quoteChar = ch
      } else if (quoteChar === ch) {
        inQuotes = false
      }
      html += escapeHtml(ch)
      i++
      continue
    }

    if (!inQuotes) {
      // Field tag: 2-5 letters (any case) followed by =
      // Highlight regardless of whether the tag is in the documented list
      const tagMatch = text.substring(i).match(/^([A-Za-z]{2,5})=/)
      if (tagMatch) {
        html += `<span class="wos-tag">${escapeHtml(tagMatch[1])}</span><span class="wos-eq">=</span>`
        i += tagMatch[1].length + 1
        continue
      }

      // Reserved / boolean word – only when followed by whitespace or `(` (avoid partial matches)
      const wordMatch = text.substring(i).match(/^([A-Za-z]+)(?=[\s()])/)
      if (wordMatch && reservedWordSet.has(wordMatch[1].toUpperCase())) {
        html += `<span class="wos-kw">${escapeHtml(wordMatch[1])}</span>`
        i += wordMatch[1].length
        continue
      }
    }

    html += ch === '\n' ? '\n' : escapeHtml(ch)
    i++
  }

  return html
})

// ── Input handling ────────────────────────────────────────────────────────────
const handleInput = (event: Event): void => {
  const el = event.target as HTMLTextAreaElement
  emit('update:modelValue', el.value)
  updateAutocomplete(el.value, el.selectionStart ?? el.value.length)
  syncScroll()
}

const snapMenuPosition = (): { top: number; left: number } | null => {
  if (!textareaRef.value) return null
  const r = textareaRef.value.getBoundingClientRect()
  return { top: Math.round(r.bottom + 4), left: Math.round(r.left) }
}

/**
 * Context-aware autocomplete:
 * - After a closing `)` (end of a field value) → suggest boolean operators.
 * - Otherwise → suggest documented field tags.
 * Triggers on 1+ letter prefix (even single char); respects quote context.
 */
const updateAutocomplete = (text: string, cursorPos: number): void => {
  if (isInsideQuotes(text, cursorPos)) {
    autocompleteOpen.value = false
    return
  }

  const before = text.substring(0, cursorPos)
  const lastLine = before.split('\n').pop() ?? ''
  const lastWord = lastLine.split(/[\s()]+/).pop() ?? ''

  // If lastWord doesn't match [A-Za-z]{1,5}, close menu
  if (!/^[A-Za-z]{1,5}$/.test(lastWord)) {
    autocompleteOpen.value = false
    return
  }

  const upper = lastWord.toUpperCase()

  // Determine context: what's the last non-space/non-paren character before the current partial word?
  const beforePartial = lastLine.substring(0, lastLine.length - lastWord.length).trimEnd()
  const afterClosingParen = beforePartial.endsWith(')')

  if (afterClosingParen) {
    // We're right after a field value ) — suggest boolean operators
    const boolMatches = BOOL_ITEMS.filter((b) => b.code.startsWith(upper))
    if (boolMatches.length > 0) {
      suggestions.value = boolMatches
      selectedSuggestionIndex.value = -1
      autocompletePos.value = snapMenuPosition()
      autocompleteOpen.value = true
      return
    }
  }

  // Default: suggest documented field tags
  const found = getFieldTagSuggestions(text, cursorPos)
  if (found.length > 0) {
    suggestions.value = found.map((t: FieldTag): SuggestionItem => ({ ...t, kind: 'tag' }))
    selectedSuggestionIndex.value = -1
    autocompletePos.value = snapMenuPosition()
    autocompleteOpen.value = true
    return
  }

  autocompleteOpen.value = false
}

// ── Keyboard navigation ───────────────────────────────────────────────────────
const handleKeydown = (event: KeyboardEvent): void => {
  // Handle autocomplete navigation only when menu is open
  if (autocompleteOpen.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      event.stopPropagation()
      selectedSuggestionIndex.value =
        selectedSuggestionIndex.value < 0
          ? 0
          : Math.min(selectedSuggestionIndex.value + 1, suggestions.value.length - 1)
      scrollSuggestionIntoView()
      return
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      event.stopPropagation()
      selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, 0)
      scrollSuggestionIntoView()
      return
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      event.stopPropagation()
      const selectedIndex =
        selectedSuggestionIndex.value >= 0
          ? selectedSuggestionIndex.value
          : suggestions.value.length > 0
            ? 0
            : -1
      const selected = selectedIndex >= 0 ? suggestions.value[selectedIndex] : undefined
      if (selected) {
        commitSuggestion(selected)
      }
      return
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      autocompleteOpen.value = false
      return
    }
  }
}

const handleKeyup = (event: KeyboardEvent): void => {
  if (NAVIGATION_KEYS.has(event.key)) {
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.preventDefault()
    }
    return
  }
  const el = textareaRef.value
  if (!el) return
  updateAutocomplete(el.value, el.selectionStart ?? el.value.length)
}

const handleCursorMove = (): void => {
  const el = textareaRef.value
  if (!el) return
  updateAutocomplete(el.value, el.selectionStart ?? el.value.length)
}

// ── Suggestion commit ─────────────────────────────────────────────────────────
const commitSuggestion = (item: SuggestionItem): void => {
  const el = textareaRef.value
  if (!el || !item) return

  const cursorPos = el.selectionStart ?? el.value.length
  const liveText = el.value
  const before = liveText.substring(0, cursorPos)
  const lastWord = (before.split('\n').pop() ?? '').split(/[\s()]+/).pop() ?? ''
  const beforeWord = before.substring(0, before.length - lastWord.length)
  const after = liveText.substring(cursorPos)

  // Field tags: insert CODE=   Boolean operators: insert CODE  (trailing space)
  const inserted = item.kind === 'tag' ? `${item.code}=` : `${item.code} `
  emit('update:modelValue', beforeWord + inserted + after)

  nextTick(() => {
    if (!textareaRef.value) return
    const newPos = beforeWord.length + inserted.length
    textareaRef.value.setSelectionRange(newPos, newPos)
    textareaRef.value.focus()
    autocompleteOpen.value = false
  })
}

const scrollSuggestionIntoView = (): void => {
  const menu = autocompleteMenuRef.value
  if (!menu) return
  const items = menu.querySelectorAll('.wos-ac-item')
  ;(items[selectedSuggestionIndex.value] as HTMLElement | undefined)?.scrollIntoView({
    block: 'nearest'
  })
}

// ── Focus / blur ──────────────────────────────────────────────────────────────
const onFocus = (): void => {
  isFocused.value = true
}

const onBlur = (): void => {
  isFocused.value = false
  setTimeout(() => {
    autocompleteOpen.value = false
  }, 200)
}

watch(
  () => props.modelValue,
  () => nextTick(syncScroll)
)
</script>

<template>
  <div class="wos-query-input">
    <v-field
      :label="label"
      :disabled="disabled"
      :variant="variant"
      :active="isActive"
      :focused="isFocused"
      class="wos-field"
    >
      <template #default>
        <div class="wos-inner">
          <div
            ref="highlighterRef"
            class="wos-hl"
            aria-hidden="true"
            v-html="highlightedHTML"
          />
          <textarea
            :id="id"
            ref="textareaRef"
            :value="modelValue"
            :disabled="disabled"
            :placeholder="placeholder"
            :spellcheck="spellcheck"
            autocorrect="off"
            autocapitalize="off"
            autocomplete="off"
            class="wos-ta"
            @input="handleInput"
            @scroll="syncScroll"
            @keydown="handleKeydown"
            @keyup="handleKeyup"
            @click="handleCursorMove"
            @focus="onFocus"
            @blur="onBlur"
          />
        </div>
      </template>
    </v-field>

    <div
      v-if="hint || $slots.message"
      class="wos-details"
    >
      <slot name="message">
        <span class="wos-hint">{{ hint }}</span>
      </slot>
    </div>

    <Teleport to="body">
      <div
        v-if="autocompleteOpen && autocompletePos"
        ref="autocompleteMenuRef"
        class="wos-ac-menu"
        :style="{ top: `${autocompletePos.top}px`, left: `${autocompletePos.left}px` }"
      >
        <div
          v-for="(item, index) in suggestions"
          :key="item.code"
          class="wos-ac-item"
          :class="[{ active: index === selectedSuggestionIndex }, `wos-ac-${item.kind}`]"
          @mousedown.prevent="commitSuggestion(item)"
        >
          <!-- Field tags show CODE=, boolean operators show just CODE -->
          <span class="wos-ac-code">{{ item.code }}{{ item.kind === 'tag' ? '=' : '' }}</span>
          <span class="wos-ac-info">
            <span class="wos-ac-label">{{ item.label }}</span>
            <span class="wos-ac-desc">{{ item.description }}</span>
          </span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.wos-query-input {
  width: 100%;
}

.wos-field {
  width: 100%;
}

/* ── Stacking container ───────────────────────────────────────────────────── */
.wos-inner {
  position: relative;
  width: 100%;
  min-height: 120px;
  /* FIX 1: slightly larger font */
  font-family: 'Courier New', Courier, monospace;
  font-size: 1rem;
  line-height: 1.6;
}

/* ── Highlight overlay ────────────────────────────────────────────────────── */
.wos-hl {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  /* FIX 2: padding so text does not touch the border */
  padding: 10px 14px;
  pointer-events: none;
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: rgb(var(--v-theme-on-surface));
}

/* :deep() required — Vue scoped CSS does not reach v-html content */
.wos-hl :deep(.wos-tag) {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.wos-hl :deep(.wos-eq) {
  color: rgb(var(--v-theme-primary));
  opacity: 0.7;
  font-weight: 700;
}

.wos-hl :deep(.wos-kw) {
  color: rgb(var(--v-theme-warning));
  font-weight: 700;
}

/* ── Transparent textarea (caret visible, text invisible) ─────────────────── */
.wos-ta {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  padding: 10px 14px;
  width: 100%;
  height: 100%;
  margin: 0;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: transparent;
  caret-color: rgb(var(--v-theme-on-surface));
  /* Match monospace settings for character alignment */
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  letter-spacing: 0;
  font-feature-settings: 'zero' on;
  overflow: auto;
}

/* ── Hint / message area ─────────────────────────────────���───────────────── */
.wos-details {
  padding: 4px 16px 0;
  font-size: 0.75rem;
  min-height: 20px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* ── Autocomplete dropdown ───────────────────────────────────────────────── */
.wos-ac-menu {
  position: fixed;
  z-index: 2400;
  min-width: 340px;
  max-height: 300px;
  overflow-y: auto;
  border-radius: 6px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.07),
    0 8px 24px rgba(0, 0, 0, 0.18);
}

.wos-ac-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 14px;
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  transition: background 100ms;
}

.wos-ac-item:last-child {
  border-bottom: none;
}

.wos-ac-item:hover,
.wos-ac-item.active {
  background: rgba(var(--v-theme-primary), 0.1);
}

/* Field tag code label – primary (purple) */
.wos-ac-code {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
  min-width: 60px;
}

/* FIX 3: boolean operator code label – warning (orange) to match inline highlight */
.wos-ac-item.wos-ac-bool .wos-ac-code {
  color: rgb(var(--v-theme-warning));
  min-width: 52px;
}

.wos-ac-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.wos-ac-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.wos-ac-desc {
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
