<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { WOS_FIELD_TAGS, isInsideQuotes, WOS_RESERVED_WORDS } from '@/renderer/utils/wosFieldTags'

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
  kind: 'tag' | 'bool' | 'group'
  insertText?: string
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
    code: 'SAME',
    label: 'SAME',
    description:
      'Terms in the same address sub-field — use inside AD= searches (e.g. AD=(MIT SAME Cambridge))',
    kind: 'bool'
  },
  {
    code: 'NEAR',
    label: 'NEAR',
    description: 'Terms within 15 words of each other (default — equivalent to NEAR/15)',
    kind: 'bool'
  },
  {
    code: 'NEAR/',
    label: 'NEAR/x',
    description:
      'Terms within x words of each other — replace x with a number (e.g. NEAR/3). NEAR without /x defaults to 15.',
    kind: 'bool',
    insertText: 'NEAR/'
  }
]

const CLAUSE_BOOL_ITEMS: SuggestionItem[] = BOOL_ITEMS.filter(
  (item) => item.code === 'AND' || item.code === 'OR'
)

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

const { t } = useI18n()

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
const showFieldTagFilterHint = computed(() => suggestions.value.some((item) => item.kind === 'tag'))

// v-field needs active+focused to float the label properly
const isActive = computed(() => isFocused.value || props.modelValue.length > 0)

// ── Scroll sync ───────────────────────────────────────────────────────────────
// The container height is driven entirely by the highlight overlay (which lives
// in normal flow and grows with the wrapped query text). The textarea is laid
// over it, so both layers always share the same height and no manual height
// measurement is required — this works identically whether the query is typed
// or loaded from a saved config.
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
 * - Field tags: ANY [A-Za-z]{2,5}[ \t]*= pattern — case-insensitive, documented or not.
 * - Reserved words: AND / OR / NOT / NEAR / SAME (only as standalone tokens with
 *   left+right boundaries so values like astronomyOR are not highlighted).
 * - Proximity operator: NEAR/x or NEAR/ — matched before the generic reserved-word check.
 *   Plain NEAR (equivalent to NEAR/15 per WOS docs) is handled by the reserved-word path.
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
      const prev = i > 0 ? text[i - 1] : ''
      const hasLeftTokenBoundary = i === 0 || /[\s()]/.test(prev)

      // Field tag: 2-5 letters (any case) with optional spaces before =
      // Highlight regardless of whether the tag is in the documented list
      const tagMatch = hasLeftTokenBoundary
        ? text.substring(i).match(/^([A-Za-z]{2,5})([ \t]*)=/)
        : null
      if (tagMatch) {
        const tagCode = tagMatch[1]
        const eqPadding = tagMatch[2] ?? ''
        html += `<span class="wos-tag">${escapeHtml(tagCode)}</span>${escapeHtml(eqPadding)}<span class="wos-eq">=</span>`
        i += tagCode.length + eqPadding.length + 1
        continue
      }

      // Proximity operator form: NEAR/x or NEAR/ — highlight as reserved keyword.
      // Plain NEAR (without /x) falls through to the wordMatch path below and is
      // highlighted because NEAR is in reservedWordSet.  Both paths accept end-of-
      // string so the operator is highlighted even when it is the last token.
      const nearMatch = hasLeftTokenBoundary
        ? text.substring(i).match(/^(NEAR\/[A-Za-z0-9]+|NEAR\/)(?=[\s()]|$)/i)
        : null
      if (nearMatch) {
        html += `<span class="wos-kw">${escapeHtml(nearMatch[1])}</span>`
        i += nearMatch[1].length
        continue
      }

      // Reserved / boolean word – only when followed by whitespace, `(`, `)`, or
      // end-of-string (avoid partial matches inside longer identifiers).
      const wordMatch = hasLeftTokenBoundary
        ? text.substring(i).match(/^([A-Za-z]+)(?=[\s()]|$)/)
        : null
      if (wordMatch && reservedWordSet.has(wordMatch[1].toUpperCase())) {
        html += `<span class="wos-kw">${escapeHtml(wordMatch[1])}</span>`
        i += wordMatch[1].length
        continue
      }
    }

    html += ch === '\n' ? '\n' : escapeHtml(ch)
    i++
  }

  // Append a guard newline so a trailing line break still occupies vertical
  // space in the overlay. Because the overlay drives the container height, this
  // keeps the textarea tall enough to show the final empty line.
  return text.endsWith('\n') ? `${html}\n` : html
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

