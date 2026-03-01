import React, { useState } from 'react';
import { X, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import {
    exportProperties,
    exportClients,
    exportAppointments,
    exportTenants,
    exportPayments,
    exportProfessionals,
} from '../services/exportService';
import { toast } from 'sonner';

interface ExportModalProps {
    onClose: () => void;
}

type DataType = 'properties' | 'clients' | 'appointments' | 'tenants' | 'payments' | 'professionals';
type ExportFormat = 'csv' | 'json';

const dataTypeLabels: Record<DataType, string> = {
    properties: 'Propiedades',
    clients: 'Clientes',
    appointments: 'Visitas',
    tenants: 'Inquilinos',
    payments: 'Pagos',
    professionals: 'Profesionales',
};

const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
    const { properties, clients, appointments, tenants, payments, professionals } = useDataContext();
    const [selectedTypes, setSelectedTypes] = useState<Set<DataType>>(new Set(['properties']));
    const [format, setFormat] = useState<ExportFormat>('csv');

    const toggleType = (type: DataType) => {
        setSelectedTypes(prev => {
            const next = new Set(prev);
            if (next.has(type)) next.delete(type);
            else next.add(type);
            return next;
        });
    };

    const handleExport = () => {
        if (selectedTypes.size === 0) {
            toast.error('Seleccioná al menos un tipo de dato.');
            return;
        }

        let exported = 0;
        if (selectedTypes.has('properties')) { exportProperties(properties, format); exported++; }
        if (selectedTypes.has('clients')) { exportClients(clients, format); exported++; }
        if (selectedTypes.has('appointments')) { exportAppointments(appointments, format); exported++; }
        if (selectedTypes.has('tenants')) { exportTenants(tenants, format); exported++; }
        if (selectedTypes.has('payments')) { exportPayments(payments, format); exported++; }
        if (selectedTypes.has('professionals')) { exportProfessionals(professionals, format); exported++; }

        toast.success(`${exported} archivo(s) exportado(s) en ${format.toUpperCase()}`);
        onClose();
    };

    const selectAll = () => {
        setSelectedTypes(new Set(Object.keys(dataTypeLabels) as DataType[]));
    };

    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Download className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Exportar Datos</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Data Selection */}
                <div className="p-6 space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Datos a exportar</label>
                            <button onClick={selectAll} className="text-xs text-indigo-600 font-semibold hover:underline">
                                Seleccionar todos
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.entries(dataTypeLabels) as [DataType, string][]).map(([type, label]) => (
                                <button
                                    key={type}
                                    onClick={() => toggleType(type)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${selectedTypes.has(type)
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Formato</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFormat('csv')}
                                className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all ${format === 'csv'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                <FileSpreadsheet className="w-4 h-4" /> CSV
                            </button>
                            <button
                                onClick={() => setFormat('json')}
                                className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all ${format === 'json'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                <FileJson className="w-4 h-4" /> JSON
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={selectedTypes.size === 0}
                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Exportar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
