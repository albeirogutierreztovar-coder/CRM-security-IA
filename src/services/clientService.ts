import { supabase, dbManager } from '../lib/supabaseClient';
import { Client } from '../types/database';

export const clientService = {
  async getAll(): Promise<Client[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('clients').select('*');
        if (!error && data && data.length > 0) {
          return data as Client[];
        }
      } catch (e) {
        // Fallback to reactive dbManager
      }
    }
    return dbManager.getClients();
  },

  async create(client: Omit<Client, 'id' | 'organization_id' | 'created_at'>): Promise<Client> {
    if (supabase) {
      try {
        const org = dbManager.getOrganization();
        const { data, error } = await supabase.from('clients').insert([{
          ...client,
          organization_id: org.id
        }]).select().single();
        if (!error && data) {
          return data as Client;
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.createClient(client);
  },

  async update(id: string, updates: Partial<Client>): Promise<Client | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single();
        if (!error && data) {
          return data as Client;
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.updateClient(id, updates);
  },

  async delete(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (!error) return true;
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.deleteClient(id);
  }
};
