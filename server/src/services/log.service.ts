export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS'
}

export interface LogContext {
    service?: string;
    method?: string;
    userId?: string;
    requestId?: string;
    [key: string]: any;
}

class LogService {
    private isDevelopment = process.env['NODE_ENV'] === 'development';
    private isProduction = process.env['NODE_ENV'] === 'production';
    private enableColors = process.env['LOG_COLORS'] !== 'false' && process.stdout.isTTY;

    // ANSI color codes
    private colors = {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        dim: '\x1b[2m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        gray: '\x1b[90m',
        bgRed: '\x1b[41m',
        bgGreen: '\x1b[42m',
        bgYellow: '\x1b[43m',
        bgBlue: '\x1b[44m',
        bgMagenta: '\x1b[45m',
        bgCyan: '\x1b[46m'
    };

    // No-color versions for environments that don't support ANSI
    private noColors = {
        reset: '',
        bright: '',
        dim: '',
        red: '',
        green: '',
        yellow: '',
        blue: '',
        magenta: '',
        cyan: '',
        white: '',
        gray: '',
        bgRed: '',
        bgGreen: '',
        bgYellow: '',
        bgBlue: '',
        bgMagenta: '',
        bgCyan: ''
    };

    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const levelStr = `[${level}]`;

        // Get colors for this log level
        const colors = this.getColors(level);
        const colorSet = this.enableColors ? this.colors : this.noColors;

        let formattedMessage = `${colors.timestamp}${timestamp}${colorSet.reset}`;
        formattedMessage += ` ${colors.level}${levelStr}${colorSet.reset}`;

        if (context?.service) {
            formattedMessage += ` ${colors.service}[${context.service}]${colorSet.reset}`;
        }

        if (context?.method) {
            formattedMessage += ` ${colors.method}[${context.method}]${colorSet.reset}`;
        }

        if (context?.userId) {
            formattedMessage += ` ${colors.userId}[User:${context.userId}]${colorSet.reset}`;
        }

        if (context?.requestId) {
            formattedMessage += ` ${colors.requestId}[Req:${context.requestId}]${colorSet.reset}`;
        }

        formattedMessage += ` ${colors.message}${message}${colorSet.reset}`;

        // Add additional context data in development
        if (this.isDevelopment && context) {
            const additionalContext = { ...context };
            delete additionalContext.service;
            delete additionalContext.method;
            delete additionalContext.userId;
            delete additionalContext.requestId;

            if (Object.keys(additionalContext).length > 0) {
                formattedMessage += ` ${colors.context}| Context: ${JSON.stringify(additionalContext)}${colorSet.reset}`;
            }
        }

        return formattedMessage;
    }



    private getColors(level: LogLevel) {
        const colorSet = this.enableColors ? this.colors : this.noColors;

        switch (level) {
            case LogLevel.DEBUG:
                return {
                    timestamp: colorSet.gray,
                    emoji: colorSet.cyan,
                    level: colorSet.cyan,
                    service: colorSet.blue,
                    method: colorSet.magenta,
                    userId: colorSet.yellow,
                    requestId: colorSet.yellow,
                    message: colorSet.white,
                    context: colorSet.gray
                };
            case LogLevel.INFO:
                return {
                    timestamp: colorSet.gray,
                    emoji: colorSet.blue,
                    level: colorSet.blue,
                    service: colorSet.cyan,
                    method: colorSet.magenta,
                    userId: colorSet.yellow,
                    requestId: colorSet.yellow,
                    message: colorSet.white,
                    context: colorSet.gray
                };
            case LogLevel.WARN:
                return {
                    timestamp: colorSet.gray,
                    emoji: colorSet.yellow,
                    level: colorSet.yellow,
                    service: colorSet.yellow,
                    method: colorSet.yellow,
                    userId: colorSet.yellow,
                    requestId: colorSet.yellow,
                    message: colorSet.yellow,
                    context: colorSet.gray
                };
            case LogLevel.ERROR:
                return {
                    timestamp: colorSet.gray,
                    emoji: colorSet.red,
                    level: colorSet.red,
                    service: colorSet.red,
                    method: colorSet.red,
                    userId: colorSet.yellow,
                    requestId: colorSet.yellow,
                    message: colorSet.red,
                    context: colorSet.gray
                };
            case LogLevel.SUCCESS:
                return {
                    timestamp: colorSet.gray,
                    emoji: colorSet.green,
                    level: colorSet.green,
                    service: colorSet.green,
                    method: colorSet.cyan,
                    userId: colorSet.yellow,
                    requestId: colorSet.yellow,
                    message: colorSet.green,
                    context: colorSet.gray
                };
            default:
                return {
                    timestamp: colorSet.gray,
                    emoji: colorSet.white,
                    level: colorSet.white,
                    service: colorSet.white,
                    method: colorSet.white,
                    userId: colorSet.white,
                    requestId: colorSet.white,
                    message: colorSet.white,
                    context: colorSet.gray
                };
        }
    }

