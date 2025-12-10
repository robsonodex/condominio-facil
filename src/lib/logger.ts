/**
 * LOGGER - Centralized logging utility
 * Logs to console and optionally to system_logs table
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    event: string;
    level: LogLevel;
    meta?: Record<string, any>;
    userId?: string;
    condoId?: string;
}

/**
 * Log to console with formatted output
 */
function logToConsole(entry: LogEntry) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    const message = `${prefix} ${entry.event}`;

    switch (entry.level) {
        case 'error':
            console.error(message, entry.meta || '');
            break;
        case 'warn':
            console.warn(message, entry.meta || '');
            break;
        case 'debug':
            console.debug(message, entry.meta || '');
            break;
        default:
            console.log(message, entry.meta || '');
    }
}

/**
 * Log to database (system_logs table)
 * Fails silently if table doesn't exist
 */
async function logToDatabase(entry: LogEntry) {
    try {
        await supabaseAdmin.from('system_logs').insert({
            event: entry.event,
            level: entry.level,
            meta: entry.meta || {},
            user_id: entry.userId || null,
            condo_id: entry.condoId || null,
            created_at: new Date().toISOString(),
        });
    } catch (error) {
        // Silently fail - don't break the app if logging fails
        console.error('[LOGGER] Failed to write to database:', error);
    }
}

/**
 * Main logger function
 */
export async function log(entry: LogEntry) {
    // Always log to console
    logToConsole(entry);

    // Log to database for errors and warnings
    if (entry.level === 'error' || entry.level === 'warn') {
        await logToDatabase(entry);
    }
}

/**
 * Convenience methods
 */
export const logger = {
    info: (event: string, meta?: Record<string, any>) =>
        log({ event, level: 'info', meta }),

    warn: (event: string, meta?: Record<string, any>) =>
        log({ event, level: 'warn', meta }),

    error: (event: string, meta?: Record<string, any>) =>
        log({ event, level: 'error', meta }),

    debug: (event: string, meta?: Record<string, any>) =>
        log({ event, level: 'debug', meta }),

    // Special method for RLS blocks
    rlsBlock: (userId: string, table: string, operation: string, meta?: Record<string, any>) =>
        log({
            event: 'RLS_BLOCK',
            level: 'warn',
            meta: { ...meta, userId, table, operation, code: 'RLS_BLOCK' },
            userId,
        }),

    // Special method for auto-login detection
    autoLoginDetected: (userId: string, createdUserId: string) =>
        log({
            event: 'AUTO_LOGIN_DETECTED',
            level: 'error',
            meta: {
                code: 'AUTO_LOGIN_DETECTED',
                message: 'User session changed after creating another user',
                currentUserId: userId,
                createdUserId,
            },
            userId,
        }),
};

export default logger;
