import { useCallback } from 'react';
import { useDataContext } from '../context/DataContext';
import { Appointment, AppointmentStatus } from '../types';
import { appointmentToDb } from '../utils/mappers';
import { supabaseUpsert, supabaseDelete, supabaseUpdate } from '../utils/supabaseHelpers';
import { pushAppointmentToCalendar, deleteCalendarEvent, pullCalendarEvents } from '../services/googleCalendarService';
import { getGoogleToken, getSyncToken, saveSyncToken } from '../services/googleTokenService';
import { GoogleAuthExpiredError } from '../utils/googleErrors';
import { logger } from '../utils/logger';
import { toast } from 'sonner';

export const useAppointments = (currentUserId?: string) => {
    const { appointments, setAppointments, properties, clients } = useDataContext();

    const handleSaveAppointment = async (appt: Appointment) => {
        const apptWithUser = { ...appt, userId: currentUserId };
        setAppointments(prev => {
            const exists = prev.find(a => a.id === appt.id);
            if (exists) return prev.map(a => a.id === appt.id ? apptWithUser : a);
            return [...prev, apptWithUser];
        });
        await supabaseUpsert('appointments', appointmentToDb(apptWithUser), `appointment ${appt.id}`);

        // Push to Google Calendar (fire-and-forget)
        try {
            const token = await getGoogleToken();
            if (token) {
                const property = properties.find(p => p.id === appt.propertyId);
                const client = clients.find(c => c.id === appt.clientId);
                if (property && client) {
                    const googleEventId = await pushAppointmentToCalendar(apptWithUser, property, client, token);
                    if (googleEventId && googleEventId !== appt.googleEventId) {
                        await supabaseUpdate('appointments', appt.id,
                            { google_event_id: googleEventId }, 'calendar sync');
                        setAppointments(prev => prev.map(a =>
                            a.id === appt.id ? { ...a, googleEventId } : a
                        ));
                    }
                }
            }
        } catch (e) {
            if (e instanceof GoogleAuthExpiredError) {
                toast.info('Tu sesión de Google expiró. Volvé a iniciar sesión para sincronizar con Calendar.');
            } else {
                logger.error('[Calendar] Sync error on save:', e);
            }
        }
    };

    const handleDeleteAppointment = async (apptId: string) => {
        const appt = appointments.find(a => a.id === apptId);
        setAppointments(prev => prev.filter(a => a.id !== apptId));
        await supabaseDelete('appointments', apptId, 'appointment');

        // Delete from Google Calendar
        if (appt?.googleEventId) {
            try {
                const token = await getGoogleToken();
                if (token) {
                    await deleteCalendarEvent(appt.googleEventId, token);
                }
            } catch (e) {
                if (e instanceof GoogleAuthExpiredError) {
                    toast.info('Tu sesión de Google expiró. El evento no se eliminó del Calendar.');
                }
            }
        }
    };

    const handleCompleteVisit = async (
        apptId: string,
        interestRating: number,
        priceRating: number,
        feedbackComment: string,
        comentarios: string
    ) => {
        setAppointments(prev => prev.map(a => {
            if (a.id === apptId) {
                return {
                    ...a,
                    status: AppointmentStatus.REALIZADA,
                    interestRating,
                    priceRating,
                    feedbackComment,
                    comentariosPostVisita: comentarios,
                };
            }
            return a;
        }));
        await supabaseUpdate('appointments', apptId, {
            status: 'REALIZADA',
            interest_rating: interestRating,
            price_rating: priceRating,
            feedback_comment: feedbackComment,
            comentarios_post_visita: comentarios,
        }, 'appointment completion');
    };

    const handleCancelAppointment = async (apptId: string) => {
        const appt = appointments.find(a => a.id === apptId);
        setAppointments(prev => prev.map(a =>
            a.id === apptId ? { ...a, status: AppointmentStatus.CANCELADA } : a
        ));
        await supabaseUpdate('appointments', apptId, { status: 'CANCELADA' }, 'appointment cancel');

        // Delete from Google Calendar when cancelled
        if (appt?.googleEventId) {
            try {
                const token = await getGoogleToken();
                if (token) {
                    await deleteCalendarEvent(appt.googleEventId, token);
                }
            } catch (e) {
                if (e instanceof GoogleAuthExpiredError) {
                    toast.info('Tu sesión de Google expiró. El evento no se eliminó del Calendar.');
                }
            }
        }
    };

    const syncFromCalendar = useCallback(async (): Promise<{ synced: number }> => {
        if (!currentUserId) return { synced: 0 };

        try {
            const token = await getGoogleToken();
            if (!token) {
                toast.info('No hay token de Google. Volvé a iniciar sesión.');
                return { synced: 0 };
            }

            const syncToken = await getSyncToken(currentUserId);
            const { events, nextSyncToken } = await pullCalendarEvents(token, syncToken);

            let syncedCount = 0;

            for (const event of events) {
                if (!event.id) continue;

                // Find existing appointment linked to this Calendar event
                const existing = appointments.find(a => a.googleEventId === event.id);

                if (event.status === 'cancelled') {
                    // Event deleted in Calendar → cancel local appointment
                    if (existing && existing.status !== AppointmentStatus.CANCELADA) {
                        setAppointments(prev => prev.map(a =>
                            a.id === existing.id ? { ...a, status: AppointmentStatus.CANCELADA } : a
                        ));
                        await supabaseUpdate('appointments', existing.id,
                            { status: 'CANCELADA' }, 'calendar sync cancel');
                        syncedCount++;
                    }
                } else if (existing && event.start?.dateTime) {
                    // Event modified in Calendar → update local appointment
                    const newFechaHora = event.start.dateTime;
                    if (existing.fechaHora !== newFechaHora) {
                        setAppointments(prev => prev.map(a =>
                            a.id === existing.id ? { ...a, fechaHora: newFechaHora } : a
                        ));
                        await supabaseUpdate('appointments', existing.id,
                            { fecha_hora: newFechaHora }, 'calendar sync update');
                        syncedCount++;
                    }
                }
                // Events created externally in Calendar (no local match) are skipped
                // since we don't know which client/property to associate them with
            }

            if (nextSyncToken) {
                await saveSyncToken(currentUserId, nextSyncToken);
            }

            return { synced: syncedCount };
        } catch (e) {
            if (e instanceof GoogleAuthExpiredError) {
                toast.info('Tu sesión de Google expiró. Volvé a iniciar sesión para sincronizar.');
            } else {
                logger.error('[Calendar] Sync from calendar error:', e);
                toast.error('Error al sincronizar con Google Calendar.');
            }
            return { synced: 0 };
        }
    }, [currentUserId, appointments, setAppointments]);

    const getTodayAppointments = () => {
        const today = new Date().toISOString().slice(0, 10);
        return appointments
            .filter(a => a.fechaHora.slice(0, 10) === today && a.status !== AppointmentStatus.CANCELADA)
            .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));
    };

    const getWeekAppointments = () => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        return appointments
            .filter(a => {
                const d = new Date(a.fechaHora);
                return d >= startOfWeek && d < endOfWeek;
            })
            .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));
    };

    const getPropertyAppointments = (propertyId: string) => {
        return appointments
            .filter(a => a.propertyId === propertyId)
            .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
    };

    return {
        appointments,
        handleSaveAppointment,
        handleDeleteAppointment,
        handleCompleteVisit,
        handleCancelAppointment,
        syncFromCalendar,
        getTodayAppointments,
        getWeekAppointments,
        getPropertyAppointments,
    };
};
