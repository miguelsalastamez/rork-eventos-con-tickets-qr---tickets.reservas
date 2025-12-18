import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { User, UserRole, Organization, Permission, FeatureLimits, SubscriptionTier } from '@/types';
import { supabase } from '@/lib/supabase';

const USER_STORAGE_KEY = '@eventpass_user';
const AUTH_TOKEN_STORAGE_KEY = '@eventpass_auth_token';
const ORGANIZATIONS_STORAGE_KEY = '@eventpass_organizations';
const SUBSCRIPTION_TIER_STORAGE_KEY = '@eventpass_subscription_tier';

const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  super_admin: {
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: true,
    canManageAttendees: true,
    canCheckInAttendees: true,
    canManagePrizes: true,
    canManageRaffle: true,
    canViewReports: true,
    canManageOrganization: true,
    canManageUsers: true,
    canManageSubscription: true,
    canSendMessages: true,
  },
  seller_admin: {
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: true,
    canManageAttendees: true,
    canCheckInAttendees: true,
    canManagePrizes: true,
    canManageRaffle: true,
    canViewReports: true,
    canManageOrganization: true,
    canManageUsers: true,
    canManageSubscription: true,
    canSendMessages: true,
  },
  collaborator: {
    canCreateEvents: false,
    canEditEvents: true,
    canDeleteEvents: false,
    canManageAttendees: true,
    canCheckInAttendees: true,
    canManagePrizes: true,
    canManageRaffle: true,
    canViewReports: true,
    canManageOrganization: false,
    canManageUsers: false,
    canManageSubscription: false,
    canSendMessages: true,
  },
  viewer: {
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    canManageAttendees: false,
    canCheckInAttendees: false,
    canManagePrizes: false,
    canManageRaffle: false,
    canViewReports: true,
    canManageOrganization: false,
    canManageUsers: false,
    canManageSubscription: false,
    canSendMessages: false,
  },
};

