import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Trophy, RotateCcw, CheckCircle, Award } from 'lucide-react-native';
import { useEvents } from '@/contexts/EventContext';
import { RaffleWinner, Attendee } from '@/types';

Dimensions.get('window');
const NAME_HEIGHT = 80;
const VISIBLE_NAMES = 5;

export default function RaffleSpinScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getEventById,
    getEventPrizes,
    getEventAttendees,
    addMultipleRaffleWinners,
    getEventRaffleWinners,
  } = useEvents();

  const event = getEventById(id);
  const prizes = useMemo(() => getEventPrizes(id), [getEventPrizes, id]);
  const attendees = useMemo(() => getEventAttendees(id), [getEventAttendees, id]);
  const existingWinners = useMemo(() => getEventRaffleWinners(id), [getEventRaffleWinners, id]);
  const checkedInAttendees = attendees.filter((a: Attendee) => a.checkedIn);

  const primaryColor = event?.primaryColor || '#6366f1';
  const backgroundColor = event?.backgroundColor || '#f9fafb';

  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [, setDisplayedName] = useState<string>('');
  const [winners, setWinners] = useState<RaffleWinner[]>([]);
  const [usedAttendeeIds, setUsedAttendeeIds] = useState<Set<string>>(new Set());
  const [intervalSeconds, setIntervalSeconds] = useState('3');
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const autoRunTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const namesListRef = useRef<string[]>([]);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const winnerIds = new Set<string>(existingWinners.map((w: any) => w.attendeeId));
    setUsedAttendeeIds(winnerIds);
  }, [existingWinners]);

  useEffect(() => {
    const names = checkedInAttendees.map((a: Attendee) => a.fullName);
    const repeatedNames: string[] = [];
    const repeatCount = Math.min(Math.ceil(1000 / names.length), 20);
    for (let i = 0; i < repeatCount; i++) {
      repeatedNames.push(...names);
    }
    namesListRef.current = repeatedNames;
  }, [checkedInAttendees]);

  useEffect(() => {
    return () => {
      if (autoRunTimerRef.current) {
        clearTimeout(autoRunTimerRef.current);
      }
    };
  }, []);

  const startSingleSpin = useCallback(() => {
    try {
      if (currentPrizeIndex >= prizes.length) {
        Alert.alert('Sorteo Completado', 'Todos los premios han sido sorteados');
        return;
      }

      if (checkedInAttendees.length === 0) {
        Alert.alert('Error', 'No hay asistentes para el sorteo');
        return;
      }

      setIsSpinning(true);
      setWinner(null);
      setDisplayedName('');

      const availableAttendees = checkedInAttendees.filter(
        (a: Attendee) => !usedAttendeeIds.has(a.id)
      );

      if (availableAttendees.length === 0) {
        Alert.alert('Error', 'No hay más asistentes disponibles para el sorteo');
        setIsSpinning(false);
        return;
      }

      const spinDuration = 5000;
      const safeDistance = Math.max(namesListRef.current.length * NAME_HEIGHT * 0.65, 1000);

      scrollY.setValue(0);
      scaleAnim.setValue(1);
      
      Animated.parallel([
        Animated.timing(scrollY, {
          toValue: safeDistance,
          duration: spinDuration,
          useNativeDriver: true,
          easing: (t) => {
            const easeValue = t < 0.7 ? t * 1.2 : 1 - Math.pow(1 - t, 3);
            return Math.max(0, Math.min(1, easeValue));
          },
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: spinDuration * 0.7,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.05,
            useNativeDriver: true,
            tension: 80,
            friction: 8,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }),
        ]),
      ]).start(() => {
        try {
          const randomIndex = Math.floor(Math.random() * availableAttendees.length);
          const selectedAttendee = availableAttendees[randomIndex];
          const currentPrize = prizes[currentPrizeIndex];
          
          setDisplayedName(selectedAttendee.fullName);

          const newWinner: RaffleWinner = {
            id: Date.now().toString(),
            eventId: id,
            prizeId: currentPrize.id,
            attendeeId: selectedAttendee.id,
            prizeName: currentPrize.name,
            attendeeName: selectedAttendee.fullName,
            timestamp: new Date().toISOString(),
          };

          setWinner(selectedAttendee.fullName);
          const updatedWinners = [...winners, newWinner];
          const updatedUsedIds = new Set([...usedAttendeeIds, selectedAttendee.id]);
          setWinners(updatedWinners);
          setUsedAttendeeIds(updatedUsedIds);
          setIsSpinning(false);
          
          if (isAutoRunning) {
            if (currentPrizeIndex + 1 < prizes.length) {
              const interval = parseInt(intervalSeconds, 10) || 3;
              autoRunTimerRef.current = setTimeout(() => {
                setCurrentPrizeIndex(currentPrizeIndex + 1);
                setWinner(null);
              }, interval * 1000);
            } else {
              setIsAutoRunning(false);
              Alert.alert(
                'Sorteo Completado',
                '¿Deseas guardar los resultados?',
                [
                  {
                    text: 'No',
                    style: 'cancel',
                  },
                  {
                    text: 'Sí',
                    onPress: async () => {
                      await addMultipleRaffleWinners(updatedWinners);
                      Alert.alert('Éxito', 'Ganadores guardados correctamente', [
                        { text: 'OK', onPress: () => router.back() },
                      ]);
                    },
                  },
                ]
              );
            }
          }
        } catch (error) {
          console.error('Error al seleccionar ganador:', error);
          setIsSpinning(false);
          Alert.alert('Error', 'Hubo un problema al seleccionar el ganador');
        }
      });
    } catch (error) {
      console.error('Error en startSpin:', error);
      setIsSpinning(false);
      Alert.alert('Error', 'Hubo un problema al iniciar el sorteo');
    }
  }, [currentPrizeIndex, prizes, checkedInAttendees, usedAttendeeIds, scrollY, scaleAnim, id, winners, isAutoRunning, intervalSeconds, addMultipleRaffleWinners, router]);

  const startAutoRaffle = () => {
    const interval = parseInt(intervalSeconds, 10);
    if (isNaN(interval) || interval < 1) {
      Alert.alert('Error', 'Por favor ingresa un intervalo válido (mínimo 1 segundo)');
      return;
    }
    
    setIsAutoRunning(true);
    setCurrentPrizeIndex(0);
    setWinner(null);
    setWinners([]);
    setUsedAttendeeIds(new Set<string>(existingWinners.map((w: any) => w.attendeeId)));
  };

  const stopAutoRaffle = () => {
    if (autoRunTimerRef.current) {
      clearTimeout(autoRunTimerRef.current);
      autoRunTimerRef.current = null;
    }
    setIsAutoRunning(false);
  };

  const resetRaffle = () => {
    Alert.alert(
      'Reiniciar Sorteo',
      '¿Estás seguro? Se perderán todos los ganadores seleccionados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            stopAutoRaffle();
            setCurrentPrizeIndex(0);
            setWinner(null);
            setDisplayedName('');
            setWinners([]);
            setUsedAttendeeIds(new Set<string>(existingWinners.map((w: any) => w.attendeeId)));
            scrollY.setValue(0);
            scaleAnim.setValue(1);
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (isAutoRunning && !isSpinning && !winner) {
      startSingleSpin();
    }
  }, [isAutoRunning, currentPrizeIndex, isSpinning, winner, startSingleSpin]);

  const currentPrize = prizes[currentPrizeIndex];

  if (!currentPrize) {
    return (
      <>
        <Stack.Screen options={{ title: 'Sorteo' }} />
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No hay premios disponibles</Text>
        </View>
      </SafeAreaView>
      </>
    );
  }

  if (checkedInAttendees.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: 'Sorteo' }} />
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No hay asistentes registrados</Text>
          <Text style={styles.errorSubtext}>Registra asistentes antes de iniciar el sorteo</Text>
        </View>
      </SafeAreaView>
      </>
    );
  }

  const transformY = scrollY.interpolate({
    inputRange: [0, Math.max(namesListRef.current.length * NAME_HEIGHT, 1)],
    outputRange: [0, -Math.max(namesListRef.current.length * NAME_HEIGHT, 1)],
    extrapolate: 'clamp',
  });



  return (
    <>
      <Stack.Screen options={{ title: 'Sorteo' }} />
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <View style={styles.prizeInfo}>
          <Trophy color={primaryColor} size={32} />
          <View style={styles.prizeText}>
            <Text style={styles.prizeLabel}>Premio {currentPrizeIndex + 1} de {prizes.length}</Text>
            <Text style={styles.prizeName}>{currentPrize.name}</Text>
          </View>
        </View>
      </View>

      <View style={styles.spinContainer}>
        <View style={styles.spinFrame}>
          <View style={styles.namesContainer}>
            <Animated.View
              style={[
                styles.namesList,
                {
                  transform: [{ translateY: transformY }],
                },
              ]}
            >
              {namesListRef.current.slice(0, Math.min(namesListRef.current.length, 5000)).map((name, index) => (
                <View key={index} style={styles.nameItem}>
                  <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
                </View>
              ))}
            </Animated.View>
          </View>

          <View style={styles.gradientTop} />
          <View style={styles.gradientBottom} />
        </View>
      </View>

      {winner && (
        <View style={styles.winnerOverlay}>
          <View style={[styles.winnerCard, { borderColor: primaryColor }]}>
            <CheckCircle color={primaryColor} size={48} />
            <Text style={styles.winnerLabel}>¡Ganador!</Text>
            <Text style={styles.winnerName}>{winner}</Text>
          </View>
        </View>
      )}

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.controls}>
        {!isAutoRunning && winners.length === 0 && (
          <View style={styles.intervalContainer}>
            <Text style={styles.intervalLabel}>Intervalo entre premios (segundos):</Text>
            <TextInput
              style={[styles.intervalInput, { borderColor: primaryColor }]}
              value={intervalSeconds}
              onChangeText={setIntervalSeconds}
              keyboardType="number-pad"
              placeholder="3"
              placeholderTextColor="#9ca3af"
              editable={!isSpinning}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
        )}

        {!isAutoRunning ? (
          <TouchableOpacity
            style={[
              styles.spinButton,
              { backgroundColor: primaryColor },
              isSpinning && styles.spinButtonDisabled,
            ]}
            onPress={startAutoRaffle}
            disabled={isSpinning || winners.length > 0}
          >
            <Text style={styles.spinButtonText}>Iniciar Sorteo Automático</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.stopButton, { backgroundColor: '#ef4444' }]}
            onPress={stopAutoRaffle}
          >
            <Text style={styles.stopButtonText}>Detener Sorteo</Text>
          </TouchableOpacity>
        )}

        {winners.length > 0 && !isAutoRunning && (
          <TouchableOpacity style={styles.resetButton} onPress={resetRaffle}>
            <RotateCcw color="#6b7280" size={20} />
            <Text style={styles.resetButtonText}>Reiniciar</Text>
          </TouchableOpacity>
        )}
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.winnersHistory}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Ganadores:</Text>
          {existingWinners.length > 0 && (
            <TouchableOpacity
              style={[styles.viewWinnersButton, { backgroundColor: primaryColor }]}
              onPress={() => router.push(`/event/${id}/raffle/winners` as any)}
            >
              <Award color="#fff" size={18} />
              <Text style={styles.viewWinnersButtonText}>Ver Ganadores</Text>
            </TouchableOpacity>
          )}
        </View>
        {winners.length > 0 && winners.map((w, idx) => (
          <Text key={w.id} style={styles.historyItem}>
            {idx + 1}. {w.attendeeName} - {w.prizeName}
          </Text>
        ))}
        {existingWinners.length > 0 && winners.length === 0 && (
          <Text style={styles.historyItem}>
            {existingWinners.length} ganador{existingWinners.length > 1 ? 'es' : ''} guardado{existingWinners.length > 1 ? 's' : ''}
          </Text>
        )}
        {existingWinners.length === 0 && winners.length === 0 && (
          <Text style={styles.historyItem}>
            Aún no hay ganadores
          </Text>
        )}
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  prizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  prizeText: {
    flex: 1,
    gap: 4,
  },
  prizeLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  prizeName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  spinContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  spinFrame: {
    width: '100%',
    height: VISIBLE_NAMES * NAME_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  spinIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -NAME_HEIGHT / 2,
    height: NAME_HEIGHT,
    borderWidth: 4,
    borderRadius: 16,
    zIndex: 1,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  namesContainer: {
    flex: 1,
    overflow: 'hidden',
    zIndex: 2,
    justifyContent: 'center',
  },
  winnerDisplayContainer: {
    height: VISIBLE_NAMES * NAME_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  winnerDisplayText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#000000',
    textAlign: 'center',
  },
  namesList: {
    paddingTop: VISIBLE_NAMES * NAME_HEIGHT / 2,
  },
  nameItem: {
    height: NAME_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  nameText: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#000000',
    textAlign: 'center',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: NAME_HEIGHT * 1.5,
    backgroundColor: 'rgba(249, 250, 251, 0.9)',
    pointerEvents: 'none',
    zIndex: 5,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: NAME_HEIGHT * 1.5,
    backgroundColor: 'rgba(249, 250, 251, 0.9)',
    pointerEvents: 'none',
    zIndex: 5,
  },
  winnerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 40,
  },
  winnerCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    minWidth: '100%',
  },
  winnerLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  winnerName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
    textAlign: 'center',
  },
  controls: {
    padding: 20,
    gap: 12,
  },
  spinButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  spinButtonDisabled: {
    opacity: 0.6,
  },
  spinButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  nextButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  intervalContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  intervalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
  },
  intervalInput: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
  },
  stopButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  winnersHistory: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  viewWinnersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewWinnersButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  historyItem: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
