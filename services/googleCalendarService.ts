import { GoogleAuthExpiredError } from '../utils/googleErrors';
import { logger } from '../utils/logger';
import type { Appointment, Property, Client } from '../types';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const TIMEZONE = 'America/Argentina/Buenos_Aires';

interface CalendarEvent {
    id?: string;
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    status?: string;
}

interface CalendarListResponse {
    items: CalendarEvent[];
    nextSyncToken?: string;
    nextPageToken?: string;
}

/**
 * Authenticated fetch wrapper for Google APIs.
 * Throws GoogleAuthExpiredError on 401 so callers can handle re-auth.
 */
async function googleFetch(url: string, token: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (response.status === 401) {
        throw new GoogleAuthExpiredError();
    }

    return response;
}

/**
 * Push a local appointment to Google Calendar.
 * Creates a new event or updates an existing one.
 * Returns the Google Calendar event ID.
 */
export async function pushAppointmentToCalendar(
    appointment: Appointment,
    property: Property,
    client: Client,
    token: string
): Promise<string | null> {
    const startDate = new Date(appointment.fechaHora);
    const endDate = new Date(startDate.getTime() + appointment.duration * 60000);

    const event: CalendarEvent = {
        summary: `Visita: ${client.name} - ${property.address}`,
        description: [
            `Cliente: ${client.name}`,
            client.phone ? `Tel: ${client.phone}` : '',
            client.email ? `Email: ${client.email}` : '',
            appointment.comentariosPostVisita ? `\nNotas: ${appointment.comentariosPostVisita}` : '',
        ].filter(Boolean).join('\n'),
        location: property.address,
        start: { dateTime: startDate.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: endDate.toISOString(), timeZone: TIMEZONE },
    };

    try {
        // Update existing event
        if (appointment.googleEventId) {
            const res = await googleFetch(
                `${CALENDAR_API}/calendars/primary/events/${appointment.googleEventId}`,
                token,
                { method: 'PUT', body: JSON.stringify(event) }
            );
            if (res.ok) {
                logger.log('[Calendar] Event updated:', appointment.googleEventId);
                return appointment.googleEventId;
            }
            // If update fails (e.g. event deleted from Calendar), fall through to create
        }

        // Create new event
        const res = await googleFetch(
            `${CALENDAR_API}/calendars/primary/events`,
            token,
            { method: 'POST', body: JSON.stringify(event) }
        );

        if (res.ok) {
            const data = await res.json();
            logger.log('[Calendar] Event created:', data.id);
            return data.id;
        }

        logger.error('[Calendar] Failed to create event:', res.status);
        return null;
    } catch (e) {
        if (e instanceof GoogleAuthExpiredError) throw e;
        logger.error('[Calendar] Error pushing event:', e);
        return null;
    }
}

/**
 * Delete an event from Google Calendar.
 */
export async function deleteCalendarEvent(googleEventId: string, token: string): Promise<void> {
    try {
        await googleFetch(
            `${CALENDAR_API}/calendars/primary/events/${googleEventId}`,
            token,
            { method: 'DELETE' }
        );
        logger.log('[Calendar] Event deleted:', googleEventId);
    } catch (e) {
        if (e instanceof GoogleAuthExpiredError) throw e;
        logger.error('[Calendar] Error deleting event:', e);
    }
}

/**
 * Pull events from Google Calendar for incremental sync.
 * Uses syncToken if available for efficient delta sync.
 */
export async function pullCalendarEvents(
    token: string,
    syncToken?: string | null,
    timeMin?: string
): Promise<{ events: CalendarEvent[]; nextSyncToken: string | null }> {
    const params = new URLSearchParams();

    if (syncToken) {
        params.set('syncToken', syncToken);
    } else {
        // Initial sync: get future events from last 30 days
        const defaultTimeMin = new Date();
        defaultTimeMin.setDate(defaultTimeMin.getDate() - 30);
        params.set('timeMin', timeMin || defaultTimeMin.toISOString());
        params.set('maxResults', '250');
        params.set('singleEvents', 'true');
        params.set('orderBy', 'startTime');
    }

    try {
        const res = await googleFetch(
            `${CALENDAR_API}/calendars/primary/events?${params.toString()}`,
            token
        );

        if (res.status === 410) {
            // Sync token expired — do a full re-sync
            logger.warn('[Calendar] Sync token expired, performing full sync.');
            return pullCalendarEvents(token, null, timeMin);
        }

        if (!res.ok) {
            logger.error('[Calendar] Pull failed:', res.status);
            return { events: [], nextSyncToken: null };
        }

        const allEvents: CalendarEvent[] = [];
        let data: CalendarListResponse = await res.json();
        allEvents.push(...(data.items || []));

        // Handle pagination
        while (data.nextPageToken) {
            params.set('pageToken', data.nextPageToken);
            params.delete('syncToken');
            const pageRes = await googleFetch(
                `${CALENDAR_API}/calendars/primary/events?${params.toString()}`,
                token
            );
            if (!pageRes.ok) break;
            data = await pageRes.json();
            allEvents.push(...(data.items || []));
        }

        return {
            events: allEvents,
            nextSyncToken: data.nextSyncToken || null,
        };
    } catch (e) {
        if (e instanceof GoogleAuthExpiredError) throw e;
        logger.error('[Calendar] Error pulling events:', e);
        return { events: [], nextSyncToken: null };
    }
}
