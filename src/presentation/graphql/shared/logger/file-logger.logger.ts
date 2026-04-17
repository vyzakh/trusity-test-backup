import { ConsoleLogger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export class FileLogger extends ConsoleLogger {
  private logDir = path.join(process.cwd(), 'logs');
  private errorLogFile = path.join(this.logDir, 'error.log');
  private combinedLogFile = path.join(this.logDir, 'combined.log');

  constructor(context?: string) {
    super(context || 'Application');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLogMessage(message: any): string {
    if (typeof message === 'string') {
      return message;
    }

    if (message instanceof Error) {
      return `${message.message}\n${message.stack || ''}`;
    }

    if (typeof message === 'object' && message !== null) {
      try {
        return JSON.stringify(message, null, 2);
      } catch (error) {
        return String(message);
      }
    }

    return String(message);
  }

  private writeToFile(level: string, message: any, context?: string, stack?: string) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}] ` : '';
    const formattedMessage = this.formatLogMessage(message);

    let logMessage = `${timestamp} ${level.toUpperCase()} ${contextStr}${formattedMessage}`;

    if (stack) {
      logMessage += `\n${stack}`;
    }

    logMessage += '\n\n';

    fs.appendFileSync(this.combinedLogFile, logMessage);

    if (level === 'error') {
      fs.appendFileSync(this.errorLogFile, logMessage);
    }
  }

  log(message: any, context?: string) {
    super.log(message, context);
    this.writeToFile('log', message, context);
  }

  error(message: any, stack?: string, context?: string) {
    super.error(message, stack, context);
    this.writeToFile('error', message, context, stack);
  }

  warn(message: any, context?: string) {
    super.warn(message, context);
    this.writeToFile('warn', message, context);
  }

  debug(message: any, context?: string) {
    super.debug(message, context);
    this.writeToFile('debug', message, context);
  }

  verbose(message: any, context?: string) {
    super.verbose(message, context);
    this.writeToFile('verbose', message, context);
  }
}

export function createAppLogger() {
  return new FileLogger();
}

export function setupUnhandledRejectionHandler() {
  const logger = new FileLogger('UnhandledRejection');

  process.removeAllListeners('warning');

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection', reason instanceof Error ? reason.stack : JSON.stringify(reason), 'UnhandledRejection');
  });
}
