import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, ChevronRight, Star, RefreshCw } from 'lucide-react';
import { Appointment, Client, Property, Professional, AppointmentStatus } from '../types';
import VisitFeedbackModal from './VisitFeedbackModal';

type AgendaTab = 'HOY' | 'SEMANA' | 'TODAS';

interface AgendaViewProps {
    appointments: Appointment[];
    clients: Client[];
    properties: Property[];
    professionals: Professional[];
    onCompleteVisit: (apptId: string, interestRating: number, priceRating: number, feedbackComment: string, comentarios: string) => void;
    onCancelAppointment: (apptId: string) => void;
    onScheduleNew: () => void;
    onSyncCalendar?: () => Promise<{ synced: number }>;
    onComposeEmail?: (to: string, clientName: string) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({
    appointments,
    clients,
    properties,
    professionals,
    onCompleteVisit,
    onCancelAppointment,
    onScheduleNew,
    onSyncCalendar,
    onComposeEmail,
}) => {
    const [activeTab, setActiveTab] = useState<AgendaTab>('HOY');
    const [completingVisit, setCompletingVisit] = useState<Appointment | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        if (!onSyncCalendar || isSyncing) return;
        setIsSyncing(true);
        try {
            const { synced } = await onSyncCalendar();
            if (synced > 0) {
                // Toast is handled by the parent or hook
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const today = new Date().toISOString().slice(0, 10);

    const getWeekRange = () => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        return { start, end };
    };

    const filteredAppointments = (() => {
        let filtered = [...appointments];
        if (activeTab === 'HOY') {
            filtered = filtered.filter(a => a.fechaHora.slice(0, 10) === today);
        } else if (activeTab === 'SEMANA') {
            const { start, end } = getWeekRange();
            filtered = filtered.filter(a => {
                const d = new Date(a.fechaHora);
                return d >= start && d < end;
            });
        }
        return filtered.sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));
    })();

    const getClient = (id: string) => clients.find(c => c.id === id);
    const getProperty = (id: string) => properties.find(p => p.id === id);
    const getProfessional = (id?: string) => id ? professionals.find(p => p.id === id) : undefined;

    const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
        PENDIENTE: { label: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-700' },
        REALIZADA: { label: 'Realizada', bg: 'bg-green-100', text: 'text-green-700' },
        CANCELADA: { label: 'Cancelada', bg: 'bg-red-100', text: 'text-red-700' },
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const todayFormatted = new Date().toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const tabs: { id: AgendaTab; label: string }[] = [
        { id: 'HOY', label: 'Hoy' },
        { id: 'SEMANA', label: 'Esta Semana' },
        { id: 'TODAS', label: 'Todas' },
    ];

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-indigo-600" />
                        Agenda Diaria
                    </h1>
                    <p className="text-gray-500 mt-1 capitalize">{todayFormatted}</p>
                </div>
                <div className="flex gap-2">
                    {onSyncCalendar && (
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="px-4 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all border border-gray-200 flex items-center gap-2"
                            title="Sincronizar con Google Calendar"
                        >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Sincronizar</span>
                        </button>
                    )}
                    <button
                        onClick={onScheduleNew}
                        className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-[0.98] shadow-lg"
                    >
                        + Nueva Visita
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === tab.id
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Appointment List */}
            {filteredAppointments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-400 mb-2">
                        {activeTab === 'HOY' ? 'No hay visitas para hoy' : 'No hay visitas'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                        Agendá una nueva visita para empezar
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredAppointments.map(appt => {
                        const client = getClient(appt.clientId);
                        const property = getProperty(appt.propertyId);
                        const professional = getProfessional(appt.professionalId);
                        const status = statusConfig[appt.status];

                        return (
                            <div
                                key={appt.id}
                                className={`bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all ${appt.status === AppointmentStatus.CANCELADA ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        {/* Time Block */}
                                        <div className="bg-indigo-50 rounded-xl p-3 text-center min-w-[72px]">
                                            <p className="text-lg font-bold text-indigo-700">{formatTime(appt.fechaHora)}</p>
                                            {activeTab !== 'HOY' && (
                                                <p className="text-xs text-indigo-500 mt-0.5">{formatDate(appt.fechaHora)}</p>
                                            )}
                                            <p className="text-xs text-indigo-400 mt-0.5">{appt.duration} min</p>
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <span className="font-bold text-gray-900 truncate">{client?.name || 'Cliente desconocido'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <span className="text-sm text-gray-600 truncate">{property?.address || 'Propiedad desconocida'}</span>
                                            </div>
                                            {professional && (
                                                <div className="flex items-center gap-2">
                                                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                                    <span className="text-xs text-gray-500">{professional.name} — {professional.profession}</span>
                                                </div>
                                            )}
                                            {appt.status === AppointmentStatus.REALIZADA && appt.interestRating && (
                                                <div className="flex items-center gap-1 mt-2">
                                                    <span className="text-xs text-gray-400 mr-1">Interés:</span>
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star key={s} className={`w-3.5 h-3.5 ${s <= (appt.interestRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                                    ))}
                                                    {appt.feedbackComment && (
                                                        <span className="text-xs text-gray-400 ml-2 truncate">— {appt.feedbackComment}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status & Actions */}
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                                            {status.label}
                                        </span>
                                        {appt.status === AppointmentStatus.PENDIENTE && (
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => setCompletingVisit(appt)}
                                                    className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                    title="Completar visita"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onCancelAppointment(appt.id)}
                                                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                    title="Cancelar visita"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Visit Feedback Modal */}
            {completingVisit && (
                <VisitFeedbackModal
                    appointment={completingVisit}
                    clientName={getClient(completingVisit.clientId)?.name || ''}
                    propertyAddress={getProperty(completingVisit.propertyId)?.address || ''}
                    onClose={() => setCompletingVisit(null)}
                    onConfirm={(ir, pr, fc, com) => {
                        onCompleteVisit(completingVisit.id, ir, pr, fc, com);
                        setCompletingVisit(null);
                    }}
                />
            )}
        </div>
    );
};

export default AgendaView;