const TIER_LIMITS: Record<SubscriptionTier, FeatureLimits> = {
  free: {
    maxEvents: 1,
    maxAttendeesPerEvent: 50,
    hasEmailSupport: false,
    hasWhatsAppSupport: false,
    hasAdvancedReports: false,
    hasCustomBranding: false,
    hasPrioritySupport: false,
  },
  pro: {
    maxEvents: 999999,
    maxAttendeesPerEvent: 999999,
    hasEmailSupport: true,
    hasWhatsAppSupport: true,
    hasAdvancedReports: true,
    hasCustomBranding: true,
    hasPrioritySupport: true,
  },
};

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [storedUser, storedToken, storedOrgs, storedTier] = await Promise.all([
          AsyncStorage.getItem(USER_STORAGE_KEY),
          AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(ORGANIZATIONS_STORAGE_KEY),
          AsyncStorage.getItem(SUBSCRIPTION_TIER_STORAGE_KEY),
        ]);

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          console.log('No user found in AsyncStorage, creating demo user');
          const demoUser: User = {
            id: `user-${Date.now()}`,
            email: 'demo@example.com',
            fullName: 'Demo User',
            phone: undefined,
            role: 'seller_admin',
            organizationId: undefined,
            createdAt: new Date().toISOString(),
          };
          
          try {
            await supabase
              .from('User')
              .upsert({
                id: demoUser.id,
                email: demoUser.email,
                password: 'placeholder',
                fullName: demoUser.fullName,
                phone: demoUser.phone,
                role: demoUser.role,
                organizationId: demoUser.organizationId,
                createdAt: demoUser.createdAt,
              });
            console.log('✅ User saved to Supabase:', demoUser.id);
          } catch (error) {
            console.error('❌ Error syncing user to Supabase:', error);
          }

          setUser(demoUser);
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(demoUser));
        }
        if (storedToken) setAuthToken(storedToken);
        if (storedOrgs) setOrganizations(JSON.parse(storedOrgs));
        if (storedTier) setSubscriptionTier(storedTier as SubscriptionTier);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const saveUser = useCallback(async (userData: User, token?: string) => {
    try {
      const { error } = await supabase
        .from('User')
        .upsert({
          id: userData.id,
          email: userData.email,
          password: 'placeholder',
          fullName: userData.fullName,
          phone: userData.phone,
          role: userData.role,
          organizationId: userData.organizationId,
          createdAt: userData.createdAt,
        });

      if (error) {
        console.error('❌ Error saving user to Supabase:', error);
      } else {
        console.log('✅ User saved to Supabase:', userData.id);
      }
    } catch (error) {
      console.error('❌ Error syncing user to Supabase:', error);
    }

    setUser(userData);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    
    if (token) {
      setAuthToken(token);
      await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setAuthToken(null);
    await Promise.all([
      AsyncStorage.removeItem(USER_STORAGE_KEY),
      AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY),
    ]);
  }, []);

  const createDemoUser = useCallback(async (role: UserRole = 'seller_admin', organizationId?: string): Promise<User> => {
    console.log('🔨 Creating demo user with role:', role);
    const demoUser: User = {
      id: `user-${Date.now()}`,
      email: 'demo@example.com',
      fullName: 'Demo User',
      phone: undefined,
      role,
      organizationId,
      createdAt: new Date().toISOString(),
    };
    
    try {
      await supabase
        .from('User')
        .upsert({
          id: demoUser.id,
          email: demoUser.email,
          password: 'placeholder',
          fullName: demoUser.fullName,
          phone: demoUser.phone,
          role: demoUser.role,
          organizationId: demoUser.organizationId,
          createdAt: demoUser.createdAt,
        });
      console.log('✅ User saved to Supabase:', demoUser.id);
    } catch (error) {
      console.error('❌ Error syncing user to Supabase:', error);
    }

    setUser(demoUser);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(demoUser));
    console.log('✅ Demo user created:', demoUser.id);
    return demoUser;
  }, []);

  const setUserRole = useCallback(async (role: UserRole) => {
    if (!user) {
      console.log('No user found, creating demo user with role:', role);
      const demoUser = await createDemoUser(role);
      return demoUser;
    }
    
    const updatedUser = { ...user, role };
    await saveUser(updatedUser);
    console.log('✅ User role updated to:', role);
    return updatedUser;
  }, [user, createDemoUser, saveUser]);

  const addOrganization = useCallback(async (org: Organization) => {
    const updated = [...organizations, org];
    setOrganizations(updated);
    await AsyncStorage.setItem(ORGANIZATIONS_STORAGE_KEY, JSON.stringify(updated));
  }, [organizations]);

  const updateOrganization = useCallback(async (orgId: string, updates: Partial<Organization>) => {
    const updated = organizations.map((o) => (o.id === orgId ? { ...o, ...updates } : o));
    setOrganizations(updated);
    await AsyncStorage.setItem(ORGANIZATIONS_STORAGE_KEY, JSON.stringify(updated));
  }, [organizations]);

  const deleteOrganization = useCallback(async (orgId: string) => {
    const updated = organizations.filter((o) => o.id !== orgId);
    setOrganizations(updated);
    await AsyncStorage.setItem(ORGANIZATIONS_STORAGE_KEY, JSON.stringify(updated));
  }, [organizations]);

  const updateSubscriptionTier = useCallback(async (tier: SubscriptionTier) => {
    setSubscriptionTier(tier);
    await AsyncStorage.setItem(SUBSCRIPTION_TIER_STORAGE_KEY, tier);
  }, []);

  const permissions = useMemo<Permission>(() => {
    if (!user) {
      return ROLE_PERMISSIONS.viewer;
    }
    return ROLE_PERMISSIONS[user.role];
  }, [user]);

  const featureLimits = useMemo<FeatureLimits>(() => {
    return TIER_LIMITS[subscriptionTier];
  }, [subscriptionTier]);

  const currentOrganization = useMemo(() => {
    if (!user?.organizationId) return null;
    return organizations.find((o) => o.id === user.organizationId) || null;
  }, [user, organizations]);

  const canAccessFeature = useCallback((feature: keyof FeatureLimits): boolean => {
    return featureLimits[feature] as boolean;
  }, [featureLimits]);

  return useMemo(() => ({
    user,
    authToken,
    organizations,
    currentOrganization,
    isLoading,
    permissions,
    featureLimits,
    subscriptionTier,
    setUserRole,
    createDemoUser,
    saveUser,
    logout,
    addOrganization,
    updateOrganization,
    deleteOrganization,
    updateSubscriptionTier,
    canAccessFeature,
  }), [user, authToken, organizations, currentOrganization, isLoading, permissions, featureLimits, subscriptionTier, setUserRole, createDemoUser, saveUser, logout, addOrganization, updateOrganization, deleteOrganization, updateSubscriptionTier, canAccessFeature]);
});
