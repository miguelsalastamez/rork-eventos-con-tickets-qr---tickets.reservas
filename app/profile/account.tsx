import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Mail, Phone, Camera } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';

export default function AccountScreen() {
  const router = useRouter();
  const { user, saveUser, logout } = useUser();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'No hay sesión de usuario activa');
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Error', 'Por favor completa el nombre completo');
      return;
    }

    setIsSaving(true);
    try {
      const phoneValue = phone.trim() === '' ? null : phone.trim();
      
      const updatedUser = {
        ...user,
        fullName: fullName.trim(),
        phone: phoneValue || undefined,
      };
      
      await saveUser(updatedUser);
      
      Alert.alert('Éxito', 'Tu información ha sido actualizada correctamente');
      router.back();
    } catch (error: any) {
      console.error('=== ERROR UPDATING PROFILE ===');
      console.error('Error:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error data:', error?.data);
      console.error('Error shape:', error?.shape);
      
      let errorMessage = 'Error desconocido';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.shape?.message) {
        errorMessage = error.shape.message;
      }
      
      if (errorMessage.includes('expirado') || errorMessage.includes('expired') || errorMessage.includes('UNAUTHORIZED') || error?.data?.code === 'UNAUTHORIZED') {
        Alert.alert(
          'Sesión expirada',
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                router.replace('/admin');
              },
            },
          ]
        );
        return;
      }
      
      Alert.alert('Error', `No se pudo actualizar tu información: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User color="#6366f1" size={48} />
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Camera color="#fff" size={16} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarText}>Cambiar foto</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre completo *</Text>
            <View style={styles.inputContainer}>
              <User color="#9ca3af" size={20} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ingresa tu nombre completo"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Correo electrónico *</Text>
            <View style={[styles.inputContainer, styles.inputContainerDisabled]}>
              <Mail color="#9ca3af" size={20} />
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user?.email || ''}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
              />
            </View>
            <Text style={styles.helperText}>El correo no se puede modificar</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <View style={styles.inputContainer}>
              <Phone color="#9ca3af" size={20} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+52 123 456 7890"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              * Campos obligatorios
            </Text>
          </View>
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
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600' as const,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
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
  inputContainerDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  inputDisabled: {
    color: '#6b7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0369a1',
    lineHeight: 20,
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
