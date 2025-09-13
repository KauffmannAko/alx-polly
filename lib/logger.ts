/**
 * Security logging and monitoring
 */

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SECURITY = 'security'
}

export enum SecurityEvent {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  REGISTRATION_ATTEMPT = 'registration_attempt',
  REGISTRATION_SUCCESS = 'registration_success',
  POLL_CREATION = 'poll_creation',
  POLL_UPDATE = 'poll_update',
  POLL_DELETION = 'poll_deletion',
  VOTE_CAST = 'vote_cast',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: SecurityEvent | string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  log(entry: Omit<LogEntry, 'timestamp'>) {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(logEntry);
    } else {
      console.log(`[${logEntry.level.toUpperCase()}] ${logEntry.event}:`, logEntry);
    }
  }

  private sendToExternalLogger(entry: LogEntry) {
    // In production, integrate with services like:
    // - Datadog
    // - New Relic
    // - CloudWatch
    // - Sentry
    console.log('External logging:', entry);
  }

  getLogs(filter?: { level?: LogLevel; event?: string; userId?: string }) {
    if (!filter) return this.logs;
    
    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.event && log.event !== filter.event) return false;
      if (filter.userId && log.userId !== filter.userId) return false;
      return true;
    });
  }

  getSecurityEvents() {
    return this.logs.filter(log => log.level === LogLevel.SECURITY);
  }

  getSuspiciousActivity() {
    return this.logs.filter(log => 
      log.event === SecurityEvent.SUSPICIOUS_ACTIVITY ||
      log.event === SecurityEvent.UNAUTHORIZED_ACCESS ||
      log.severity === 'high' ||
      log.severity === 'critical'
    );
  }
}

export const securityLogger = new SecurityLogger();

// Helper functions for common security events
export function logLoginAttempt(email: string, success: boolean, ip?: string, userAgent?: string) {
  securityLogger.log({
    level: LogLevel.SECURITY,
    event: success ? SecurityEvent.LOGIN_SUCCESS : SecurityEvent.LOGIN_FAILURE,
    details: { email, success },
    ip,
    userAgent,
    severity: success ? 'low' : 'medium'
  });
}

export function logUnauthorizedAccess(userId: string, resource: string, action: string, ip?: string) {
  securityLogger.log({
    level: LogLevel.SECURITY,
    event: SecurityEvent.UNAUTHORIZED_ACCESS,
    userId,
    details: { resource, action },
    ip,
    severity: 'high'
  });
}

export function logSuspiciousActivity(description: string, userId?: string, ip?: string, details?: Record<string, any>) {
  securityLogger.log({
    level: LogLevel.SECURITY,
    event: SecurityEvent.SUSPICIOUS_ACTIVITY,
    userId,
    details: { description, ...details },
    ip,
    severity: 'high'
  });
}

export function logPollOperation(operation: 'create' | 'update' | 'delete', pollId: string, userId: string, details?: Record<string, any>) {
  const eventMap = {
    create: SecurityEvent.POLL_CREATION,
    update: SecurityEvent.POLL_UPDATE,
    delete: SecurityEvent.POLL_DELETION
  };

  securityLogger.log({
    level: LogLevel.INFO,
    event: eventMap[operation],
    userId,
    details: { pollId, ...details },
    severity: 'low'
  });
}