type ContextKind = 'fieldTag' | 'inValueBool' | 'clauseBool' | 'groupOrFieldTag'

const getWordBounds = (
  text: string,
  cursorPos: number
): { start: number; end: number; word: string } => {
  const isWordChar = (ch: string): boolean => /[A-Za-z/]/.test(ch)
  let start = cursorPos
  while (start > 0 && isWordChar(text[start - 1])) start--
  let end = cursorPos
  while (end < text.length && isWordChar(text[end])) end++
  return { start, end, word: text.substring(start, end) }
}

const parseContext = (
  text: string,
  cursorPos: number
): {
  before: string
  currentPrefix: string
  previousWordUpper: string
  insideFieldValue: boolean
  hasValueInCurrentField: boolean
  endsWithClosingParen: boolean
  endsWithOpeningParen: boolean
  clauseLooksComplete: boolean
  openGroupDepth: number
} => {
  const before = text.substring(0, cursorPos)
  const bounds = getWordBounds(text, cursorPos)
  const currentPrefix = before.substring(bounds.start, cursorPos)
  const beforePrefix = before.substring(0, bounds.start)
  const beforePrefixTrimmed = beforePrefix.trimEnd()
  const previousWordUpper = (beforePrefixTrimmed.split(/[\s()]+/).pop() ?? '').toUpperCase()
  const endsWithClosingParen = beforePrefixTrimmed.endsWith(')')
  const endsWithOpeningParen = beforePrefixTrimmed.endsWith('(')

  const stack: Array<{ kind: 'field' | 'group'; pos: number }> = []
  let inQuotes = false
  let quoteChar = ''

  for (let i = 0; i < before.length; i++) {
    const ch = before[i]
    if ((ch === '"' || ch === "'") && (i === 0 || before[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true
        quoteChar = ch
      } else if (quoteChar === ch) {
        inQuotes = false
      }
      continue
    }
    if (inQuotes) continue

    const tagMatch = before.substring(i).match(/^([A-Za-z]{2,5})=\(/)
    if (tagMatch) {
      stack.push({ kind: 'field', pos: i + tagMatch[1].length + 1 })
      i += tagMatch[0].length - 1
      continue
    }

    if (ch === '(') {
      stack.push({ kind: 'group', pos: i })
      continue
    }

    if (ch === ')' && stack.length > 0) {
      stack.pop()
    }
  }

  const lastField = [...stack].reverse().find((entry) => entry.kind === 'field')
  const insideFieldValue = Boolean(lastField)
  const hasValueInCurrentField =
    Boolean(lastField) && before.substring((lastField?.pos ?? 0) + 1).trim().length > 0

  const beforeTrimmed = beforePrefixTrimmed
  const clauseLooksComplete =
    endsWithClosingParen ||
    /=\s*[^\s()]+$/.test(beforeTrimmed) ||
    /=\s*"[^"]*"$/.test(beforeTrimmed) ||
    /=\s*'[^']*'$/.test(beforeTrimmed)
  const openGroupDepth = stack.filter((entry) => entry.kind === 'group').length

  return {
    before,
    currentPrefix,
    previousWordUpper,
    insideFieldValue,
    hasValueInCurrentField,
    endsWithClosingParen,
    endsWithOpeningParen,
    clauseLooksComplete,
    openGroupDepth
  }
}

const toTagSuggestions = (prefix: string): SuggestionItem[] => {
  const upperPrefix = prefix.toUpperCase()
  const filtered =
    upperPrefix.length === 0
      ? WOS_FIELD_TAGS
      : WOS_FIELD_TAGS.filter(
          (tag) =>
            tag.code.startsWith(upperPrefix) || tag.label.toUpperCase().startsWith(upperPrefix)
        )
  return filtered.map((tag) => ({ ...tag, kind: 'tag' as const }))
}

const toBoolSuggestions = (source: SuggestionItem[], prefix: string): SuggestionItem[] => {
  const upperPrefix = prefix.toUpperCase()
  return source.filter((item) => item.code.startsWith(upperPrefix))
}

const getContextKind = (ctx: ReturnType<typeof parseContext>): ContextKind => {
  if (ctx.endsWithOpeningParen) return 'fieldTag'
  if (ctx.insideFieldValue && ctx.hasValueInCurrentField) return 'inValueBool'
  if (ctx.endsWithClosingParen || ctx.clauseLooksComplete) return 'clauseBool'
  if (ctx.previousWordUpper === 'AND' || ctx.previousWordUpper === 'OR') return 'groupOrFieldTag'
  return 'fieldTag'
}

