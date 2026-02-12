/**
 * Utility functions for date handling, optimized for GMT-5 (Lima, Peru)
 */

/**
 * Returns the current date in YYYY-MM-DD format, specifically for the America/Lima timezone.
 * This avoids the day-shift issue common with .toISOString() when it's late in Peru but
 * already the next day in UTC.
 */
export const getLimaDate = (): string => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return formatter.format(now); // Returns "YYYY-MM-DD"
};

/**
 * Returns the current date and time formatted for Peru (Spanish)
 */
export const formatLimaDateTime = (date?: Date | string): string => {
    const d = date ? new Date(date) : new Date();
    return new Intl.DateTimeFormat('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(d);
};

/**
 * Parses a YYYY-MM-DD string as a local date in Lima to avoid UTC shifts
 */
export const parseLimaDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Creating a date without time in local timezone
    return new Date(year, month - 1, day);
};
