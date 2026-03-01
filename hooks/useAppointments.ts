import { useDataContext } from '../context/DataContext';
import { Appointment, AppointmentStatus } from '../types';
import { appointmentToDb } from '../utils/mappers';
import { supabaseUpsert, supabaseDelete, supabaseUpdate } from '../utils/supabaseHelpers';

export const useAppointments = (currentUserId?: string) => {
    const { appointments, setAppointments } = useDataContext();

    const handleSaveAppointment = async (appt: Appointment) => {
        const apptWithUser = { ...appt, userId: currentUserId };
        setAppointments(prev => {
            const exists = prev.find(a => a.id === appt.id);
            if (exists) return prev.map(a => a.id === appt.id ? apptWithUser : a);
            return [...prev, apptWithUser];
        });
        await supabaseUpsert('appointments', appointmentToDb(apptWithUser), `appointment ${appt.id}`);
    };

    const handleDeleteAppointment = async (apptId: string) => {
        setAppointments(prev => prev.filter(a => a.id !== apptId));
        await supabaseDelete('appointments', apptId, 'appointment');
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
        setAppointments(prev => prev.map(a =>
            a.id === apptId ? { ...a, status: AppointmentStatus.CANCELADA } : a
        ));
        await supabaseUpdate('appointments', apptId, { status: 'CANCELADA' }, 'appointment cancel');
    };

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
        getTodayAppointments,
        getWeekAppointments,
        getPropertyAppointments,
    };
};
