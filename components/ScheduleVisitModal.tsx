import React, { useState } from 'react';
import { Calendar, X, MapPin, User, Clock, Briefcase } from 'lucide-react';
import { Client, Property, Professional, Appointment, AppointmentStatus } from '../types';

interface ScheduleVisitModalProps {
    clients: Client[];
    properties: Property[];
    professionals: Professional[];
    preSelectedProperty?: Property | null;
    preSelectedClient?: Client | null;
    onClose: () => void;
    onSave: (appointment: Appointment) => void;
}

const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
    clients,
    properties,
    professionals,
    preSelectedProperty,
    preSelectedClient,
    onClose,
    onSave
}) => {
    const [clientId, setClientId] = useState(preSelectedClient?.id || '');
    const [propertyId, setPropertyId] = useState(preSelectedProperty?.id || '');
    const [professionalId, setProfessionalId] = useState('');
    const [fechaHora, setFechaHora] = useState('');
    const [duration, setDuration] = useState(30);
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        if (!clientId || !propertyId || !fechaHora) {
            alert('Por favor complete los campos obligatorios: Cliente, Propiedad y Fecha/Hora.');
            return;
        }

        const appointment: Appointment = {
            id: `appt-${Date.now()}`,
            clientId,
            propertyId,
            professionalId: professionalId || undefined,
            fechaHora: new Date(fechaHora).toISOString(),
            duration,
            status: AppointmentStatus.PENDIENTE,
            comentariosPostVisita: notes || undefined,
        };

        onSave(appointment);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
                            <Calendar className="w-6 h-6" /> Agendar Visita
                        </h2>
                        <p className="text-sm text-indigo-600 mt-1">Programar una nueva visita a propiedad</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-700 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Client Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> Cliente *
                        </label>
                        <select
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                            ))}
                        </select>
                    </div>

                    {/* Property Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> Propiedad *
                        </label>
                        <select
                            value={propertyId}
                            onChange={(e) => setPropertyId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                        >
                            <option value="">Seleccionar propiedad...</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.address}{p.unitLabel ? ` — ${p.unitLabel}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Professional Selector (Optional) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" /> Profesional (opcional)
                        </label>
                        <select
                            value={professionalId}
                            onChange={(e) => setProfessionalId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                        >
                            <option value="">Sin profesional asignado</option>
                            {professionals.map(pro => (
                                <option key={pro.id} value={pro.id}>{pro.name} — {pro.profession}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Fecha y Hora *
                        </label>
                        <input
                            type="datetime-local"
                            value={fechaHora}
                            onChange={(e) => setFechaHora(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                        />
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Duración
                        </label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                        >
                            <option value={15}>15 minutos</option>
                            <option value={30}>30 minutos</option>
                            <option value={45}>45 minutos</option>
                            <option value={60}>1 hora</option>
                        </select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notas</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 resize-none h-20"
                            placeholder="Indicaciones para la visita..."
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold text-lg hover:bg-gray-800 shadow-xl transition-all active:scale-[0.98]"
                    >
                        Agendar Visita
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleVisitModal;
