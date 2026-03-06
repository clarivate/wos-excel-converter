import {
  statSync,
  readFileSync,
  existsSync,
  writeFileSync,
  openSync,
  closeSync,
  readSync
} from 'fs'
import { gzipSync } from 'zlib'
import log from 'electron-log/main'
import Constants from './Constants'
import { join, dirname } from 'path'

/**
 * Log Management Configuration
 */
export const LOG_CONFIG = {
  LOG_FILE_NAME: 'wosapiexporter.log',
  LOG_DIR: dirname(Constants.LOG_FILE_PATH),
  LOG_FILE_PATH: Constants.LOG_FILE_PATH,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_LINES_TO_READ: 100
}

/**
 * LogManager: Handles log file operations including archiving and compression
 */
export class LogManager {
  /**
   * Check if log file size exceeds the limit and archive it
   */
  static checkAndArchiveLogFile(): void {
    try {
      if (!existsSync(LOG_CONFIG.LOG_FILE_PATH)) {
        return
      }

      const stats = statSync(LOG_CONFIG.LOG_FILE_PATH)
      if (stats.size > LOG_CONFIG.MAX_FILE_SIZE) {
        this.archiveLogFile()
      }
    } catch (error) {
      log.error('Error checking log file size:', error)
    }
  }

  /**
   * Archive the current log file with gzip compression
   */
  static archiveLogFile(): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const archivedFileName = `wosapiexporter.log.${timestamp}.gz`
      const archivedFilePath = join(LOG_CONFIG.LOG_DIR, archivedFileName)

      // Read the current log file
      const logContent = readFileSync(LOG_CONFIG.LOG_FILE_PATH, 'utf-8')

      // Compress and write to archive
      const compressed = gzipSync(logContent)
      writeFileSync(archivedFilePath, compressed)

      log.info(`Archived log file to ${archivedFileName}`)

      // Clear the current log file (keep it but empty)
      writeFileSync(LOG_CONFIG.LOG_FILE_PATH, '')

      log.info('Current log file cleared')
    } catch (error) {
      log.error('Error archiving log file:', error)
    }
  }

  /**
   * Read the last N lines from the log file safely
   * Returns empty string if file is too large to read
   */
  static readLastLines(lines: number = LOG_CONFIG.MAX_LINES_TO_READ): string {
    try {
      if (!existsSync(LOG_CONFIG.LOG_FILE_PATH)) {
        return ''
      }

      const stats = statSync(LOG_CONFIG.LOG_FILE_PATH)

      // If file is larger than 50MB, don't read the whole file, read from the end
      const MAX_READ_SIZE = 50 * 1024 * 1024 // 50 MB
      if (stats.size > MAX_READ_SIZE) {
        log.warn(`Log file is too large (${stats.size} bytes). Reading last chunk only.`)
        return this.readLastLinesFromEnd(lines)
      }

      // Read the entire file
      const content = readFileSync(LOG_CONFIG.LOG_FILE_PATH, 'utf-8')
      const allLines = content.split('\n')
      const lastLines = allLines.slice(-lines).join('\n')
      return lastLines
    } catch (error) {
      log.error('Failed to read log file:', error)
      return ''
    }
  }

  /**
   * Read the last N lines from the end of a large file
   * Uses a buffer-based approach to avoid loading the entire file
   */
  private static readLastLinesFromEnd(lines: number): string {
    try {
      const stats = statSync(LOG_CONFIG.LOG_FILE_PATH)
      const fd = openSync(LOG_CONFIG.LOG_FILE_PATH, 'r')

      // Start with a 1MB buffer, expand if needed
      const bufferSize = Math.min(1024 * 1024, stats.size)
      const buffer = Buffer.alloc(bufferSize)

      let position = stats.size
      let lineCount = 0
      const chunks: string[] = []

      // Read from the end of the file backwards
      while (position > 0 && lineCount < lines) {
        const readSize = Math.min(bufferSize, position)
        position -= readSize

        readSync(fd, buffer, 0, readSize, position)
        const chunk = buffer.toString('utf-8', 0, readSize)
        chunks.unshift(chunk)

        // Count newlines to know when we have enough
        lineCount += (chunk.match(/\n/g) || []).length
      }

      closeSync(fd)

      const content = chunks.join('')
      const allLines = content.split('\n')
      return allLines.slice(-lines - 1).join('\n')
    } catch (error) {
      log.error('Failed to read last lines from end of file:', error)
      return ''
    }
  }

  /**
   * Get the size of the log file in human-readable format
   */
  static getLogFileSize(): string {
    try {
      if (!existsSync(LOG_CONFIG.LOG_FILE_PATH)) {
        return '0 B'
      }

      const stats = statSync(LOG_CONFIG.LOG_FILE_PATH)
      const bytes = stats.size

      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    } catch (error) {
      log.error('Error getting log file size:', error)
      return 'Unknown'
    }
  }
}
