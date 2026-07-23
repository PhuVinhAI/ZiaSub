/**
 * Logger Service - Handles debug logging to .txt files in debug/ subfolder
 * Logs are written to <backup_path>/debug/debug_YYYY-MM-DD.txt when debug setting is enabled.
 */
import * as FileSystem from "expo-file-system/legacy";
import { storageService } from "./storageService";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogFileInfo {
  name: string;
  path: string;
  size: number;
  modificationTime?: number;
}

class LoggerService {
  private static instance: LoggerService;
  private enabled: boolean = false;
  private logBuffer: string[] = [];
  private isWriting: boolean = false;
  private writeTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Initialize LoggerService with current debug settings
   */
  async initialize(): Promise<void> {
    try {
      const settings = storageService.getSettings();
      this.enabled = !!settings?.debug?.enabled;
      if (this.enabled) {
        this.info("LoggerService", "LoggerService initialized. Debug logging is ENABLED.");
      }
    } catch (error) {
      console.error("[LoggerService] Initialization error:", error);
    }
  }

  /**
   * Enable or disable debug logging
   */
  setDebugEnabled(enabled: boolean): void {
    const wasEnabled = this.enabled;
    this.enabled = enabled;
    if (enabled && !wasEnabled) {
      console.log("[LoggerService] Debug logging turned ON.");
    } else if (!enabled && wasEnabled) {
      console.log("[LoggerService] Debug logging turned OFF.");
    }
  }

  /**
   * Check if debug logging is enabled
   */
  isDebugEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Log a message with level DEBUG
   */
  debug(tag: string, message: string, data?: any): void {
    this.log("DEBUG", tag, message, data);
  }

  /**
   * Log a message with level INFO
   */
  info(tag: string, message: string, data?: any): void {
    this.log("INFO", tag, message, data);
  }

  /**
   * Log a message with level WARN
   */
  warn(tag: string, message: string, data?: any): void {
    this.log("WARN", tag, message, data);
  }

  /**
   * Log a message with level ERROR
   */
  error(tag: string, message: string, error?: any): void {
    let errorDetails = dataToString(error);
    if (error instanceof Error && error.stack) {
      errorDetails += `\nStack: ${error.stack}`;
    }
    this.log("ERROR", tag, message, errorDetails);
  }

  /**
   * Main log method
   */
  log(level: LogLevel, tag: string, message: string, data?: any): void {
    // Always print to console in dev mode
    const consoleMsg = `[${level}] [${tag}] ${message}`;
    if (level === "ERROR") {
      console.error(consoleMsg, data !== undefined ? data : "");
    } else if (level === "WARN") {
      console.warn(consoleMsg, data !== undefined ? data : "");
    } else {
      console.log(consoleMsg, data !== undefined ? data : "");
    }

    if (!this.enabled) return;

    const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "");
    const formattedData = data !== undefined ? ` | ${dataToString(data)}` : "";
    const logLine = `[${timestamp}] [${level}] [${tag}] ${message}${formattedData}\n`;

