import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Home, 
  Search, 
  Bell, 
  ShoppingBag, 
  Calendar, 
  MessageCircle, 
  Heart, 
  Settings, 
  User, 
  LogOut,
  ChevronRight,
  Shield,
  CreditCard,
  HelpCircle,
  Tag,
  Building2,
  Users,
  TrendingUp
} from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  badge?: string | number;
  showArrow?: boolean;
  color?: string;
}

function MenuItem({ icon, label, onPress, badge, showArrow = true, color = '#111827' }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={[styles.menuItemLabel, { color }]}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {showArrow && <ChevronRight color="#9ca3af" size={20} />}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, permissions } = useUser();

  const userEvents: any[] = [];
  const purchaseCount = 0;
  const unreadMessages = 0;

  const handleLogout = () => {
    router.replace('/');
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.notLoggedIn}>
          <User color="#9ca3af" size={64} />
          <Text style={styles.notLoggedInTitle}>No has iniciado sesión</Text>
          <Text style={styles.notLoggedInText}>
            Inicia sesión para acceder a tu perfil y gestionar tu cuenta
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/admin/test-users' as any)}
          >
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User color="#6366f1" size={40} />
              </View>
            </View>
            <Text style={styles.userName}>{user.fullName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.roleContainer}>
              <Shield size={14} color="#fff" />
              <Text style={styles.roleText}>
                {user.role === 'super_admin' ? 'Super Admin' : 
                 user.role === 'seller_admin' ? 'Administrador' : 
                 user.role === 'collaborator' ? 'Colaborador' : 'Visitante'}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <MenuItem
            icon={<Home color="#6366f1" size={22} />}
            label="Inicio"
            onPress={() => router.push('/' as any)}
          />
          
          <MenuItem
            icon={<Search color="#6366f1" size={22} />}
            label="Buscar eventos"
            onPress={() => router.push('/' as any)}
          />
          
          <MenuItem
            icon={<Bell color="#6366f1" size={22} />}
            label="Notificaciones"
            onPress={() => {}}
            badge={0}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compras</Text>
          
          <MenuItem
            icon={<ShoppingBag color="#10b981" size={22} />}
            label="Mis tickets"
            onPress={() => router.push('/profile/my-purchases' as any)}
            badge={purchaseCount > 0 ? purchaseCount : undefined}
          />
          
          <MenuItem
            icon={<Heart color="#ef4444" size={22} />}
            label="Favoritos"
            onPress={() => {}}
          />
          
          <MenuItem
            icon={<Tag color="#f59e0b" size={22} />}
            label="Cupones"
            onPress={() => {}}
          />
        </View>

        {(permissions.canCreateEvents || permissions.canEditEvents) && (
          <>
            <View style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gestión de eventos</Text>
              
              <MenuItem
                icon={<Calendar color="#8b5cf6" size={22} />}
                label="Mis eventos"
                onPress={() => router.push('/' as any)}
                badge={userEvents.length > 0 ? userEvents.length : undefined}
              />
              
              {permissions.canSendMessages && (
                <MenuItem
                  icon={<MessageCircle color="#06b6d4" size={22} />}
                  label="Mensajes"
                  onPress={() => {}}
                  badge={unreadMessages > 0 ? unreadMessages : undefined}
                />
              )}
              
              {permissions.canManageOrganization && (
                <MenuItem
                  icon={<Building2 color="#6366f1" size={22} />}
                  label="Mi organización"
                  onPress={() => router.push('/admin/organizations' as any)}
                />
              )}
              
              {user.role === 'super_admin' && (
                <MenuItem
                  icon={<Users color="#6366f1" size={22} />}
                  label="Usuarios"
                  onPress={() => router.push('/admin' as any)}
                />
              )}
              
              {permissions.canManageSubscription && (
                <MenuItem
                  icon={<TrendingUp color="#10b981" size={22} />}
                  label="Suscripción"
                  onPress={() => router.push('/subscription' as any)}
                />
              )}
            </View>
          </>
        )}

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          
          <MenuItem
            icon={<User color="#6b7280" size={22} />}
            label="Mi cuenta"
            onPress={() => router.push('/profile/account' as any)}
          />
          
          <MenuItem
            icon={<Shield color="#6b7280" size={22} />}
            label="Seguridad y privacidad"
            onPress={() => router.push('/profile/security' as any)}
          />
          
          <MenuItem
            icon={<CreditCard color="#6b7280" size={22} />}
            label="Métodos de pago"
            onPress={() => router.push('/profile/payment-methods' as any)}
          />
          
          <MenuItem
            icon={<Settings color="#6b7280" size={22} />}
            label="Configuración"
            onPress={() => router.push('/settings' as any)}
          />
          
          <MenuItem
            icon={<HelpCircle color="#6b7280" size={22} />}
            label="Ayuda y soporte"
            onPress={() => {}}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <MenuItem
            icon={<LogOut color="#ef4444" size={22} />}
            label="Cerrar sesión"
            onPress={handleLogout}
            showArrow={false}
            color="#ef4444"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>EventPass v1.0.0</Text>
          <Text style={styles.footerText}>© 2025 Todos los derechos reservados</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingBottom: 32,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    flex: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  divider: {
    height: 8,
    backgroundColor: '#f3f4f6',
  },
  notLoggedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  notLoggedInText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 4,
  },
});