    private shouldLog(level: LogLevel): boolean {
        // In production, don't log DEBUG messages
        if (this.isProduction && level === LogLevel.DEBUG) {
            return false;
        }
        return true;
    }

    debug(message: string, context?: LogContext): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(this.formatMessage(LogLevel.DEBUG, message, context));
        }
    }

    info(message: string, context?: LogContext): void {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(this.formatMessage(LogLevel.INFO, message, context));
        }
    }

    warn(message: string, context?: LogContext): void {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage(LogLevel.WARN, message, context));
        }
    }

    error(message: string, error?: Error, context?: LogContext): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            let fullMessage = message;

            if (error) {
                fullMessage += ` | Error: ${error.message}`;
                if (error.stack && this.isDevelopment) {
                    fullMessage += ` | Stack: ${error.stack}`;
                }
            }

            console.error(this.formatMessage(LogLevel.ERROR, fullMessage, context));
        }
    }

    success(message: string, context?: LogContext): void {
        if (this.shouldLog(LogLevel.SUCCESS)) {
            console.log(this.formatMessage(LogLevel.SUCCESS, message, context));
        }
    }

    // Convenience methods for common scenarios
    auth(message: string, context?: LogContext): void {
        this.info(message, { ...context, service: 'AUTH' });
    }

    database(message: string, context?: LogContext): void {
        this.info(message, { ...context, service: 'DATABASE' });
    }

    payment(message: string, context?: LogContext): void {
        this.info(message, { ...context, service: 'PAYMENT' });
    }

    utm(message: string, context?: LogContext): void {
        this.info(message, { ...context, service: 'UTM' });
    }

    cors(message: string, context?: LogContext): void {
        this.debug(message, { ...context, service: 'CORS' });
    }

    webhook(message: string, context?: LogContext): void {
        this.info(message, { ...context, service: 'WEBHOOK' });
    }

    gateway(message: string, context?: LogContext): void {
        this.info(message, { ...context, service: 'GATEWAY' });
    }

    diet(message: string, context?: LogContext): void {
        this.info(message, { ...context, service: 'DIET' });
    }

    // Method to log API requests
    apiRequest(method: string, path: string, userId?: string, requestId?: string): void {
        const context: LogContext = {
            service: 'API',
            method: 'REQUEST'
        };

        if (userId) context.userId = userId;
        if (requestId) context.requestId = requestId;

        this.info(`API Request: ${method} ${path}`, context);
    }

    // Method to log API responses
    apiResponse(method: string, path: string, statusCode: number, userId?: string, requestId?: string): void {
        const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
        const message = `API Response: ${method} ${path} - ${statusCode}`;

        const context: LogContext = {
            service: 'API',
            method: 'RESPONSE',
            statusCode
        };

        if (userId) context.userId = userId;
        if (requestId) context.requestId = requestId;

        if (level === LogLevel.ERROR) {
            this.error(message, undefined, context);
        } else {
            this.info(message, context);
        }
    }

    // Method to log user actions
    userAction(action: string, userId: string, details?: any): void {
        this.info(`User Action: ${action}`, {
            service: 'USER',
            method: 'ACTION',
            userId,
            details
        });
    }

    // Method to log business events
    businessEvent(event: string, details?: any, context?: LogContext): void {
        this.info(`Business Event: ${event}`, {
            ...context,
            service: 'BUSINESS',
            method: 'EVENT',
            details
        });
    }
}

// Export singleton instance
export const logService = new LogService();

// Export convenience functions
export const log = {
    debug: (message: string, context?: LogContext) => logService.debug(message, context),
    info: (message: string, context?: LogContext) => logService.info(message, context),
    warn: (message: string, context?: LogContext) => logService.warn(message, context),
    error: (message: string, error?: Error, context?: LogContext) => logService.error(message, error, context),
    success: (message: string, context?: LogContext) => logService.success(message, context),
    auth: (message: string, context?: LogContext) => logService.auth(message, context),
    database: (message: string, context?: LogContext) => logService.database(message, context),
    payment: (message: string, context?: LogContext) => logService.payment(message, context),
    utm: (message: string, context?: LogContext) => logService.utm(message, context),
    cors: (message: string, context?: LogContext) => logService.cors(message, context),
    webhook: (message: string, context?: LogContext) => logService.webhook(message, context),
    gateway: (message: string, context?: LogContext) => logService.gateway(message, context),
    diet: (message: string, context?: LogContext) => logService.diet(message, context),
    apiRequest: (method: string, path: string, userId?: string, requestId?: string) => logService.apiRequest(method, path, userId, requestId),
    apiResponse: (method: string, path: string, statusCode: number, userId?: string, requestId?: string) => logService.apiResponse(method, path, statusCode, userId, requestId),
    userAction: (action: string, userId: string, details?: any) => logService.userAction(action, userId, details),
    businessEvent: (event: string, details?: any, context?: LogContext) => logService.businessEvent(event, details, context)
};