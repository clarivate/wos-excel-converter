import { test, expect } from '@playwright/test'

/**
 * Pure-logic helpers extracted from ConfigStore so they can be tested
 * without importing the Electron-dependent module.
 */

function getCopyName(chosenName: string, existingNames: string[]): string {
  const baseName = chosenName.replace(/\s+Copy(\d*)$/, '')
  const hasCopy = chosenName !== baseName

  let newName = hasCopy ? baseName + ' Copy1' : chosenName + ' Copy'
  let i = 1
  const names = new Set(existingNames)
  while (names.has(newName)) {
    i++
    newName = hasCopy ? baseName + ' Copy' + i : chosenName + ' Copy' + i
  }
  return newName
}

function getNextAfterDelete(names: string[], currentName: string): string | null {
  if (names.length <= 1) return null // deletion prevented
  const currentIndex = names.indexOf(currentName)
  const remaining = names.filter((n) => n !== currentName)
  const nextIndex = currentIndex < remaining.length ? currentIndex : currentIndex - 1
  return remaining[nextIndex]
}

// ---------------------------------------------------------------------------
// Copy naming tests
// ---------------------------------------------------------------------------

test.describe('ConfigStore – copy naming logic', () => {
  test('plain name gets " Copy" suffix on first copy', () => {
    expect(getCopyName('Default', ['Default'])).toBe('Default Copy')
  })

  test('does not append "Copy Copy" when name already ends with " Copy"', () => {
    expect(getCopyName('Default Copy', ['Default', 'Default Copy'])).toBe('Default Copy1')
  })

  test('increments number when " Copy1" already exists', () => {
    const existing = ['Default', 'Default Copy', 'Default Copy1']
    expect(getCopyName('Default Copy1', existing)).toBe('Default Copy2')
  })

  test('increments to next free number when lower numbers are taken', () => {
    const existing = ['Default', 'Default Copy', 'Default Copy1', 'Default Copy2']
    expect(getCopyName('Default Copy2', existing)).toBe('Default Copy3')
  })

  test('skips to first free number when " Copy" is taken but name has no Copy suffix', () => {
    // "Default" exists and "Default Copy" is already taken – should produce "Default Copy2"
    const existing = ['Default', 'Default Copy']
    expect(getCopyName('Default', existing)).toBe('Default Copy2')
  })

  test('handles multi-word base names correctly', () => {
    expect(getCopyName('My API Config', ['My API Config'])).toBe('My API Config Copy')
  })

  test('copy of multi-word name that already has Copy suffix', () => {
    const existing = ['My API Config', 'My API Config Copy']
    expect(getCopyName('My API Config Copy', existing)).toBe('My API Config Copy1')
  })

  test('name with digits not followed by Copy is treated as plain name', () => {
    // "Config 2" does not end with " Copy…" so it just gets " Copy" appended
    expect(getCopyName('Config 2', ['Config 2'])).toBe('Config 2 Copy')
  })
})

// ---------------------------------------------------------------------------
// Delete index tests
// ---------------------------------------------------------------------------

test.describe('ConfigStore – delete index logic', () => {
  test('returns null (no deletion) when only one config remains', () => {
    expect(getNextAfterDelete(['Default'], 'Default')).toBeNull()
  })

  test('deleting the first item selects the new item at index 0', () => {
    // ["A", "B", "C"] – delete "A" (index 0) → remaining ["B","C"] → index 0 = "B"
    expect(getNextAfterDelete(['A', 'B', 'C'], 'A')).toBe('B')
  })

  test('deleting a middle item selects the item that shifts into the same index', () => {
    // ["A", "B", "C"] – delete "B" (index 1) → remaining ["A","C"] → index 1 = "C"
    expect(getNextAfterDelete(['A', 'B', 'C'], 'B')).toBe('C')
  })

  test('deleting the last item selects index-1', () => {
    // ["A", "B", "C"] – delete "C" (index 2) → remaining ["A","B"] → index 2 >= length(2) → index 1 = "B"
    expect(getNextAfterDelete(['A', 'B', 'C'], 'C')).toBe('B')
  })

  test('deleting the last item of two selects the other', () => {
    expect(getNextAfterDelete(['Default', 'Copy'], 'Copy')).toBe('Default')
  })

  test('deleting the first item of two selects the other', () => {
    expect(getNextAfterDelete(['Default', 'Copy'], 'Default')).toBe('Copy')
  })

  test('deleting last of four selects the new last', () => {
    expect(getNextAfterDelete(['A', 'B', 'C', 'D'], 'D')).toBe('C')
  })

  test('deleting second-to-last of four selects same index (which is now the last)', () => {
    // ["A","B","C","D"] – delete "C" (index 2) → remaining ["A","B","D"] → index 2 = "D"
    expect(getNextAfterDelete(['A', 'B', 'C', 'D'], 'C')).toBe('D')
  })
})
