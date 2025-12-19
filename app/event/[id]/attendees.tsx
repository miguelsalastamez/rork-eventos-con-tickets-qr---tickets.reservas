import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, CheckCircle2, Circle, Ticket, FileDown, UserX, FileSpreadsheet, CheckCheck } from 'lucide-react-native';
import { useEvents } from '@/contexts/EventContext';
import { Attendee } from '@/types';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';

export default function AttendeesListScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById, getEventAttendees, removeDuplicates, toggleCheckInAttendee, checkInAllAttendees } = useEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'registered' | 'notRegistered'>('all');

  const event = getEventById(id);
  const attendees = getEventAttendees(id);

  const primaryColor = event?.primaryColor || '#6366f1';
  const backgroundColor = event?.backgroundColor || '#f9fafb';

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Evento no encontrado</Text>
      </View>
    );
  }

  const filteredAttendees = attendees
    .filter((a: Attendee) => {
      const matchesSearch =
        a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterStatus === 'registered') {
        return matchesSearch && a.checkedIn;
      } else if (filterStatus === 'notRegistered') {
        return matchesSearch && !a.checkedIn;
      }
      return matchesSearch;
    });

  const checkedInCount = attendees.filter((a: Attendee) => a.checkedIn).length;

  const getDuplicatesCount = () => {
    const seen = new Map<string, boolean>();
    let duplicateCount = 0;

    attendees.forEach((attendee: Attendee) => {
      const key = `${attendee.email.toLowerCase()}-${attendee.employeeNumber.toLowerCase()}`;
      
      if (seen.has(key)) {
        duplicateCount++;
      } else {
        seen.set(key, true);
      }
    });

    return duplicateCount;
  };

  const duplicatesCount = getDuplicatesCount();

  const handleRemoveDuplicates = () => {
    const currentDuplicatesCount = getDuplicatesCount();
    
    if (currentDuplicatesCount === 0) {
      Alert.alert('Información', 'No se encontraron registros duplicados');
      return;
    }

    Alert.alert(
      'Eliminar Duplicados',
      `Se encontraron ${currentDuplicatesCount} registros duplicados.\n\nSe eliminarán los invitados con el mismo email y número de empleado. ¿Deseas continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const count = await removeDuplicates(id);
            Alert.alert('Éxito', `Se eliminaron ${count} registros duplicados`);
          },
        },
      ]
    );
  };

  const generateReport = () => {
    let report = `REPORTE DE ASISTENCIA\n`;
    if (event.organizerLogoUrl) {
      report += `Logo Empresa: ${event.organizerLogoUrl}\n`;
    }
    report += `Evento: ${event.name}\n`;
    report += `Sede: ${event.venueName}\n`;
    report += `Ubicación: ${event.location}\n`;
    report += `Fecha: ${new Date(event.date).toLocaleDateString('es-ES')}\n`;
    report += `Total Registrados: ${attendees.length}\n`;
    report += `Asistentes: ${checkedInCount}\n`;
    report += `Pendientes: ${attendees.length - checkedInCount}\n\n`;
    report += `NOMBRE\tEMAIL\tTELÉFONO\tNÚM. EMPLEADO\tCHECK-IN\tHORA CHECK-IN\n`;

    attendees.forEach((a: Attendee) => {
      report += `${a.fullName}\t${a.email}\t${a.phone}\t${a.employeeNumber}\t${
        a.checkedIn ? 'SÍ' : 'NO'
      }\t${
        a.checkedInAt
          ? new Date(a.checkedInAt).toLocaleString('es-ES')
          : '-'
      }\n`;
    });

    Alert.alert('Reporte Generado', report, [
      { text: 'Cerrar', style: 'cancel' },
      {
        text: 'Copiar',
        onPress: () => {
          Alert.alert('Éxito', 'Reporte copiado (simulado)');
        },
      },
    ]);
  };

  const downloadExcelReport = async () => {
    try {
      const checkedInAttendees = attendees.filter((a: Attendee) => a.checkedIn);
      const pendingAttendees = attendees.filter((a: Attendee) => !a.checkedIn);

      const wb = XLSX.utils.book_new();

      const infoData = [
        ['REPORTE DE ASISTENCIA'],
        [],
        ['Evento:', event.name],
        ['Sede:', event.venueName],
        ['Ubicación:', event.location],
        ['Fecha:', new Date(event.date).toLocaleDateString('es-ES')],
        ['Hora:', event.time],
      ];

      if (event.organizerLogoUrl) {
        infoData.push(['Logo Empresa:', event.organizerLogoUrl]);
      }

      infoData.push(
        [],
        ['RESUMEN'],
        ['Total Registrados:', attendees.length.toString()],
        ['Asistieron:', checkedInCount.toString()],
        ['Pendientes:', (attendees.length - checkedInCount).toString()],
        []
      );

      const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(wb, wsInfo, 'Información');

      const checkedInData = [
        ['ASISTENTES EN EL EVENTO (Código Escaneado)'],
        [],
        ['NOMBRE', 'EMAIL', 'TELÉFONO', 'NÚM. EMPLEADO', 'HORA CHECK-IN'],
        ...checkedInAttendees.map((a: Attendee) => [
          a.fullName,
          a.email,
          a.phone,
          a.employeeNumber,
          a.checkedInAt
            ? new Date(a.checkedInAt).toLocaleString('es-ES')
            : '-',
        ]),
      ];

      const wsCheckedIn = XLSX.utils.aoa_to_sheet(checkedInData);
      XLSX.utils.book_append_sheet(wb, wsCheckedIn, 'Asistentes');

      const pendingData = [
        ['ASISTENTES PENDIENTES (No Escaneado)'],
        [],
        ['NOMBRE', 'EMAIL', 'TELÉFONO', 'NÚM. EMPLEADO'],
        ...pendingAttendees.map((a: Attendee) => [
          a.fullName,
          a.email,
          a.phone,
          a.employeeNumber,
        ]),
      ];

      const wsPending = XLSX.utils.aoa_to_sheet(pendingData);
      XLSX.utils.book_append_sheet(wb, wsPending, 'Pendientes');

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      if (Platform.OS === 'web') {
        const blob = new Blob(
          [Uint8Array.from(atob(wbout), (c) => c.charCodeAt(0))],
          { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_${event.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('Éxito', 'Reporte descargado exitosamente');
      } else {
        const docDir = (FileSystem as any).documentDirectory as string | undefined;
        if (!docDir) {
          Alert.alert('Error', 'La descarga de archivos no está disponible en esta plataforma');
          return;
        }
        const fileName = `reporte_${event.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        const fileUri = docDir + fileName;

        await FileSystem.writeAsStringAsync(fileUri, wbout, {
          encoding: 'base64' as any,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Compartir Reporte Excel',
            UTI: 'com.microsoft.excel.xlsx',
          });
        } else {
          Alert.alert('Éxito', `Reporte guardado en: ${fileUri}`);
        }
      }
    } catch (error) {
      console.error('Error generating Excel report:', error);
      Alert.alert('Error', 'No se pudo generar el reporte Excel');
    }
  };

  const handleToggleCheckIn = (attendeeId: string, attendeeName: string, isCheckedIn: boolean) => {
    Alert.alert(
      isCheckedIn ? 'Desmarcar Asistencia' : 'Marcar Asistencia',
      `¿Deseas ${isCheckedIn ? 'desmarcar' : 'marcar'} manualmente la asistencia de ${attendeeName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isCheckedIn ? 'Desmarcar' : 'Marcar',
          onPress: () => toggleCheckInAttendee(attendeeId),
        },
      ]
    );
  };

  const handleCheckInAll = () => {
    const unregisteredCount = attendees.filter((a: Attendee) => !a.checkedIn).length;
    
    if (unregisteredCount === 0) {
      Alert.alert('Información', 'Todos los invitados ya están registrados');
      return;
    }

    Alert.alert(
      'Registrar Todos',
      `¿Deseas registrar la asistencia de todos los invitados pendientes (${unregisteredCount})? Esta acción es para pruebas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Registrar Todos',
          onPress: async () => {
            await checkInAllAttendees(id);
            Alert.alert('Éxito', `Se registraron ${unregisteredCount} invitados`);
          },
        },
      ]
    );
  };

  const renderAttendee = ({ item }: { item: typeof attendees[0] }) => (
    <View style={styles.attendeeCard}>
      <TouchableOpacity
        style={styles.attendeeMain}
        onPress={() => router.push(`/ticket/${item.id}` as any)}
      >
        <View style={styles.attendeeLeft}>
          {item.checkedIn ? (
            <CheckCircle2 color="#10b981" size={24} />
          ) : (
            <Circle color="#9ca3af" size={24} />
          )}
          <View style={styles.attendeeInfo}>
            <Text style={styles.attendeeName}>{item.fullName}</Text>
            <Text style={styles.attendeeDetail}>{item.email}</Text>
            {item.employeeNumber ? (
              <Text style={styles.attendeeDetail}>Emp: {item.employeeNumber}</Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.ticketButton, { backgroundColor: `${primaryColor}15` }]}
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/ticket/${item.id}` as any);
          }}
        >
          <Ticket color={primaryColor} size={20} />
        </TouchableOpacity>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.manualCheckButton,
          item.checkedIn && styles.manualCheckButtonActive,
        ]}
        onPress={(e) => {
          e.stopPropagation();
          handleToggleCheckIn(item.id, item.fullName, item.checkedIn);
        }}
      >
        <Text
          style={[
            styles.manualCheckButtonText,
            item.checkedIn && styles.manualCheckButtonTextActive,
          ]}
        >
          {item.checkedIn ? 'Desmarcar' : 'Marcar'} Asistencia
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#6b7280" size={20} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre, email o número..."
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{attendees.length}</Text>
            <Text style={styles.statLabel}>Registrados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statValueSuccess]}>{checkedInCount}</Text>
            <Text style={styles.statLabel}>Asistieron</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statValuePending]}>
              {attendees.length - checkedInCount}
            </Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'all' && [styles.filterButtonActive, { backgroundColor: primaryColor }],
            ]}
            onPress={() => setFilterStatus('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === 'all' && styles.filterButtonTextActive,
              ]}
            >
              Todos ({attendees.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'registered' && [styles.filterButtonActive, { backgroundColor: primaryColor }],
            ]}
            onPress={() => setFilterStatus('registered')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === 'registered' && styles.filterButtonTextActive,
              ]}
            >
              Registrados ({checkedInCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'notRegistered' && [styles.filterButtonActive, { backgroundColor: primaryColor }],
            ]}
            onPress={() => setFilterStatus('notRegistered')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === 'notRegistered' && styles.filterButtonTextActive,
              ]}
            >
              No registrados ({attendees.length - checkedInCount})
            </Text>
          </TouchableOpacity>
        </View>

        {duplicatesCount > 0 && (
          <View style={styles.duplicateAlert}>
            <UserX color="#ef4444" size={20} />
            <Text style={styles.duplicateAlertText}>
              {duplicatesCount} {duplicatesCount === 1 ? 'registro duplicado encontrado' : 'registros duplicados encontrados'}
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.reportButton} onPress={generateReport}>
            <FileDown color="#6366f1" size={20} />
            <Text style={styles.reportButtonText}>Reporte Texto</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.excelButton} onPress={downloadExcelReport}>
            <FileSpreadsheet color="#10b981" size={20} />
            <Text style={styles.excelButtonText}>Descargar Excel</Text>
          </TouchableOpacity>
        </View>

        {attendees.length - checkedInCount > 0 && (
          <TouchableOpacity 
            style={styles.checkInAllButton} 
            onPress={handleCheckInAll}
          >
            <CheckCheck color="#8b5cf6" size={20} />
            <Text style={styles.checkInAllButtonText}>
              Registrar Todos ({attendees.length - checkedInCount}) - Modo Prueba
            </Text>
          </TouchableOpacity>
        )}

        {duplicatesCount > 0 && (
          <TouchableOpacity 
            style={styles.duplicateButton} 
            onPress={handleRemoveDuplicates}
          >
            <UserX color="#ef4444" size={20} />
            <Text style={styles.duplicateButtonText}>
              Eliminar Duplicados ({duplicatesCount})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {filteredAttendees.length === 0 ? (
        <View style={styles.emptyState}>
          <Circle color="#9ca3af" size={64} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No se encontraron resultados' : 'No hay invitados'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Intenta con otro término de búsqueda'
              : 'Agrega invitados para comenzar'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAttendees}
          renderItem={renderAttendee}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
  },
  statValueSuccess: {
    color: '#10b981',
  },
  statValuePending: {
    color: '#f59e0b',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    borderRadius: 12,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  excelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d1fae5',
    paddingVertical: 12,
    borderRadius: 12,
  },
  excelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10b981',
  },
  duplicateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    paddingVertical: 12,
    borderRadius: 12,
  },
  duplicateButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
  duplicateAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  duplicateAlertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#dc2626',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  attendeeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attendeeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendeeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  attendeeInfo: {
    flex: 1,
    gap: 4,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  attendeeDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
  ticketButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#111827',
    marginTop: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {},
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  manualCheckButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  manualCheckButtonActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  manualCheckButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  manualCheckButtonTextActive: {
    color: '#16a34a',
  },
  checkInAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f5f3ff',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  checkInAllButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8b5cf6',
  },
});
