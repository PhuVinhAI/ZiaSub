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
    this.enabled = enabled;
    if (enabled) {
      this.info("LoggerService", "Debug logging turned ON.");
    } else {
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
   * Append log to SAF directory URI
   */
  private async appendLogSaf(directoryUri: string, filename: string, content: string): Promise<void> {
    try {
      const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(directoryUri);
      
      // Look for filename or debug_filename in SAF root directory
      let targetFileUri = files.find((f) => {
        const decoded = decodeURIComponent(f);
        return decoded.endsWith(filename) || decoded.endsWith(`debug_${filename}`);
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
        const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(basePath);
        for (const fileUri of files) {
          const decoded = decodeURIComponent(fileUri);
          if (decoded.endsWith(".txt") && (decoded.includes("debug_") || decoded.includes("debug"))) {
            const name = decoded.split("/").pop() || "debug_log.txt";
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
      const filePath = `${basePath}/debug/${pathOrFilename}`;
      return await FileSystem.readAsStringAsync(filePath);
    } catch (error) {
      console.error("[LoggerService] Error reading log file:", error);
      return `Error reading log file: ${error}`;
    }
  }

  /**
   * Delete all debug log files
   */
  async clearLogs(): Promise<void> {
    try {
      const basePath = (await storageService.getBackupPath()) || `${FileSystem.documentDirectory}ziasub_backup`;

      if (basePath.startsWith("content://")) {
        const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(basePath);
        for (const fileUri of files) {
          const decoded = decodeURIComponent(fileUri);
          if (decoded.endsWith(".txt") && (decoded.includes("debug_") || decoded.includes("debug"))) {
            await FileSystem.StorageAccessFramework.deleteAsync(fileUri);
          }
        }
      } else {
        const debugDir = `${basePath}/debug`;
        const dirInfo = await FileSystem.getInfoAsync(debugDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(debugDir, { idempotent: true });
        }
      }
      this.info("LoggerService", "All debug log files cleared.");
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
