import { supabase, dbManager } from '../lib/supabaseClient';
import { Incident } from '../types/database';

export const incidentService = {
  async getAll(): Promise<Incident[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('incidents').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Incident[];
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.getIncidents();
  },

  async create(incident: Omit<Incident, 'id' | 'organization_id' | 'created_at'>): Promise<Incident> {
    if (supabase) {
      try {
        const org = dbManager.getOrganization();
        const { data, error } = await supabase.from('incidents').insert([{
          ...incident,
          organization_id: org.id
        }]).select().single();
        if (!error && data) {
          return data as Incident;
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.createIncident(incident);
  },

  async updateStatus(id: string, status: Incident['status']): Promise<Incident | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('incidents').update({ status }).eq('id', id).select().single();
        if (!error && data) {
          return data as Incident;
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.updateIncident(id, { status });
  }
};
