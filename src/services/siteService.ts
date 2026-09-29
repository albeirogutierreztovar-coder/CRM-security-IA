import { supabase, dbManager } from '../lib/supabaseClient';
import { SecuritySite } from '../types/database';

export const siteService = {
  async getAll(): Promise<SecuritySite[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('security_sites').select('*');
        if (!error && data && data.length > 0) {
          return data as SecuritySite[];
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.getSites();
  },

  async create(site: Omit<SecuritySite, 'id' | 'organization_id' | 'created_at'>): Promise<SecuritySite> {
    if (supabase) {
      try {
        const org = dbManager.getOrganization();
        const { data, error } = await supabase.from('security_sites').insert([{
          ...site,
          organization_id: org.id
        }]).select().single();
        if (!error && data) {
          return data as SecuritySite;
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.createSite(site);
  },

  async update(id: string, updates: Partial<SecuritySite>): Promise<SecuritySite | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('security_sites').update(updates).eq('id', id).select().single();
        if (!error && data) {
          return data as SecuritySite;
        }
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.updateSite(id, updates);
  },

  async delete(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.from('security_sites').delete().eq('id', id);
        if (!error) return true;
      } catch (e) {
        // Fallback
      }
    }
    return dbManager.deleteSite(id);
  }
};