    this.logBuffer.push(logLine);
    this.scheduleFlush();
  }

  /**
   * Schedule buffered logs flush to file
   */
  private scheduleFlush(): void {
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.flushLogs();
    }, 500);
  }

  /**
   * Flush pending logs to file
   */
  async flushLogs(): Promise<void> {
    if (this.isWriting || this.logBuffer.length === 0) return;

    this.isWriting = true;
    const logsToWrite = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const content = logsToWrite.join("");
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `debug_${dateStr}.txt`;

      const basePath = (await storageService.getBackupPath()) || `${FileSystem.documentDirectory}ziasub_backup`;

      if (basePath.startsWith("content://")) {
        await this.appendLogSaf(basePath, filename, content);
      } else {
        await this.appendLogLocal(basePath, filename, content);
      }
    } catch (err) {
      console.error("[LoggerService] Failed to flush logs to disk:", err);
    } finally {
      this.isWriting = false;
      if (this.logBuffer.length > 0) {
        this.scheduleFlush();
      }
    }
  }

  /**
   * Append log to local file system (<basePath>/debug/<filename>)
   */
  private async appendLogLocal(basePath: string, filename: string, content: string): Promise<void> {
    const debugDir = `${basePath}/debug`;
    const dirInfo = await FileSystem.getInfoAsync(debugDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(debugDir, { intermediates: true });
    }

    const filePath = `${debugDir}/${filename}`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);

    if (fileInfo.exists) {
      const existing = await FileSystem.readAsStringAsync(filePath);
      await FileSystem.writeAsStringAsync(filePath, existing + content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } else {
      await FileSystem.writeAsStringAsync(filePath, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
  }

  /**
   * Extract just the filename from a SAF URI.
   * SAF URIs encode the full path in the last segment:
   *   .../document/primary%3ADownload%2FZiaSub%2Fdebug_2024-07-23.txt
   * decodeURIComponent gives "primary:Download/ZiaSub/debug_2024-07-23.txt"
   * We need to split by "/" again to get just "debug_2024-07-23.txt".
   */
  private getSafFileName(fileUri: string): string {
    const fullPath = decodeURIComponent(fileUri.split("/").pop() || "");
    return fullPath.split("/").pop() || "";
  }

  /**
   * Append log to SAF directory URI.
   * SAF does not support subdirectories, so log files are stored in the
   * root with a debug_ prefix (debug_YYYY-MM-DD.txt).
   */
  private async appendLogSaf(directoryUri: string, filename: string, content: string): Promise<void> {
    try {
      const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(directoryUri);

      // Find existing log file by matching just the filename
      let targetFileUri = files.find((f) => {
        return this.getSafFileName(f) === filename;
      });

      if (targetFileUri) {
        const existing = await FileSystem.StorageAccessFramework.readAsStringAsync(targetFileUri);
        await FileSystem.StorageAccessFramework.writeAsStringAsync(targetFileUri, existing + content);
      } else {
        targetFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          directoryUri,
          filename,
          "text/plain"
        );
        await FileSystem.StorageAccessFramework.writeAsStringAsync(targetFileUri, content);
      }
    } catch (err) {
      console.error("[LoggerService] SAF write error:", err);
    }
  }

  /**
   * Get list of debug log files
   */
  async getLogFiles(): Promise<LogFileInfo[]> {
    try {
      const basePath = (await storageService.getBackupPath()) || `${FileSystem.documentDirectory}ziasub_backup`;
      const result: LogFileInfo[] = [];

      if (basePath.startsWith("content://")) {
        // SAF: logs are stored flat in root with debug_ prefix (no subdirectory support)
        const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(basePath);
        for (const fileUri of files) {
          const name = this.getSafFileName(fileUri);
          if (name.startsWith("debug_") && name.endsWith(".txt")) {
            result.push({
              name,
              path: fileUri,
              size: 0,
            });
          }
        }
      } else {
        const debugDir = `${basePath}/debug`;
        const dirInfo = await FileSystem.getInfoAsync(debugDir);
        if (dirInfo.exists && dirInfo.isDirectory) {
          const files = await FileSystem.readDirectoryAsync(debugDir);
          for (const file of files) {
            if (file.endsWith(".txt")) {
              const filePath = `${debugDir}/${file}`;
              const info = await FileSystem.getInfoAsync(filePath);
              result.push({
                name: file,
                path: filePath,
                size: info.exists && !info.isDirectory ? info.size || 0 : 0,
                modificationTime: info.exists && !info.isDirectory ? info.modificationTime : undefined,
              });
            }
          }
        }
      }

      return result.sort((a, b) => b.name.localeCompare(a.name));
    } catch (error) {
      console.error("[LoggerService] Error listing log files:", error);
      return [];
    }
  }

  /**
   * Read contents of a log file by filename or path
   */
  async readLogFile(pathOrFilename: string): Promise<string> {
    try {
      if (pathOrFilename.startsWith("content://")) {
        return await FileSystem.StorageAccessFramework.readAsStringAsync(pathOrFilename);
      }
      if (pathOrFilename.startsWith("file://") || pathOrFilename.startsWith("/")) {
        return await FileSystem.readAsStringAsync(pathOrFilename);
      }
      const basePath = (await storageService.getBackupPath()) || `${FileSystem.documentDirectory}ziasub_backup`;
      // SAF basePath can't have a debug/ subfolder
      if (basePath.startsWith("content://")) {
        const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(basePath);
        const target = files.find((f) => {
          return this.getSafFileName(f) === pathOrFilename;
        });
        if (target) {
          return await FileSystem.StorageAccessFramework.readAsStringAsync(target);
        }
        return `File not found: ${pathOrFilename}`;
      }
      const filePath = `${basePath}/debug/${pathOrFilename}`;
      return await FileSystem.readAsStringAsync(filePath);
    } catch (error) {
      console.error("[LoggerService] Error reading log file:", error);
      return `Error reading log file: ${error}`;
    }
  }

  /**
   * Delete a single log file by path or filename
   */
  async deleteLogFile(pathOrFilename: string): Promise<void> {
    try {
      if (pathOrFilename.startsWith("content://")) {
        await FileSystem.StorageAccessFramework.deleteAsync(pathOrFilename);
      } else if (pathOrFilename.startsWith("file://") || pathOrFilename.startsWith("/")) {
        await FileSystem.deleteAsync(pathOrFilename, { idempotent: true });
      } else {
        const basePath = (await storageService.getBackupPath()) || `${FileSystem.documentDirectory}ziasub_backup`;
        // SAF basePath can't have a debug/ subfolder; local paths use debug/ subfolder
        if (basePath.startsWith("content://")) {
          // For SAF, look up the file URI in the root directory
          const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(basePath);
          const target = files.find((f) => {
            return this.getSafFileName(f) === pathOrFilename;
          });
          if (target) {
            await FileSystem.StorageAccessFramework.deleteAsync(target);
          }
        } else {
          const filePath = `${basePath}/debug/${pathOrFilename}`;
          await FileSystem.deleteAsync(filePath, { idempotent: true });
        }
      }
    } catch (error) {
      console.error("[LoggerService] Error deleting log file:", error);
    }
  }

  /**
   * Delete all debug log files
   */
  async clearLogs(): Promise<void> {
    try {
      // Cancel any pending flush and drain the in-memory buffer
      // to prevent logs from being written to disk after clearing.
      if (this.writeTimer) {
        clearTimeout(this.writeTimer);
        this.writeTimer = null;
      }
      this.logBuffer = [];

      const basePath = (await storageService.getBackupPath()) || `${FileSystem.documentDirectory}ziasub_backup`;

      if (basePath.startsWith("content://")) {
        // SAF: only delete files whose name starts with debug_ and ends with .txt
        const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(basePath);
        for (const fileUri of files) {
          const name = this.getSafFileName(fileUri);
          if (name.startsWith("debug_") && name.endsWith(".txt")) {
            await FileSystem.StorageAccessFramework.deleteAsync(fileUri);
          }
        }
      } else {
        const debugDir = `${basePath}/debug`;
        const dirInfo = await FileSystem.getInfoAsync(debugDir);
        if (dirInfo.exists && dirInfo.isDirectory) {
          // Delete individual .txt files, then remove the empty directory
          const dirFiles = await FileSystem.readDirectoryAsync(debugDir);
          for (const file of dirFiles) {
            if (file.endsWith(".txt")) {
              await FileSystem.deleteAsync(`${debugDir}/${file}`, { idempotent: true });
            }
          }
          // Remove the debug/ directory itself (idempotent — safe if already gone)
          await FileSystem.deleteAsync(debugDir, { idempotent: true });
        }
      }
      // Use console.log instead of this.info to avoid re-creating a log file
      console.log("[LoggerService] All debug log files cleared.");
    } catch (error) {
      console.error("[LoggerService] Error clearing log files:", error);
    }
  }
}

function dataToString(data: any): string {
  if (data === null || data === undefined) return "";
  if (typeof data === "string") return data;
  if (typeof data === "number" || typeof data === "boolean") return String(data);
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

export const logger = LoggerService.getInstance();
