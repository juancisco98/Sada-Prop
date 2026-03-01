import React, { useState } from 'react';
import { Contact, Plus, Search, Trash2, Edit3, X, DollarSign, Home, Phone, Mail, FileText, MapPin, Calendar, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Client, Property, Appointment, AppointmentStatus, SearchType } from '../types';

interface ClientsViewProps {
    clients: Client[];
    properties: Property[];
    appointments: Appointment[];
    onSaveClient: (client: Client) => void;
    onDeleteClient: (clientId: string) => void;
    getMatchingProperties: (clientId: string) => Property[];
    onScheduleVisit: (clientId: string, propertyId: string) => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({
    clients,
    properties,
    appointments,
    onSaveClient,
    onDeleteClient,
    getMatchingProperties,
    onScheduleVisit,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [expandedClient, setExpandedClient] = useState<string | null>(null);
    const [deleteMode, setDeleteMode] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formBudget, setFormBudget] = useState('');
    const [formSearchType, setFormSearchType] = useState<SearchType | ''>('');
    const [formPropertyType, setFormPropertyType] = useState('');
    const [formNotes, setFormNotes] = useState('');

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openForm = (client?: Client) => {
        if (client) {
            setEditingClient(client);
            setFormName(client.name);
            setFormPhone(client.phone);
            setFormEmail(client.email);
            setFormBudget(client.budget?.toString() || '');
            setFormSearchType(client.searchType || '');
            setFormPropertyType(client.propertyTypeSought || '');
            setFormNotes(client.notes || '');
        } else {
            setEditingClient(null);
            setFormName('');
            setFormPhone('');
            setFormEmail('');
            setFormBudget('');
            setFormSearchType('');
            setFormPropertyType('');
            setFormNotes('');
        }
        setShowForm(true);
    };

    const handleSubmit = () => {
        if (!formName.trim()) {
            alert('El nombre es obligatorio.');
            return;
        }

        const client: Client = {
            id: editingClient?.id || `client-${Date.now()}`,
            name: formName.trim(),
            phone: formPhone.trim(),
            email: formEmail.trim(),
            budget: formBudget ? parseFloat(formBudget) : undefined,
            searchType: formSearchType as SearchType || undefined,
            propertyTypeSought: formPropertyType || undefined,
            notes: formNotes.trim() || undefined,
        };

        onSaveClient(client);
        setShowForm(false);
    };

    const getClientAppointments = (clientId: string) =>
        appointments.filter(a => a.clientId === clientId)
            .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));

    const getPropertyById = (id: string) => properties.find(p => p.id === id);

    const searchTypeLabels: Record<string, string> = {
        compra: 'Compra',
        alquiler: 'Alquiler',
    };

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Contact className="w-8 h-8 text-indigo-600" />
                    Clientes / Leads
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setDeleteMode(!deleteMode)}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border ${deleteMode
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => openForm()}
                        className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-[0.98] shadow-lg flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, teléfono o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                />
            </div>

            {/* Client List */}
            {filteredClients.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <Contact className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-400 mb-2">No hay clientes</h3>
                    <p className="text-gray-400 text-sm">Agregá tu primer cliente para empezar</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredClients.map(client => {
                        const isExpanded = expandedClient === client.id;
                        const clientAppts = getClientAppointments(client.id);
                        const matchingProps = getMatchingProperties(client.id);

                        return (
                            <div key={client.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                                {/* Client Header */}
                                <div
                                    className="p-5 cursor-pointer"
                                    onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-lg text-gray-900 truncate">{client.name}</h3>
                                                {client.searchType && (
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${client.searchType === 'compra'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {searchTypeLabels[client.searchType]}
                                                    </span>
                                                )}
                                                {client.budget && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
                                                        <DollarSign className="w-3 h-3" />
                                                        {client.budget.toLocaleString('es-AR')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                {client.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3.5 h-3.5" /> {client.phone}
                                                    </span>
                                                )}
                                                {client.email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3.5 h-3.5" /> {client.email}
                                                    </span>
                                                )}
                                                {client.propertyTypeSought && (
                                                    <span className="flex items-center gap-1">
                                                        <Home className="w-3.5 h-3.5" /> Busca: {client.propertyTypeSought}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {deleteMode && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteClient(client.id); }}
                                                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openForm(client); }}
                                                className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 p-5 space-y-5">
                                        {/* Notes */}
                                        {client.notes && (
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-1 text-gray-400">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-bold uppercase">Notas</span>
                                                </div>
                                                <p className="text-sm text-gray-700">{client.notes}</p>
                                            </div>
                                        )}

                                        {/* Matching Properties */}
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                Propiedades Compatibles ({matchingProps.length})
                                            </h4>
                                            {matchingProps.length === 0 ? (
                                                <p className="text-sm text-gray-400 italic">No hay propiedades que coincidan con el presupuesto</p>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {matchingProps.slice(0, 6).map(prop => (
                                                        <div key={prop.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-semibold text-gray-900 truncate">{prop.address}</p>
                                                                <p className="text-xs text-gray-500">${prop.monthlyRent.toLocaleString('es-AR')} /mes</p>
                                                            </div>
                                                            <button
                                                                onClick={() => onScheduleVisit(client.id, prop.id)}
                                                                className="ml-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors flex-shrink-0"
                                                            >
                                                                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                                                                Visitar
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Visit History */}
                                        {clientAppts.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    Historial de Visitas ({clientAppts.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {clientAppts.map(appt => {
                                                        const prop = getPropertyById(appt.propertyId);
                                                        const statusColor = appt.status === AppointmentStatus.REALIZADA
                                                            ? 'text-green-600 bg-green-50'
                                                            : appt.status === AppointmentStatus.CANCELADA
                                                                ? 'text-red-600 bg-red-50'
                                                                : 'text-yellow-600 bg-yellow-50';
                                                        return (
                                                            <div key={appt.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-semibold text-gray-900 truncate">{prop?.address || '—'}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {new Date(appt.fechaHora).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        {' — '}
                                                                        {new Date(appt.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                    {appt.interestRating && (
                                                                        <div className="flex items-center gap-1 mt-1">
                                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                                <Star key={s} className={`w-3 h-3 ${s <= (appt.interestRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                                                            ))}
                                                                            {appt.feedbackComment && (
                                                                                <span className="text-xs text-gray-400 ml-1 truncate">— {appt.feedbackComment}</span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${statusColor}`}>
                                                                    {appt.status === AppointmentStatus.REALIZADA ? 'Realizada' : appt.status === AppointmentStatus.CANCELADA ? 'Cancelada' : 'Pendiente'}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Client Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[1300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
                                <Contact className="w-6 h-6" />
                                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-700 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Nombre *</label>
                                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Nombre completo" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Teléfono</label>
                                    <input type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="+54 11..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                                    <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="email@ejemplo.com" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Presupuesto</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input type="number" value={formBudget} onChange={e => setFormBudget(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="0" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Tipo búsqueda</label>
                                    <select value={formSearchType} onChange={e => setFormSearchType(e.target.value as SearchType | '')}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Sin definir</option>
                                        <option value="compra">Compra</option>
                                        <option value="alquiler">Alquiler</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Tipo de propiedad buscada</label>
                                <input type="text" value={formPropertyType} onChange={e => setFormPropertyType(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="casa, edificio, local..." />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Notas</label>
                                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                                    placeholder="Notas adicionales sobre el cliente..." />
                            </div>

                            <button
                                onClick={handleSubmit}
                                className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold text-lg hover:bg-gray-800 shadow-xl transition-all active:scale-[0.98]"
                            >
                                {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientsView;
