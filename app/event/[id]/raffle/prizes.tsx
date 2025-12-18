import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Gift, Plus, Trash2, Play, FileSpreadsheet, Award } from 'lucide-react-native';
import { useEvents } from '@/contexts/EventContext';
import { Prize } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';

export default function PrizesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById, getEventPrizes, addPrize, addMultiplePrizes, deletePrize, getEventAttendees, getEventRaffleWinners } = useEvents();
  const event = getEventById(id);
  const prizes = useMemo(() => getEventPrizes(id), [getEventPrizes, id]);
  const attendees = useMemo(() => getEventAttendees(id), [getEventAttendees, id]);
  const checkedInAttendees = attendees.filter((a) => a.checkedIn);
  const existingWinners = useMemo(() => getEventRaffleWinners(id), [getEventRaffleWinners, id]);

  const primaryColor = event?.primaryColor || '#6366f1';
  const backgroundColor = event?.backgroundColor || '#f9fafb';

  const [showAddForm, setShowAddForm] = useState(false);
  const [prizeName, setPrizeName] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [prizeImageUrl, setPrizeImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddPrize = () => {
    if (!prizeName.trim()) {
      Alert.alert('Error', 'El nombre del premio es requerido');
      return;
    }

    const prize: Prize = {
      id: Date.now().toString(),
      eventId: id,
      name: prizeName.trim(),
      description: prizeDescription.trim(),
      imageUrl: prizeImageUrl.trim() || 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400',
      createdAt: new Date().toISOString(),
    };

    addPrize(prize);
    setPrizeName('');
    setPrizeDescription('');
    setPrizeImageUrl('');
    setShowAddForm(false);
    Alert.alert('Éxito', 'Premio agregado correctamente');
  };

  const handleDeletePrize = (prizeId: string) => {
    Alert.alert(
      'Eliminar Premio',
      '¿Estás seguro de que deseas eliminar este premio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deletePrize(prizeId),
        },
      ]
    );
  };

  const handleUploadExcel = async () => {
    try {
      setIsProcessing(true);
      console.log('📄 Opening document picker for prizes...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsProcessing(false);
        return;
      }

      const file = result.assets[0];
      console.log('📄 Selected file:', file);

      let fileData: string | ArrayBuffer;
      
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(blob);
        });
      } else {
        const response = await fetch(file.uri);
        const arrayBuffer = await response.arrayBuffer();
        fileData = arrayBuffer;
      }

      console.log('📊 Parsing Excel file...');
      const workbook = XLSX.read(fileData, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        Alert.alert('Error', 'El archivo está vacío o no tiene datos');
        setIsProcessing(false);
        return;
      }

      const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
      const dataRows = jsonData.slice(1);

      const newPrizes: Prize[] = [];
      const errors: string[] = [];

      dataRows.forEach((row, index) => {
        if (!row || row.every((cell: any) => !cell)) {
          return;
        }

        const rowData: any = {};
        headers.forEach((header: string, idx: number) => {
          rowData[header] = row[idx];
        });

        const nameField = rowData['nombre del premio'] || rowData['nombre'] || rowData['name'] || rowData['prize name'] || row[0];
        const descField = rowData['descripción'] || rowData['descripcion'] || rowData['description'] || row[1] || '';
        const imageField = rowData['imagen'] || rowData['image'] || rowData['url'] || row[2] || '';

        const name = nameField ? String(nameField).trim() : '';
        const desc = descField ? String(descField).trim() : '';
        const image = imageField ? String(imageField).trim() : '';

        if (!name) {
          errors.push(`Fila ${index + 2}: Nombre del premio vacío`);
          return;
        }

        newPrizes.push({
          id: `${Date.now()}-${index}`,
          eventId: id,
          name: name,
          description: desc,
          imageUrl: image || 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400',
          createdAt: new Date().toISOString(),
        });
      });

      if (errors.length > 0) {
        Alert.alert('Advertencias', errors.join('\n'), [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Continuar',
            onPress: () => {
              if (newPrizes.length > 0) {
                addMultiplePrizes(newPrizes);
                Alert.alert('Éxito', `${newPrizes.length} premios agregados correctamente`);
              }
            },
          },
        ]);
        setIsProcessing(false);
        return;
      }

      if (newPrizes.length === 0) {
        Alert.alert('Error', 'No se pudieron procesar los datos');
        setIsProcessing(false);
        return;
      }

      addMultiplePrizes(newPrizes);
      Alert.alert('Éxito', `${newPrizes.length} premios agregados correctamente`);
    } catch (error) {
      console.error('❌ Error processing Excel file:', error);
      Alert.alert('Error', 'No se pudo procesar el archivo. Por favor verifica que sea un archivo Excel válido.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartRaffle = () => {
    if (prizes.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos un premio para iniciar el sorteo');
      return;
    }

    if (checkedInAttendees.length === 0) {
      Alert.alert('Error', 'No hay asistentes registrados para el sorteo');
      return;
    }

    if (checkedInAttendees.length < prizes.length) {
      Alert.alert(
        'Advertencia',
        `Tienes ${prizes.length} premios pero solo ${checkedInAttendees.length} asistentes registrados. Algunos premios podrían quedar sin ganador.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar',
            onPress: () => router.push(`/event/${id}/raffle/spin` as any),
          },
        ]
      );
      return;
    }

    router.push(`/event/${id}/raffle/spin` as any);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Premios del Sorteo' }} />
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Premios del Sorteo</Text>
            <Text style={styles.subtitle}>
              {prizes.length} premio{prizes.length !== 1 ? 's' : ''} registrado{prizes.length !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.attendeeInfo}>
              {checkedInAttendees.length} asistente{checkedInAttendees.length !== 1 ? 's' : ''} registrado{checkedInAttendees.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {existingWinners.length > 0 && (
            <View style={styles.winnersButtonContainer}>
              <TouchableOpacity
                style={[styles.viewWinnersMainButton, { backgroundColor: primaryColor }]}
                onPress={() => router.push(`/event/${id}/raffle/winners` as any)}
              >
                <Award color="#fff" size={20} />
                <Text style={styles.viewWinnersMainButtonText}>
                  Ver Ganadores del Sorteo ({existingWinners.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: primaryColor }]}
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <Plus color="#fff" size={20} />
              <Text style={styles.primaryButtonText}>Agregar Premio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: primaryColor }]}
              onPress={handleUploadExcel}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color={primaryColor} />
              ) : (
                <>
                  <FileSpreadsheet color={primaryColor} size={20} />
                  <Text style={[styles.secondaryButtonText, { color: primaryColor }]}>
                    Cargar Excel
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {showAddForm && (
            <View style={styles.addForm}>
              <Text style={styles.formTitle}>Agregar Nuevo Premio</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre del Premio *</Text>
                <TextInput
                  style={styles.input}
                  value={prizeName}
                  onChangeText={setPrizeName}
                  placeholder="iPhone 15 Pro"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={prizeDescription}
                  onChangeText={setPrizeDescription}
                  placeholder="Descripción del premio..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>URL de Imagen</Text>
                <TextInput
                  style={styles.input}
                  value={prizeImageUrl}
                  onChangeText={setPrizeImageUrl}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text style={styles.hint}>
                  Si no proporcionas una URL, se usará una imagen por defecto
                </Text>
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddForm(false);
                    setPrizeName('');
                    setPrizeDescription('');
                    setPrizeImageUrl('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: primaryColor }]}
                  onPress={handleAddPrize}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {prizes.length > 0 ? (
            <View style={styles.prizesList}>
              {prizes.map((prize) => (
                <View key={prize.id} style={styles.prizeCard}>
                  <Image
                    source={{ uri: prize.imageUrl }}
                    style={styles.prizeImage}
                    resizeMode="cover"
                  />
                  <View style={styles.prizeInfo}>
                    <Text style={styles.prizeName}>{prize.name}</Text>
                    {prize.description ? (
                      <Text style={styles.prizeDescription} numberOfLines={2}>
                        {prize.description}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteIconButton}
                    onPress={() => handleDeletePrize(prize.id)}
                  >
                    <Trash2 color="#ef4444" size={20} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Gift color="#9ca3af" size={64} />
              <Text style={styles.emptyText}>No hay premios registrados</Text>
              <Text style={styles.emptySubtext}>
                Agrega premios para iniciar el sorteo
              </Text>
            </View>
          )}
        </ScrollView>

        {prizes.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: primaryColor }]}
              onPress={handleStartRaffle}
            >
              <Play color="#fff" size={24} />
              <Text style={styles.startButtonText}>Iniciar Sorteo</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  attendeeInfo: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500' as const,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  addForm: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
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
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  prizesList: {
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  prizeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prizeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  prizeInfo: {
    flex: 1,
    gap: 4,
  },
  prizeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  prizeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  deleteIconButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
  winnersButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  viewWinnersMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  viewWinnersMainButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
