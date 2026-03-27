import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, Eye, EyeOff, Shield, Key } from 'lucide-react-native';

export default function SecurityScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Éxito', 'Tu contraseña ha sido actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar tu contraseña');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Shield color="#6366f1" size={32} />
          </View>
          <Text style={styles.headerTitle}>Seguridad y privacidad</Text>
          <Text style={styles.headerSubtitle}>
            Mantén tu cuenta segura actualizando tu contraseña regularmente
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar contraseña</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contraseña actual</Text>
            <View style={styles.inputContainer}>
              <Lock color="#9ca3af" size={20} />
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Ingresa tu contraseña actual"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                {showCurrentPassword ? (
                  <EyeOff color="#9ca3af" size={20} />
                ) : (
                  <Eye color="#9ca3af" size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nueva contraseña</Text>
            <View style={styles.inputContainer}>
              <Key color="#9ca3af" size={20} />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Ingresa tu nueva contraseña"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                {showNewPassword ? (
                  <EyeOff color="#9ca3af" size={20} />
                ) : (
                  <Eye color="#9ca3af" size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirmar nueva contraseña</Text>
            <View style={styles.inputContainer}>
              <Key color="#9ca3af" size={20} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirma tu nueva contraseña"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  <EyeOff color="#9ca3af" size={20} />
                ) : (
                  <Eye color="#9ca3af" size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Requisitos de contraseña:</Text>
            <Text style={styles.infoText}>• Mínimo 8 caracteres</Text>
            <Text style={styles.infoText}>• Al menos una letra mayúscula</Text>
            <Text style={styles.infoText}>• Al menos un número</Text>
            <Text style={styles.infoText}>• Al menos un carácter especial</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opciones de privacidad</Text>
          
          <TouchableOpacity style={styles.option}>
            <View>
              <Text style={styles.optionTitle}>Autenticación de dos factores</Text>
              <Text style={styles.optionDescription}>
                Añade una capa extra de seguridad
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option}>
            <View>
              <Text style={styles.optionTitle}>Sesiones activas</Text>
              <Text style={styles.optionDescription}>
                Gestiona los dispositivos conectados
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option}>
            <View>
              <Text style={styles.optionTitle}>Historial de actividad</Text>
              <Text style={styles.optionDescription}>
                Revisa tu actividad reciente
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleChangePassword}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Guardando...' : 'Cambiar contraseña'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0369a1',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0369a1',
    lineHeight: 22,
  },
  divider: {
    height: 8,
    backgroundColor: '#f3f4f6',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
