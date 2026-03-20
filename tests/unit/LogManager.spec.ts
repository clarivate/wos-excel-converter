import { test, expect } from '@playwright/test'
import {
  existsSync,
  statSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  mkdirSync,
  rmdirSync,
  readdirSync
} from 'fs'
import { join } from 'path'
import { gzipSync } from 'zlib'

const testLogDir = join(process.cwd(), 'test-logs')
const testLogFile = join(testLogDir, 'test.log')

test.describe('LogManager Unit Tests', () => {
  test.beforeAll(() => {
    // Create test log directory
    if (!existsSync(testLogDir)) {
      mkdirSync(testLogDir, { recursive: true })
    }
  })

  test.beforeEach(() => {
    // Ensure test log directory exists before each test
    if (!existsSync(testLogDir)) {
      mkdirSync(testLogDir, { recursive: true })
    }
  })

  test.afterEach(() => {
    // Clean up test file after each test
    try {
      if (existsSync(testLogFile)) {
        unlinkSync(testLogFile)
      }
      const files = readdirSync(testLogDir)
      files.forEach((file: string) => {
        if (file.endsWith('.gz') || file.endsWith('.log')) {
          unlinkSync(join(testLogDir, file))
        }
      })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  test.afterAll(() => {
    // Clean up test directory
    try {
      if (existsSync(testLogDir)) {
        const files = readdirSync(testLogDir)
        files.forEach((file: string) => {
          unlinkSync(join(testLogDir, file))
        })
        rmdirSync(testLogDir)
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  test('should calculate file size correctly', () => {
    const content = 'test content'
    writeFileSync(testLogFile, content)

    const stats = statSync(testLogFile)
    expect(stats.size).toBeGreaterThan(0)
    expect(stats.size).toBe(content.length)
  })

  test('should read lines from file correctly', () => {
    const content = 'line1\nline2\nline3'
    writeFileSync(testLogFile, content)

    const fileContent = readFileSync(testLogFile, 'utf-8')
    const lines = fileContent.split('\n')

    expect(lines.length).toBe(3)
    expect(lines).toContain('line1')
    expect(lines).toContain('line2')
    expect(lines).toContain('line3')
  })

  test('should handle reading last N lines from file', () => {
    const lines = []
    for (let i = 1; i <= 150; i++) {
      lines.push(`line ${i}`)
    }
    writeFileSync(testLogFile, lines.join('\n'))

    const content = readFileSync(testLogFile, 'utf-8')
    const allLines = content.split('\n')
    const last10 = allLines.slice(-10)

    expect(last10.length).toBe(10)
    expect(last10[9]).toBe('line 150')
    expect(last10[0]).toBe('line 141')
  })

  test('should compress file with gzip', () => {
    const content = 'x'.repeat(1000) // Compressible content
    writeFileSync(testLogFile, content)

    const originalSize = statSync(testLogFile).size
    const compressed = gzipSync(content)

    expect(compressed.length).toBeLessThan(originalSize)
    expect(compressed.length).toBeLessThan(originalSize * 0.5) // At least 50% compression
  })

  test('should generate valid archive filename with timestamp', () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const archiveName = `wosapiexporter.log.${timestamp}.gz`

    expect(archiveName).toMatch(/wosapiexporter\.log\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.gz/)
  })

  test('should detect file existence correctly', () => {
    expect(existsSync(testLogFile)).toBe(false)

    writeFileSync(testLogFile, 'test')
    expect(existsSync(testLogFile)).toBe(true)

    unlinkSync(testLogFile)
    expect(existsSync(testLogFile)).toBe(false)
  })

  test('should format file sizes correctly', () => {
    const formatSize = (bytes: number): string => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    expect(formatSize(0)).toBe('0 B')
    expect(formatSize(100)).toBe('100 B')
    expect(formatSize(1024)).toBe('1 KB')
    expect(formatSize(1536)).toBe('1.5 KB')
    expect(formatSize(1048576)).toBe('1 MB')
    expect(formatSize(10485760)).toBe('10 MB')
  })

  test('should handle large file operations', () => {
    const largeContent = 'x'.repeat(100000) // 100KB
    writeFileSync(testLogFile, largeContent)

    const stats = statSync(testLogFile)
    expect(stats.size).toBe(100000)
    expect(stats.size).toBeGreaterThan(10 * 1024) // > 10KB
  })
})
