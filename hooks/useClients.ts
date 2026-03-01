import { useDataContext } from '../context/DataContext';
import { Client } from '../types';
import { clientToDb } from '../utils/mappers';
import { supabaseUpsert, supabaseDelete } from '../utils/supabaseHelpers';

export const useClients = (currentUserId?: string) => {
    const { clients, setClients, properties } = useDataContext();

    const handleSaveClient = async (client: Client) => {
        const clientWithUser = { ...client, userId: currentUserId };
        setClients(prev => {
            const exists = prev.find(c => c.id === client.id);
            if (exists) return prev.map(c => c.id === client.id ? clientWithUser : c);
            return [...prev, clientWithUser];
        });
        await supabaseUpsert('clients', clientToDb(clientWithUser), `client ${client.name}`);
    };

    const handleDeleteClient = async (clientId: string) => {
        setClients(prev => prev.filter(c => c.id !== clientId));
        await supabaseDelete('clients', clientId, 'client');
    };

    const getMatchingProperties = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (!client || !client.budget) return properties;
        return properties.filter(p => {
            const matchesBudget = p.monthlyRent <= client.budget!;
            const matchesType = !client.propertyTypeSought ||
                client.propertyTypeSought.includes(p.propertyType);
            const isAvailable = !p.publicationStatus ||
                p.publicationStatus === 'DISPONIBLE';
            return matchesBudget && matchesType && isAvailable;
        });
    };

    return { clients, handleSaveClient, handleDeleteClient, getMatchingProperties };
};
