import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { CheckCircle2, X, Camera, Keyboard as KeyboardIcon, XCircle } from 'lucide-react-native';
import { useEvents } from '@/contexts/EventContext';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { SUCCESS_SOUNDS, ERROR_SOUNDS } from '@/contexts/SettingsContext';


type FeedbackType = 'success' | 'error' | null;

export default function ScanQRScreen() {
  const router = useRouter();
  const { getAttendeeByTicketCode, checkInAttendee, getEventById } = useEvents();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [feedbackScale] = useState(new Animated.Value(0));
  const [feedbackOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (Platform.OS === 'web') {
      setManualMode(true);
    }

    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    }
  }, []);

  const playSuccessSound = async (eventId: string) => {
    if (Platform.OS === 'web') return;
    
    try {
      console.log('Playing success sound for event:', eventId);
      const event = getEventById(eventId);
      const soundId = event?.successSoundId || 'success-1';
      const soundObj = SUCCESS_SOUNDS.find(s => s.id === soundId) || SUCCESS_SOUNDS[0];
      console.log('Using sound:', soundObj.name, soundObj.url);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: soundObj.url },
        { shouldPlay: true, volume: 1.0 },
        null,
        false
      );
      await sound.setVolumeAsync(1.0);
      await sound.playAsync();
      console.log('Success sound playing');
      
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('Success sound finished');
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing success sound:', error);
    }
  };

  const playErrorSound = async (eventId: string) => {
    if (Platform.OS === 'web') return;
    
    try {
      console.log('Playing error sound for event:', eventId);
      const event = getEventById(eventId);
      const soundId = event?.errorSoundId || 'error-1';
      const soundObj = ERROR_SOUNDS.find(s => s.id === soundId) || ERROR_SOUNDS[0];
      console.log('Using sound:', soundObj.name, soundObj.url);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: soundObj.url },
        { shouldPlay: true, volume: 1.0 },
        null,
        false
      );
      await sound.setVolumeAsync(1.0);
      await sound.playAsync();
      console.log('Error sound playing');
      
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('Error sound finished');
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing error sound:', error);
    }
  };

  const triggerVibration = async (eventId: string) => {
    if (Platform.OS === 'web') return;
    
    try {
      const event = getEventById(eventId);
      if (event?.vibrationEnabled === false) return;
      
      const intensity = event?.vibrationIntensity || 'heavy';
      
      switch (intensity) {
        case 'light':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await new Promise(resolve => setTimeout(resolve, 100));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await new Promise(resolve => setTimeout(resolve, 80));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await new Promise(resolve => setTimeout(resolve, 80));
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      console.log('Error triggering vibration:', error);
    }
  };

  const showFeedback = (type: FeedbackType) => {
    setFeedback(type);
    
    feedbackScale.setValue(0);
    feedbackOpacity.setValue(1);
    
    Animated.parallel([
      Animated.spring(feedbackScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 2000,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFeedback(null);
    });
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando cámara...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.permissionContainer}>
          <Camera color="#6b7280" size={64} strokeWidth={1.5} />
          <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a tu cámara para escanear códigos QR y validar el acceso de invitados.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Conceder Permiso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setManualMode(true)}
          >
            <Text style={styles.manualButtonText}>Ingresar código manualmente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    processTicketCode(data);
  };

  const processTicketCode = async (code: string) => {
    console.log('Processing ticket code:', code);
    
    const attendee = getAttendeeByTicketCode(code);
    
    if (!attendee) {
      await playErrorSound('');
      showFeedback('error');
      
      setTimeout(() => {
        Alert.alert(
          'Código Inválido',
          'El código escaneado no corresponde a ningún invitado registrado.',
          [
            { text: 'OK', onPress: () => setScanned(false) },
          ]
        );
      }, 500);
      return;
    }

    const event = getEventById(attendee.eventId);

    if (attendee.checkedIn) {
      await playErrorSound(attendee.eventId);
      showFeedback('error');
      
      setTimeout(() => {
        Alert.alert(
          'Ya Registrado',
          `${attendee.fullName} ya ha sido registrado previamente.\n\nEvento: ${event?.name || 'N/A'}`,
          [
            { text: 'OK', onPress: () => setScanned(false) },
          ]
        );
      }, 500);
      return;
    }

    checkInAttendee(attendee.id);
    await playSuccessSound(attendee.eventId);
    await triggerVibration(attendee.eventId);
    showFeedback('success');
    
    setTimeout(() => {
      Alert.alert(
        'Check-in Exitoso',
        `✓ ${attendee.fullName}\n\nEvento: ${event?.name || 'N/A'}\nAcceso validado correctamente`,
        [
          {
            text: 'OK',
            onPress: () => setScanned(false),
          },
        ]
      );
    }, 500);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      Alert.alert('Error', 'Por favor ingresa un código de ticket');
      return;
    }

    processTicketCode(manualCode.trim());
    setManualCode('');
  };

  if (manualMode) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Validar Acceso</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.manualContainer}>
          <KeyboardIcon color="#6366f1" size={64} strokeWidth={1.5} />
          <Text style={styles.manualTitle}>Ingreso Manual</Text>
          <Text style={styles.manualText}>
            Escribe el código del ticket para validar el acceso
          </Text>

          <View style={styles.manualInputGroup}>
            <TextInput
              style={styles.manualInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Código de ticket"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.validateButton} onPress={handleManualSubmit}>
              <Text style={styles.validateButtonText}>Validar</Text>
            </TouchableOpacity>
          </View>

          {!Platform.OS.includes('web') && (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setManualMode(false)}
            >
              <Camera color="#6366f1" size={20} />
              <Text style={styles.switchButtonText}>Usar cámara</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear QR</Text>
        <TouchableOpacity onPress={() => setManualMode(true)} style={styles.manualIconButton}>
          <KeyboardIcon color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={'back' as CameraType}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            
            {feedback && (
              <Animated.View
                style={[
                  styles.feedbackContainer,
                  {
                    opacity: feedbackOpacity,
                    transform: [{ scale: feedbackScale }],
                  },
                ]}
              >
                {feedback === 'success' ? (
                  <View style={styles.successFeedback}>
                    <CheckCircle2 color="#10b981" size={120} strokeWidth={3} />
                  </View>
                ) : (
                  <View style={styles.errorFeedback}>
                    <XCircle color="#ef4444" size={120} strokeWidth={3} />
                  </View>
                )}
              </Animated.View>
            )}
          </View>
        </CameraView>
      </View>

      <View style={styles.instructions}>
        <CheckCircle2 color="#10b981" size={24} />
        <Text style={styles.instructionsText}>
          Centra el código QR del ticket dentro del marco
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
    backgroundColor: '#f9fafb',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  manualButton: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
  manualIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  instructionsText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  manualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
    backgroundColor: '#f9fafb',
  },
  manualTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    textAlign: 'center',
  },
  manualText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  manualInputGroup: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  manualInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  validateButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  validateButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  switchButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  feedbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  successFeedback: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 100,
    padding: 32,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  errorFeedback: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 100,
    padding: 32,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
});
