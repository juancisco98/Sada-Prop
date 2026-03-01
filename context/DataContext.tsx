import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property, Professional, MaintenanceTask, Building, Tenant, TenantPayment, Client, Appointment } from '../types';
import { supabase } from '../services/supabaseClient';
import {
    dbToBuilding, dbToProperty,
    dbToProfessional,
    dbToTask,
    dbToTenant,
    dbToPayment,
    dbToClient,
    dbToAppointment
} from '../utils/mappers';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

interface DataContextType {
    properties: Property[];
    setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
    professionals: Professional[];
    setProfessionals: React.Dispatch<React.SetStateAction<Professional[]>>;
    maintenanceTasks: MaintenanceTask[];
    setMaintenanceTasks: React.Dispatch<React.SetStateAction<MaintenanceTask[]>>;
    buildings: Building[];
    setBuildings: React.Dispatch<React.SetStateAction<Building[]>>;
    tenants: Tenant[];
    setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
    payments: TenantPayment[];
    setPayments: React.Dispatch<React.SetStateAction<TenantPayment[]>>;
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    appointments: Appointment[];
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
    isLoading: boolean;
    refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [payments, setPayments] = useState<TenantPayment[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [
                prosResult,
                propsResult,
                tasksResult,
                buildingsResult,
                tenantsResult,
                paymentsResult,
                clientsResult,
                appointmentsResult
            ] = await Promise.all([
                supabase.from('professionals').select('*').order('created_at', { ascending: true }),
                supabase.from('properties').select('*').order('created_at', { ascending: true }),
                supabase.from('maintenance_tasks').select('*').order('created_at', { ascending: true }),
                supabase.from('buildings').select('*').order('created_at', { ascending: true }),
                supabase.from('tenants').select('*').order('created_at', { ascending: true }),
                supabase.from('tenant_payments').select('*').order('created_at', { ascending: true }),
                supabase.from('clients').select('*').order('created_at', { ascending: true }),
                supabase.from('appointments').select('*').order('created_at', { ascending: true })
            ]);

            if (prosResult.error) throw prosResult.error;
            if (propsResult.error) throw propsResult.error;
            if (tasksResult.error) throw tasksResult.error;
            if (buildingsResult.error) throw buildingsResult.error;
            if (tenantsResult.error) throw tenantsResult.error;
            if (paymentsResult.error) throw paymentsResult.error;
            if (clientsResult.error) throw clientsResult.error;
            if (appointmentsResult.error) throw appointmentsResult.error;

            if (prosResult.data) setProfessionals(prosResult.data.map(dbToProfessional));
            if (propsResult.data) setProperties(propsResult.data.map(dbToProperty));
            if (tasksResult.data) setMaintenanceTasks(tasksResult.data.map(dbToTask));
            if (buildingsResult.data) setBuildings(buildingsResult.data.map(dbToBuilding));
            if (tenantsResult.data) setTenants(tenantsResult.data.map(dbToTenant));
            if (paymentsResult.data) setPayments(paymentsResult.data.map(dbToPayment));
            if (clientsResult.data) setClients(clientsResult.data.map(dbToClient));
            if (appointmentsResult.data) setAppointments(appointmentsResult.data.map(dbToAppointment));

            logger.log('[Supabase] All data loaded.');

        } catch (error) {
            handleError(error, 'Error al cargar los datos. Por favor recargue la página.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <DataContext.Provider value={{
            properties, setProperties,
            professionals, setProfessionals,
            maintenanceTasks, setMaintenanceTasks,
            buildings, setBuildings,
            tenants, setTenants,
            payments, setPayments,
            clients, setClients,
            appointments, setAppointments,
            isLoading,
            refreshData: loadData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useDataContext = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
};
