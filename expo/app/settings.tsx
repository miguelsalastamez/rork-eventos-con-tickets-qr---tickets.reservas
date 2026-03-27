import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Volume2, VolumeX, Vibrate, CheckCircle2, Play, Database, AlertCircle, Users, ChevronDown, ChevronUp, Check, XCircle } from 'lucide-react-native';
import { useSettings, SUCCESS_SOUNDS, ERROR_SOUNDS, SoundOption } from '@/contexts/SettingsContext';
import { useUser } from '@/contexts/UserContext';
import { UserRole } from '@/types';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    settings,
    updateSuccessSound,
    updateErrorSound,
    toggleVibration,
    getSuccessSound,
    getErrorSound,
  } = useSettings();

  const { user, setUserRole } = useUser();

  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [expandedRole, setExpandedRole] = useState<UserRole | null>(null);

  const playSound = async (soundUrl: string, soundId: string) => {
    if (Platform.OS === 'web') return;

    setPlayingSound(soundId);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUrl },
        { shouldPlay: true }
      );
      
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          setPlayingSound(null);
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
      setPlayingSound(null);
    }
  };

  const testVibration = () => {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const selectedSuccessSound = getSuccessSound();
  const selectedErrorSound = getErrorSound();

  const getRolePermissions = (role: UserRole) => {
    const ROLE_PERMISSIONS_MAP: Record<UserRole, any> = {
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
    return ROLE_PERMISSIONS_MAP[role];
  };

  const getPermissionLabel = (key: string) => {
    const labels: Record<string, string> = {
      canCreateEvents: 'Crear eventos',
      canEditEvents: 'Editar eventos',
      canDeleteEvents: 'Eliminar eventos',
      canManageAttendees: 'Gestionar asistentes',
      canCheckInAttendees: 'Registrar accesos',
      canManagePrizes: 'Gestionar premios',
      canManageRaffle: 'Realizar sorteos',
      canViewReports: 'Ver reportes',
      canManageOrganization: 'Gestionar organización',
      canManageUsers: 'Gestionar usuarios',
      canManageSubscription: 'Gestionar suscripción',
      canSendMessages: 'Enviar mensajes',
    };
    return labels[key] || key;
  };

  const renderSoundOption = (
    sound: SoundOption,
    isSelected: boolean,
    onSelect: (id: string) => void,
    type: 'success' | 'error'
  ) => (
    <TouchableOpacity
      key={sound.id}
      style={[styles.soundOption, isSelected && styles.soundOptionSelected]}
      onPress={() => onSelect(sound.id)}
      activeOpacity={0.7}
    >
      <View style={styles.soundOptionContent}>
        <View style={styles.soundOptionLeft}>
          {isSelected ? (
            <CheckCircle2 color="#6366f1" size={24} />
          ) : (
            <View style={styles.soundOptionCircle} />
          )}
          <Text style={[styles.soundOptionText, isSelected && styles.soundOptionTextSelected]}>
            {sound.name}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => playSound(sound.url, sound.id)}
          disabled={playingSound === sound.id}
        >
          {playingSound === sound.id ? (
            <VolumeX color="#6366f1" size={20} />
          ) : (
            <Play color="#6366f1" size={20} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color="#111827" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configuración</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Volume2 color="#6366f1" size={24} />
            <Text style={styles.sectionTitle}>Sonido de Validación Positiva</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Elige el sonido que se reproducirá cuando un código QR sea válido
          </Text>
          <View style={styles.soundList}>
            {SUCCESS_SOUNDS.map((sound) =>
              renderSoundOption(
                sound,
                sound.id === selectedSuccessSound.id,
                updateSuccessSound,
                'success'
              )
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <VolumeX color="#ef4444" size={24} />
            <Text style={styles.sectionTitle}>Sonido de Validación Negativa</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Elige el sonido que se reproducirá cuando un código QR sea inválido
          </Text>
          <View style={styles.soundList}>
            {ERROR_SOUNDS.map((sound) =>
              renderSoundOption(
                sound,
                sound.id === selectedErrorSound.id,
                updateErrorSound,
                'error'
              )
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Vibrate color="#6366f1" size={24} />
            <Text style={styles.sectionTitle}>Vibración</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Vibración intensa cuando el código QR sea válido
          </Text>
          <View style={styles.vibrationControl}>
            <TouchableOpacity
              style={[styles.vibrationToggle, settings.vibrationEnabled && styles.vibrationToggleActive]}
              onPress={toggleVibration}
              activeOpacity={0.7}
            >
              <View style={[styles.vibrationSwitch, settings.vibrationEnabled && styles.vibrationSwitchActive]} />
            </TouchableOpacity>
            <Text style={styles.vibrationText}>
              {settings.vibrationEnabled ? 'Activada' : 'Desactivada'}
            </Text>
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={styles.testButton}
                onPress={testVibration}
              >
                <Text style={styles.testButtonText}>Probar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database color="#f59e0b" size={24} />
            <Text style={styles.sectionTitle}>Backend y Notificaciones</Text>
          </View>
          <View style={styles.backendInfo}>
            <AlertCircle color="#f59e0b" size={20} />
            <Text style={styles.backendInfoText}>
              Para enviar notificaciones por email y WhatsApp, necesitas habilitar el backend de este proyecto.
            </Text>
          </View>
          <View style={styles.backendSteps}>
            <Text style={styles.backendStepTitle}>¿Cómo habilitarlo?</Text>
            <Text style={styles.backendStep}>1. Busca el menú &quot;Backend&quot; en la parte superior derecha de la interfaz web de Rork</Text>
            <Text style={styles.backendStep}>2. Haz clic para habilitar el backend</Text>
            <Text style={styles.backendStep}>3. Configura tu servidor SMTP para emails</Text>
            <Text style={styles.backendStep}>4. Configura tu cuenta de WhatsApp Business API</Text>
          </View>
          <View style={styles.backendNote}>
            <Text style={styles.backendNoteText}>
              💡 Una vez habilitado, podrás enviar mensajes de prueba desde la pantalla de Mensajería de cada evento.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users color="#6366f1" size={24} />
            <Text style={styles.sectionTitle}>Rol de Usuario (Demo)</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Cambia tu rol para probar diferentes niveles de acceso
          </Text>
          <View style={styles.rolesList}>
            {[
              { role: 'super_admin' as UserRole, name: 'Super Admin', description: 'Acceso total al sistema' },
              { role: 'seller_admin' as UserRole, name: 'Vendedor Admin', description: 'Gestiona tu tienda y eventos' },
              { role: 'collaborator' as UserRole, name: 'Colaborador', description: 'Ayuda a gestionar eventos' },
              { role: 'viewer' as UserRole, name: 'Invitado', description: 'Solo visualización' },
            ].map((roleOption) => {
              const isExpanded = expandedRole === roleOption.role;
              const rolePermissions = getRolePermissions(roleOption.role);
              
              return (
                <View key={roleOption.role} style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      user?.role === roleOption.role && styles.roleOptionActive,
                    ]}
                    onPress={async () => {
                      if (user?.role === roleOption.role) return;
                      
                      if (Platform.OS === 'web') {
                        const confirmed = window.confirm(`¿Deseas cambiar tu rol a ${roleOption.name}?`);
                        if (confirmed) {
                          try {
                            console.log('Changing role to:', roleOption.role);
                            await setUserRole(roleOption.role);
                            console.log('Role changed successfully');
                            window.alert(`✅ Rol Actualizado\n\nAhora eres ${roleOption.name}. Los cambios se aplicarán inmediatamente.`);
                          } catch (error) {
                            console.error('Error changing role:', error);
                            window.alert('Error: No se pudo cambiar el rol');
                          }
                        }
                      } else {
                        Alert.alert(
                          'Cambiar Rol',
                          `¿Deseas cambiar tu rol a ${roleOption.name}?`,
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                              text: 'Cambiar',
                              onPress: async () => {
                                try {
                                  console.log('Changing role to:', roleOption.role);
                                  await setUserRole(roleOption.role);
                                  console.log('Role changed successfully');
                                  Alert.alert(
                                    '✅ Rol Actualizado',
                                    `Ahora eres ${roleOption.name}. Los cambios se aplicarán inmediatamente.`
                                  );
                                } catch (error) {
                                  console.error('Error changing role:', error);
                                  Alert.alert('Error', 'No se pudo cambiar el rol');
                                }
                              },
                            },
                          ]
                        );
                      }
                    }}
                  >
                    <View style={styles.roleInfo}>
                      <View style={styles.roleHeader}>
                        <Text style={[
                          styles.roleName,
                          user?.role === roleOption.role && styles.roleNameActive,
                        ]}>
                          {roleOption.name}
                        </Text>
                        {user?.role === roleOption.role && (
                          <CheckCircle2 color="#6366f1" size={20} />
                        )}
                      </View>
                      <Text style={styles.roleDescription}>
                        {roleOption.description}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => setExpandedRole(isExpanded ? null : roleOption.role)}
                    >
                      {isExpanded ? (
                        <ChevronUp color="#6366f1" size={20} />
                      ) : (
                        <ChevronDown color="#6b7280" size={20} />
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.permissionsContainer}>
                      <Text style={styles.permissionsTitle}>Permisos de Acceso:</Text>
                      <View style={styles.permissionsList}>
                        {Object.entries(rolePermissions).map(([key, value]) => (
                          <View key={key} style={styles.permissionItem}>
                            {value ? (
                              <Check color="#10b981" size={16} />
                            ) : (
                              <XCircle color="#ef4444" size={16} />
                            )}
                            <Text style={[
                              styles.permissionText,
                              value ? styles.permissionAllowed : styles.permissionDenied
                            ]}>
                              {getPermissionLabel(key)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>EventPass v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Gestión profesional de eventos y accesos
          </Text>
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
  safeArea: {
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  soundList: {
    gap: 8,
  },
  soundOption: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  soundOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  soundOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  soundOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  soundOptionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  soundOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500' as const,
  },
  soundOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600' as const,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  vibrationControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vibrationToggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    padding: 2,
    justifyContent: 'center',
  },
  vibrationToggleActive: {
    backgroundColor: '#6366f1',
  },
  vibrationSwitch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  vibrationSwitchActive: {
    alignSelf: 'flex-end',
  },
  vibrationText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500' as const,
  },
  testButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    marginLeft: 'auto',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500' as const,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 4,
    textAlign: 'center',
  },
  backendInfo: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fcd34d',
    marginBottom: 16,
  },
  backendInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  backendSteps: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  backendStepTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 12,
  },
  backendStep: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 8,
  },
  backendNote: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 16,
  },
  backendNoteText: {
    fontSize: 14,
    color: '#4338ca',
    lineHeight: 20,
  },
  rolesList: {
    gap: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  roleOptionActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  roleNameActive: {
    color: '#6366f1',
  },
  roleDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  roleContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    padding: 8,
  },
  permissionsContainer: {
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 12,
  },
  permissionsList: {
    gap: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionText: {
    fontSize: 14,
    flex: 1,
  },
  permissionAllowed: {
    color: '#059669',
  },
  permissionDenied: {
    color: '#dc2626',
  },
});
