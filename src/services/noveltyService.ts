import { supabase, dbManager } from '../lib/supabaseClient';
import { Novedad } from '../types/database';

export const noveltyService = {
  async getAll(): Promise<Novedad[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('novedades').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Novedad[];
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.getNovedades();
  },

  async create(novedad: Omit<Novedad, 'id' | 'organization_id' | 'created_at'>): Promise<Novedad> {
    if (supabase) {
      try {
        const org = dbManager.getOrganization();
        const { data, error } = await supabase.from('novedades').insert([{
          ...novedad,
          organization_id: org.id
        }]).select().single();
        if (!error && data) {
          return data as Novedad;
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.createNovedad(novedad);
  },

  async updateStatus(id: string, status: Novedad['status']): Promise<Novedad | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('novedades').update({ status }).eq('id', id).select().single();
        if (!error && data) {
          return data as Novedad;
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.updateNovedad(id, { status });
  }
};