const setSuggestions = (items: SuggestionItem[]): void => {
  suggestions.value = items
  selectedSuggestionIndex.value = -1
  autocompletePos.value = snapMenuPosition()
  autocompleteOpen.value = items.length > 0
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

  const ctx = parseContext(text, cursorPos)
  if (!/^[A-Za-z/]*$/.test(ctx.currentPrefix)) {
    autocompleteOpen.value = false
    return
  }

  const contextKind = getContextKind(ctx)
  if (contextKind === 'fieldTag') {
    setSuggestions(toTagSuggestions(ctx.currentPrefix))
    return
  }

  if (contextKind === 'inValueBool') {
    setSuggestions(toBoolSuggestions(BOOL_ITEMS, ctx.currentPrefix))
    return
  }

  if (contextKind === 'clauseBool') {
    const closeGroupItem: SuggestionItem = {
      code: ')',
      label: 'Close Group',
      description: 'Close the current grouped expression',
      kind: 'group',
      insertText: ')'
    }
    setSuggestions([
      ...toBoolSuggestions(CLAUSE_BOOL_ITEMS, ctx.currentPrefix),
      ...(ctx.openGroupDepth > 0 &&
      (ctx.currentPrefix.length === 0 || ')'.startsWith(ctx.currentPrefix))
        ? [closeGroupItem]
        : [])
    ])
    return
  }

  const groupItem: SuggestionItem = {
    code: '(',
    label: 'Open Group',
    description: 'Start a grouped expression',
    kind: 'group',
    insertText: '('
  }
  setSuggestions([
    ...(ctx.currentPrefix.length === 0 || '('.startsWith(ctx.currentPrefix) ? [groupItem] : []),
    ...toTagSuggestions(ctx.currentPrefix)
  ])
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
  const bounds = getWordBounds(liveText, cursorPos)
  const beforeWord = liveText.substring(0, bounds.start)
  const afterWord = liveText.substring(bounds.end)

  // Field tags: CODE=, booleans/group: custom insertText with trailing space when needed.
  const inserted =
    item.kind === 'tag'
      ? `${item.code}=`
      : item.insertText
        ? `${item.insertText} `
        : `${item.code} `
  emit('update:modelValue', beforeWord + inserted + afterWord)

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
  const el = textareaRef.value
  if (!el) return
  updateAutocomplete(el.value, el.selectionStart ?? el.value.length)
}

const onBlur = (): void => {
  isFocused.value = false
  setTimeout(() => {
    autocompleteOpen.value = false
  }, 200)
}
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
          v-if="showFieldTagFilterHint"
          class="wos-ac-helper"
        >
          {{ t('query.wos.autocomplete-start-typing') }}
        </div>
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
  /* Use the same text metrics for both layers to keep caret and overlay aligned. */
  font-family: 'Courier New', Courier, monospace;
  font-size: 1rem;
  line-height: 1.6;
}

.wos-hl,
.wos-ta {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  letter-spacing: 0;
  font-feature-settings: 'zero' on;
  font-variant-ligatures: none;
  tab-size: 2;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
}

/* ── Highlight overlay (drives container height) ──────────────────────────── */
.wos-hl {
  position: relative;
  box-sizing: border-box;
  min-height: 120px;
  padding: 10px 14px;
  pointer-events: none;
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface));
}

/* :deep() required — Vue scoped CSS does not reach v-html content */
.wos-hl :deep(.wos-tag) {
  color: rgb(var(--v-theme-primary));
  /* Faux-bold keeps text metrics stable while restoring emphasis. */
  text-shadow:
    0 0 0 currentColor,
    1px 0 0 currentColor;
}

.wos-hl :deep(.wos-eq) {
  color: rgb(var(--v-theme-primary));
  opacity: 0.7;
}

.wos-hl :deep(.wos-kw) {
  color: rgb(var(--v-theme-warning));
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
  overflow: hidden;
  scrollbar-width: none; /* Firefox – no layout space for scrollbar */
}

/* Hide Chromium/Electron scrollbar – keep scroll functionality but remove width footprint */
.wos-ta::-webkit-scrollbar {
  display: none;
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

.wos-ac-helper {
  padding: 8px 14px;
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
