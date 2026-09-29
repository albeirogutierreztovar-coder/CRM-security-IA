import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { dbManager } from '../lib/supabaseClient';
import { Profile, Organization, UserRole } from '../types/database';
import { DEMO_PROFILES } from '../lib/mockData';

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  profile: Profile | null;
  organization: Organization | null;
  role: UserRole | null;
  loading: boolean;
  isDemoSession?: boolean;
}

export const authService = {
  // Check active Supabase Auth session or stored active session
  async getInitialSession(): Promise<AuthState> {
    const savedDemoProfileId = localStorage.getItem('securitycrm_active_profile_id');
    const isExplicitDemo = localStorage.getItem('securitycrm_is_demo_session') === 'true';

    if (isExplicitDemo && savedDemoProfileId) {
      const demoProfile = DEMO_PROFILES.find(p => p.id === savedDemoProfileId) || DEMO_PROFILES[0];
      const org = dbManager.getOrganization();
      dbManager.setCurrentProfile(demoProfile);
      return {
        isAuthenticated: true,
        user: { id: demoProfile.id, email: demoProfile.email },
        profile: demoProfile,
        organization: org,
        role: demoProfile.role,
        loading: false,
        isDemoSession: true
      };
    }

    if (supabase && isSupabaseConfigured) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && session.user && !error) {
          const profile = await this.getMyProfile(session.user.id, session.user.email);
          const org = await this.getMyOrganization(profile?.organization_id);
          if (profile) {
            dbManager.setCurrentProfile(profile);
          }
          return {
            isAuthenticated: true,
            user: session.user,
            profile: profile || dbManager.getCurrentProfile(),
            organization: org || dbManager.getOrganization(),
            role: profile ? profile.role : 'ADMIN_EMPRESA',
            loading: false,
            isDemoSession: false
          };
        }
      } catch (err) {
        console.warn('[AuthService] Error checking Supabase session:', err);
      }
    }

    // Check if user previously logged in
    const lastSession = localStorage.getItem('securitycrm_current_profile');
    if (lastSession) {
      try {
        const profile: Profile = JSON.parse(lastSession);
        return {
          isAuthenticated: true,
          user: { id: profile.id, email: profile.email },
          profile,
          organization: dbManager.getOrganization(),
          role: profile.role,
          loading: false,
          isDemoSession: true
        };
      } catch (e) {
        // invalid
      }
    }

    return {
      isAuthenticated: false,
      user: null,
      profile: null,
      organization: null,
      role: null,
      loading: false,
      isDemoSession: false
    };
  },

  // Real Supabase Auth login
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string; state?: AuthState }> {
    if (!supabase || !isSupabaseConfigured) {
      return { success: false, error: 'Cliente de Supabase no configurado' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        // If Supabase returns error, verify if it's invalid credentials
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'No se pudo obtener el usuario autenticado' };
      }

      // Step 2 & 3: Obtain profile & organization using get_my_profile() & get_my_organization()
      const profile = await this.getMyProfile(data.user.id, data.user.email);
      const org = await this.getMyOrganization(profile?.organization_id);

      const activeProfile: Profile = profile || {
        id: data.user.id,
        organization_id: org?.id || dbManager.getOrganization().id,
        full_name: data.user.user_metadata?.full_name || email.split('@')[0],
        email: email,
        phone: '+57 300 000 0000',
        role: (data.user.user_metadata?.role as UserRole) || 'ADMIN_EMPRESA',
        status: 'ACTIVO',
        created_at: new Date().toISOString()
      };

      dbManager.setCurrentProfile(activeProfile);
      localStorage.setItem('securitycrm_is_demo_session', 'false');

      return {
        success: true,
        state: {
          isAuthenticated: true,
          user: data.user,
          profile: activeProfile,
          organization: org || dbManager.getOrganization(),
          role: activeProfile.role,
          loading: false,
          isDemoSession: false
        }
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error inesperado al conectar con Supabase Auth' };
    }
  },

  // Real Supabase Auth Sign Up
  async signUp(
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; org_name?: string; role?: UserRole }
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean; state?: AuthState }> {
    if (!supabase || !isSupabaseConfigured) {
      return { success: false, error: 'Cliente de Supabase no configurado' };
    }

    try {
      const fullName = `${metadata.first_name} ${metadata.last_name}`.trim();
      const role: UserRole = metadata.role || 'ADMIN_EMPRESA';

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName,
            first_name: metadata.first_name,
            last_name: metadata.last_name,
            role: role,
            org_name: metadata.org_name || 'Seguridad Privada'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session && data.user) {
        // Auto confirmed
        const profile: Profile = {
          id: data.user.id,
          organization_id: dbManager.getOrganization().id,
          full_name: fullName,
          email: email,
          phone: '+57 300 000 0000',
          role: role,
          status: 'ACTIVO',
          created_at: new Date().toISOString()
        };
        dbManager.setCurrentProfile(profile);
        localStorage.setItem('securitycrm_is_demo_session', 'false');

        return {
          success: true,
          requiresEmailConfirmation: false,
          state: {
            isAuthenticated: true,
            user: data.user,
            profile,
            organization: dbManager.getOrganization(),
            role,
            loading: false,
            isDemoSession: false
          }
        };
      }

      return {
        success: true,
        requiresEmailConfirmation: true
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error inesperado al registrar usuario' };
    }
  },

  // Password Recovery via Supabase Auth
  async resetPassword(email: string): Promise<{ success: boolean; error?: string; message?: string }> {
    if (!supabase || !isSupabaseConfigured) {
      return { success: false, error: 'Cliente de Supabase no configurado' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: `Se ha enviado un enlace de recuperación al correo ${email}`
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al solicitar recuperación de contraseña' };
    }
  },

  // Sign in as demo profile directly
  loginAsDemoProfile(profileId: string): AuthState {
    const profile = DEMO_PROFILES.find(p => p.id === profileId) || DEMO_PROFILES[0];
    dbManager.setCurrentProfile(profile);
    localStorage.setItem('securitycrm_active_profile_id', profile.id);
    localStorage.setItem('securitycrm_is_demo_session', 'true');

    return {
      isAuthenticated: true,
      user: { id: profile.id, email: profile.email },
      profile,
      organization: dbManager.getOrganization(),
      role: profile.role,
      loading: false,
      isDemoSession: true
    };
  },

  // Supabase Auth get_my_profile() RPC
  async getMyProfile(userId?: string, email?: string): Promise<Profile | null> {
    if (!supabase) return null;
    try {
      // 1. Try RPC get_my_profile() as requested in prompt
      const { data: rpcProfile, error: rpcErr } = await supabase.rpc('get_my_profile');
      if (!rpcErr && rpcProfile) {
        return rpcProfile as Profile;
      }
    } catch (e) {
      // RPC may not exist or return error
    }

    // 2. Query profiles table
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          return data as Profile;
        }
      } catch (e) {
        // Query error fallback
      }
    }

    // 3. Fallback match by email or return default
    if (email) {
      const matched = DEMO_PROFILES.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (matched) return matched;
    }

    return null;
  },

  // Supabase Auth get_my_organization() RPC
  async getMyOrganization(orgId?: string): Promise<Organization | null> {
    if (!supabase) return null;
    try {
      // 1. Try RPC get_my_organization() as requested in prompt
      const { data: rpcOrg, error: rpcErr } = await supabase.rpc('get_my_organization');
      if (!rpcErr && rpcOrg) {
        return rpcOrg as Organization;
      }
    } catch (e) {
      // RPC may not exist or return error
    }

    // 2. Query organizations table
    try {
      let query = supabase.from('organizations').select('*');
      if (orgId) {
        query = query.eq('id', orgId);
      }
      const { data, error } = await query.limit(1).maybeSingle();
      if (!error && data) {
        return data as Organization;
      }
    } catch (e) {
      // ignore
    }

    return null;
  },

  // Sign out
  async signOut(): Promise<void> {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error signing out from Supabase Auth:', err);
      }
    }
    localStorage.removeItem('securitycrm_current_profile');
    localStorage.removeItem('securitycrm_active_profile_id');
    localStorage.removeItem('securitycrm_is_demo_session');
  }
};
