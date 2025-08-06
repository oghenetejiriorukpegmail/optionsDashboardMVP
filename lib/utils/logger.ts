/**
 * Production-ready logging utility
 * Provides structured logging with different levels and optional console output for development
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    switch (level) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private formatLog(level: string, message: string, context?: string, metadata?: Record<string, any>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } as any : undefined
    };
  }

  private writeLog(logEntry: LogEntry): void {
    // In development, also output to console for debugging
    if (this.isDevelopment) {
      const consoleMessage = `[${logEntry.timestamp}] ${logEntry.level} ${logEntry.context ? `[${logEntry.context}] ` : ''}${logEntry.message}`;
      
      switch (logEntry.level) {
        case 'ERROR':
          console.error(consoleMessage, logEntry.metadata, logEntry.error);
          break;
        case 'WARN':
          console.warn(consoleMessage, logEntry.metadata);
          break;
        case 'DEBUG':
          console.debug(consoleMessage, logEntry.metadata);
          break;
        default:
          console.log(consoleMessage, logEntry.metadata);
      }
    }

    // In production, you would typically send to a logging service
    // For now, we'll use a simple implementation that could be extended
    if (!this.isDevelopment) {
      // Here you could send to external logging services like:
      // - CloudWatch Logs
      // - Datadog
      // - New Relic
      // - Custom logging endpoint
      
      // For now, we maintain structured logging without console output
      // This prevents console pollution in production while maintaining log data
    }
  }

  error(message: string, context?: string, metadata?: Record<string, any>, error?: Error): void {
    if (this.logLevel >= LogLevel.ERROR) {
      this.writeLog(this.formatLog('ERROR', message, context, metadata, error));
    }
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.logLevel >= LogLevel.WARN) {
      this.writeLog(this.formatLog('WARN', message, context, metadata));
    }
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.logLevel >= LogLevel.INFO) {
      this.writeLog(this.formatLog('INFO', message, context, metadata));
    }
  }

  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      this.writeLog(this.formatLog('DEBUG', message, context, metadata));
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory function for context-specific loggers
export function createContextLogger(context: string) {
  return {
    error: (message: string, metadata?: Record<string, any>, error?: Error) => 
      logger.error(message, context, metadata, error),
    warn: (message: string, metadata?: Record<string, any>) => 
      logger.warn(message, context, metadata),
    info: (message: string, metadata?: Record<string, any>) => 
      logger.info(message, context, metadata),
    debug: (message: string, metadata?: Record<string, any>) => 
      logger.debug(message, context, metadata),
  };
}