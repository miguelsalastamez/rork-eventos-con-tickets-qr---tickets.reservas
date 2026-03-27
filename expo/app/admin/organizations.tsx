import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Building2, Users, Package, Pencil, Trash2 } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { useEvents } from '@/contexts/EventContext';
import { Organization } from '@/types';

export default function OrganizationsScreen() {
  const router = useRouter();
  const { user, organizations, addOrganization, deleteOrganization } = useUser();
  const { events } = useEvents();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');

  if (user?.role !== 'super_admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Acceso denegado</Text>
      </View>
    );
  }

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      Alert.alert('Error', 'El nombre de la organización es requerido');
      return;
    }

    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: newOrgName.trim(),
      description: newOrgDescription.trim(),
      ownerId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addOrganization(newOrg);
    setNewOrgName('');
    setNewOrgDescription('');
    setShowCreateForm(false);
    Alert.alert('Éxito', 'Organización creada correctamente');
  };

  const handleDeleteOrganization = (orgId: string, orgName: string) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar "${orgName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteOrganization(orgId);
            Alert.alert('Éxito', 'Organización eliminada');
          },
        },
      ]
    );
  };

  const getOrgStats = (orgId: string) => {
    const orgEvents = events.filter((e) => e.organizationId === orgId);
    return {
      events: orgEvents.length,
      users: 1,
    };
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#111827" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Organizaciones</Text>
          <TouchableOpacity
            onPress={() => setShowCreateForm(!showCreateForm)}
            style={styles.addButton}
          >
            <Plus color="#6366f1" size={24} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showCreateForm && (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>Nueva Organización</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la organización"
              placeholderTextColor="#9ca3af"
              value={newOrgName}
              onChangeText={setNewOrgName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción"
              placeholderTextColor="#9ca3af"
              value={newOrgDescription}
              onChangeText={setNewOrgDescription}
              multiline
              numberOfLines={3}
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateForm(false);
                  setNewOrgName('');
                  setNewOrgDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleCreateOrganization}>
                <Text style={styles.submitButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.organizationsList}>
          {organizations.length === 0 ? (
            <View style={styles.emptyState}>
              <Building2 color="#9ca3af" size={48} />
              <Text style={styles.emptyText}>No hay organizaciones</Text>
              <Text style={styles.emptySubtext}>
                Crea la primera organización para comenzar
              </Text>
            </View>
          ) : (
            organizations.map((org) => {
              const stats = getOrgStats(org.id);
              return (
                <View key={org.id} style={styles.orgCard}>
                  <View style={styles.orgHeader}>
                    <View style={styles.orgIconContainer}>
                      <Building2 color="#6366f1" size={24} />
                    </View>
                    <View style={styles.orgInfo}>
                      <Text style={styles.orgName}>{org.name}</Text>
                      {org.description && (
                        <Text style={styles.orgDescription} numberOfLines={2}>
                          {org.description}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.orgStats}>
                    <View style={styles.statItem}>
                      <Package color="#6b7280" size={16} />
                      <Text style={styles.statText}>{stats.events} eventos</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Users color="#6b7280" size={16} />
                      <Text style={styles.statText}>{stats.users} usuarios</Text>
                    </View>
                  </View>

                  <View style={styles.orgActions}>
                    <TouchableOpacity
                      style={styles.actionIcon}
                      onPress={() => router.push(`/admin/organizations/${org.id}/edit` as any)}
                    >
                      <Pencil color="#6366f1" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionIcon}
                      onPress={() => handleDeleteOrganization(org.id, org.name)}
                    >
                      <Trash2 color="#ef4444" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
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
  backButton: {
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  createForm: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  organizationsList: {
    padding: 16,
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  orgCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orgHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  orgIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  orgDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  orgStats: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
  },
  orgActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
  },
});
