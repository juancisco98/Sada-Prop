import type { Property, Professional, Client, Appointment, Tenant, TenantPayment } from '../types';

type ExportFormat = 'csv' | 'json';

interface ColumnConfig<T> {
    key: keyof T;
    label: string;
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function exportAsJson(data: unknown[], filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${filename}.json`);
}

function exportAsCsv<T extends Record<string, unknown>>(
    data: T[],
    columns: ColumnConfig<T>[],
    filename: string
): void {
    const header = columns.map(c => c.label).join(',');
    const rows = data.map(row =>
        columns.map(c => {
            const val = row[c.key];
            const str = val === null || val === undefined ? '' : String(val);
            return str.includes(',') || str.includes('\n') || str.includes('"')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
}

// --- Pre-configured exports for each entity ---

export function exportProperties(properties: Property[], format: ExportFormat): void {
    const columns: ColumnConfig<Property>[] = [
        { key: 'address', label: 'Dirección' },
        { key: 'tenantName', label: 'Inquilino' },
        { key: 'tenantPhone', label: 'Teléfono Inquilino' },
        { key: 'status', label: 'Estado' },
        { key: 'monthlyRent', label: 'Alquiler Mensual' },
        { key: 'rooms', label: 'Ambientes' },
        { key: 'squareMeters', label: 'm²' },
        { key: 'propertyType', label: 'Tipo' },
        { key: 'publicationStatus', label: 'Estado Publicación' },
        { key: 'keyLocation', label: 'Ubicación Llaves' },
        { key: 'contractEnd', label: 'Fin Contrato' },
        { key: 'country', label: 'País' },
        { key: 'currency', label: 'Moneda' },
        { key: 'notes', label: 'Notas' },
    ];
    if (format === 'json') exportAsJson(properties, 'propiedades');
    else exportAsCsv(properties as unknown as Record<string, unknown>[], columns as ColumnConfig<Record<string, unknown>>[], 'propiedades');
}

export function exportClients(clients: Client[], format: ExportFormat): void {
    const columns: ColumnConfig<Client>[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'phone', label: 'Teléfono' },
        { key: 'email', label: 'Email' },
        { key: 'budget', label: 'Presupuesto' },
        { key: 'searchType', label: 'Busca' },
        { key: 'propertyTypeSought', label: 'Tipo Buscado' },
        { key: 'notes', label: 'Notas' },
    ];
    if (format === 'json') exportAsJson(clients, 'clientes');
    else exportAsCsv(clients as unknown as Record<string, unknown>[], columns as ColumnConfig<Record<string, unknown>>[], 'clientes');
}

export function exportAppointments(appointments: Appointment[], format: ExportFormat): void {
    const columns: ColumnConfig<Appointment>[] = [
        { key: 'fechaHora', label: 'Fecha y Hora' },
        { key: 'clientId', label: 'ID Cliente' },
        { key: 'propertyId', label: 'ID Propiedad' },
        { key: 'duration', label: 'Duración (min)' },
        { key: 'status', label: 'Estado' },
        { key: 'interestRating', label: 'Interés (1-5)' },
        { key: 'priceRating', label: 'Precio (1-5)' },
        { key: 'feedbackComment', label: 'Feedback' },
        { key: 'comentariosPostVisita', label: 'Comentarios' },
    ];
    if (format === 'json') exportAsJson(appointments, 'visitas');
    else exportAsCsv(appointments as unknown as Record<string, unknown>[], columns as ColumnConfig<Record<string, unknown>>[], 'visitas');
}

export function exportTenants(tenants: Tenant[], format: ExportFormat): void {
    const columns: ColumnConfig<Tenant>[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'phone', label: 'Teléfono' },
        { key: 'email', label: 'Email' },
        { key: 'propertyId', label: 'ID Propiedad' },
    ];
    if (format === 'json') exportAsJson(tenants, 'inquilinos');
    else exportAsCsv(tenants as unknown as Record<string, unknown>[], columns as ColumnConfig<Record<string, unknown>>[], 'inquilinos');
}

export function exportPayments(payments: TenantPayment[], format: ExportFormat): void {
    const columns: ColumnConfig<TenantPayment>[] = [
        { key: 'tenantId', label: 'ID Inquilino' },
        { key: 'amount', label: 'Monto' },
        { key: 'currency', label: 'Moneda' },
        { key: 'month', label: 'Mes' },
        { key: 'year', label: 'Año' },
        { key: 'paidOnTime', label: 'A Tiempo' },
        { key: 'paymentDate', label: 'Fecha Pago' },
        { key: 'paymentMethod', label: 'Método' },
        { key: 'notes', label: 'Notas' },
    ];
    if (format === 'json') exportAsJson(payments, 'pagos');
    else exportAsCsv(payments as unknown as Record<string, unknown>[], columns as ColumnConfig<Record<string, unknown>>[], 'pagos');
}

export function exportProfessionals(professionals: Professional[], format: ExportFormat): void {
    const columns: ColumnConfig<Professional>[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'profession', label: 'Profesión' },
        { key: 'rating', label: 'Calificación' },
        { key: 'speedRating', label: 'Rapidez' },
        { key: 'zone', label: 'Zona' },
        { key: 'phone', label: 'Teléfono' },
    ];
    if (format === 'json') exportAsJson(professionals, 'profesionales');
    else exportAsCsv(professionals as unknown as Record<string, unknown>[], columns as ColumnConfig<Record<string, unknown>>[], 'profesionales');
}
