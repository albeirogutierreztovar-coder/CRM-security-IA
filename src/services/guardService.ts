import { supabase, dbManager } from '../lib/supabaseClient';
import { Guard } from '../types/database';

export const guardService = {
  async getAll(): Promise<Guard[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('guards').select('*');
        if (!error && data && data.length > 0) {
          return data as Guard[];
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.getGuards();
  },

  async create(guard: Omit<Guard, 'id' | 'organization_id' | 'created_at'>): Promise<Guard> {
    if (supabase) {
      try {
        const org = dbManager.getOrganization();
        const { data, error } = await supabase.from('guards').insert([{
          ...guard,
          organization_id: org.id
        }]).select().single();
        if (!error && data) {
          return data as Guard;
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.createGuard(guard);
  },

  async update(id: string, updates: Partial<Guard>): Promise<Guard | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('guards').update(updates).eq('id', id).select().single();
        if (!error && data) {
          return data as Guard;
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.updateGuard(id, updates);
  },

  async delete(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.from('guards').delete().eq('id', id);
        if (!error) return true;
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.deleteGuard(id);
  }
};
