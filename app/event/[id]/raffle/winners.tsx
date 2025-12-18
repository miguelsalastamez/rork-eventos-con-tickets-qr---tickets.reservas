import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Trophy, Download, Trash2, FileText, ExternalLink } from 'lucide-react-native';
import { useEvents } from '@/contexts/EventContext';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export default function RaffleWinnersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getEventById,
    getEventRaffleWinners,
    getEventPrizes,
    getEventAttendees,
    deleteRaffleWinner,
    deleteAllRaffleWinners,
  } = useEvents();

  const event = getEventById(id);
  const winners = useMemo(() => getEventRaffleWinners(id), [getEventRaffleWinners, id]);
  const prizes = useMemo(() => getEventPrizes(id), [getEventPrizes, id]);
  const attendees = useMemo(() => getEventAttendees(id), [getEventAttendees, id]);

  const primaryColor = event?.primaryColor || '#6366f1';
  const backgroundColor = event?.backgroundColor || '#f9fafb';
  const textColor = event?.textColor || '#111827';

  const [showAnnouncementOptions, setShowAnnouncementOptions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const winnersWithDetails = useMemo(() => {
    return winners.map((winner) => {
      const prize = prizes.find((p) => p.id === winner.prizeId);
      const attendee = attendees.find((a) => a.id === winner.attendeeId);
      return {
        ...winner,
        prize,
        attendee,
      };
    });
  }, [winners, prizes, attendees]);

  const generateCertificate = async (winnerId: string) => {
    try {
      setIsGenerating(true);
      const winner = winnersWithDetails.find((w) => w.id === winnerId);
      if (!winner) {
        Alert.alert('Error', 'Ganador no encontrado');
        return;
      }

      const certificateHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      width: 1200px;
      height: 1600px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .certificate {
      width: 1140px;
      height: 1540px;
      background: white;
      border: 8px solid ${primaryColor};
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      width: 180px;
      height: 180px;
      object-fit: contain;
    }
    .content {
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 24px;
    }
    .congrats {
      font-size: 64px;
      font-weight: 700;
      color: ${primaryColor};
    }
    .winner-name {
      font-size: 72px;
      font-weight: 700;
      color: #111827;
    }
    .won-text {
      font-size: 42px;
      color: #6b7280;
    }
    .prize-section {
      margin-top: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .prize-image {
      width: 400px;
      height: 400px;
      object-fit: cover;
      border-radius: 8px;
      border: 2px solid #e5e7eb;
    }
    .prize-name {
      font-size: 56px;
      font-weight: 700;
      color: ${primaryColor};
    }
    .prize-desc {
      font-size: 36px;
      color: #6b7280;
      max-width: 900px;
    }
    .event-info {
      margin-top: 40px;
    }
    .event-name {
      font-size: 40px;
      font-weight: 600;
      color: #111827;
    }
    .event-date {
      font-size: 32px;
      color: #6b7280;
      margin-top: 8px;
    }
    .footer {
      text-align: center;
    }
    .app-name {
      font-size: 48px;
      font-weight: 700;
      color: #6366f1;
    }
    .app-tagline {
      font-size: 28px;
      color: #6b7280;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    ${event?.organizerLogoUrl ? `<img src="${event.organizerLogoUrl}" class="logo" alt="Logo" />` : '<div style="height: 180px;"></div>'}
    
    <div class="content">
      <div class="congrats">¡Felicidades!</div>
      <div class="winner-name">${winner.attendeeName}</div>
      <div class="won-text">has ganado en el sorteo</div>
      
      <div class="prize-section">
        ${winner.prize?.imageUrl ? `<img src="${winner.prize.imageUrl}" class="prize-image" alt="Premio" />` : ''}
        <div class="prize-name">${winner.prizeName}</div>
        ${winner.prize?.description ? `<div class="prize-desc">${winner.prize.description}</div>` : ''}
      </div>
      
      <div class="event-info">
        <div class="event-name">${event?.name || ''}</div>
        <div class="event-date">${new Date(winner.timestamp).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
    </div>
    
    <div class="footer">
      <div class="app-name">EventPass</div>
      <div class="app-tagline">by Rork</div>
    </div>
  </div>
</body>
</html>
      `;

      const { uri } = await Print.printToFileAsync({ html: certificateHTML, width: 1200, height: 1600 });

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `certificado_${winner.attendeeName}.pdf`;
        link.click();
        Alert.alert('Éxito', 'Certificado descargado');
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir Certificado',
        });
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      Alert.alert('Error', 'No se pudo generar el certificado: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteWinner = (winnerId: string, winnerName: string) => {
    Alert.alert(
      'Eliminar Ganador',
      `¿Estás seguro de que deseas eliminar a ${winnerName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteRaffleWinner(winnerId),
        },
      ]
    );
  };

  const handleDeleteAllWinners = () => {
    Alert.alert(
      'Eliminar Todos los Ganadores',
      `¿Estás seguro de que deseas eliminar todos los ${winners.length} ganadores?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: () => deleteAllRaffleWinners(id),
        },
      ]
    );
  };

  const generateAnnouncementHTML = () => {
    const pages: string[] = [];
    const prizesPerPage = 8;
    
    for (let i = 0; i < winnersWithDetails.length; i += prizesPerPage) {
      const pageWinners = winnersWithDetails.slice(i, i + prizesPerPage);
      const isFirstPage = i === 0;
      const isLastPage = i + prizesPerPage >= winnersWithDetails.length;
      
      const winnersHTML = pageWinners.map((winner, index) => `
        <div class="winner-card">
          <div class="card-header">
            <div class="prize-number">
              <div class="prize-number-text">#${i + index + 1}</div>
            </div>
            <div class="winner-info">
              <div class="winner-label">GANADOR</div>
              <div class="winner-name">${winner.attendeeName}</div>
            </div>
          </div>
          
          ${winner.prize?.imageUrl ? `
            <img src="${winner.prize.imageUrl}" class="card-prize-image" alt="Premio" />
          ` : `
            <div class="card-no-image-placeholder">
              <div class="no-image-text">Sin imagen</div>
            </div>
          `}
          
          <div class="card-content">
            <div class="card-prize-name">${winner.prizeName}</div>
            <div class="card-prize-description">${winner.prize?.description || 'Sin descripción'}</div>
          </div>
        </div>
      `).join('');
      
      const page = `
        <div class="page" style="page-break-after: ${isLastPage ? 'auto' : 'always'};">
          ${isFirstPage ? `
            ${event?.organizerLogoUrl ? `<img src="${event.organizerLogoUrl}" class="logo" alt="Logo" />` : ''}
            
            <div class="header-card">
              <div class="main-title">COMUNICADO DE SORTEO</div>
              <div class="event-name">${event?.name || ''}</div>
              <div class="event-date">
                ${event?.date ? new Date(event.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              </div>
              ${event?.location ? `<div class="event-location">${event.location}</div>` : ''}
            </div>
            
            <div class="winners-section">
              <div class="section-title">GANADORES DEL SORTEO</div>
              <div class="winners-count">${winners.length} ganador${winners.length !== 1 ? 'es' : ''}</div>
            </div>
          ` : ''}
          
          <div class="cards-container">
            ${winnersHTML}
          </div>
          
          ${isLastPage ? `
            <div class="footer">
              <div class="app-name">EventPass</div>
              <div class="app-tagline">by Rork</div>
            </div>
          ` : ''}
        </div>
      `;
      
      pages.push(page);
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page {
      size: letter;
      margin: 10mm 15mm 30mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: ${primaryColor};
    }
    .page {
      background: ${primaryColor};
      padding: 15px 20px;
      min-height: 100vh;
      max-height: 100vh;
      display: flex;
      flex-direction: column;
      padding-bottom: 30mm;
    }
    .logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
      display: block;
      margin: 0 auto 10px;
    }
    .header-card {
      background: white;
      border-radius: 12px;
      padding: 12px;
      text-align: center;
      border: 3px solid ${primaryColor};
      margin-bottom: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .main-title {
      font-size: 18px;
      font-weight: 700;
      color: ${primaryColor};
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .event-name {
      font-size: 20px;
      font-weight: 700;
      color: ${textColor};
      margin-bottom: 4px;
    }
    .event-date {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 2px;
    }
    .event-location {
      font-size: 11px;
      color: #9ca3af;
    }
    .winners-section {
      text-align: center;
      margin-bottom: 10px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: white;
      margin-bottom: 4px;
    }
    .winners-count {
      font-size: 12px;
      color: rgba(255,255,255,0.8);
    }
    .cards-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 0;
      flex: 1;
    }
    .winner-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      height: 100%;
      transform: scale(0.7);
      transform-origin: top center;
    }
    .card-header {
      display: flex;
      align-items: center;
      padding: 8px;
      gap: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .prize-number {
      width: 32px;
      height: 32px;
      border-radius: 16px;
      background: ${primaryColor};
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
    }
    .prize-number-text {
      font-size: 12px;
      font-weight: 700;
      color: white;
    }
    .winner-info {
      flex: 1;
      min-width: 0;
    }
    .winner-label {
      font-size: 8px;
      font-weight: 600;
      color: #9ca3af;
      letter-spacing: 0.5px;
      margin-bottom: 1px;
    }
    .winner-name {
      font-size: 11px;
      font-weight: 700;
      color: ${textColor};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .card-prize-image {
      width: 100%;
      height: 120px;
      object-fit: cover;
      display: block;
    }
    .card-no-image-placeholder {
      width: 100%;
      height: 120px;
      background: #f9fafb;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 4px;
    }
    .no-image-text {
      font-size: 10px;
      color: #9ca3af;
      font-weight: 600;
    }
    .card-content {
      padding: 8px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .card-prize-name {
      font-size: 11px;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .card-prize-description {
      font-size: 9px;
      color: #6b7280;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .footer {
      text-align: center;
      padding-top: 10px;
      border-top: 2px solid rgba(255,255,255,0.3);
      margin-top: auto;
      padding-bottom: 0;
    }
    .app-name {
      font-size: 18px;
      font-weight: 700;
      color: white;
      margin-bottom: 2px;
    }
    .app-tagline {
      font-size: 11px;
      color: rgba(255,255,255,0.8);
    }
  </style>
</head>
<body>
  ${pages.join('')}
</body>
</html>
    `;
  };

  const generateAnnouncementPDF = async () => {
    try {
      setIsGenerating(true);
      const html = generateAnnouncementHTML();
      const { uri } = await Print.printToFileAsync({ html });

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `comunicado_sorteo_${event?.name || 'evento'}.pdf`;
        link.click();
        Alert.alert('Éxito', 'Comunicado PDF descargado');
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir Comunicado',
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsGenerating(false);
    }
  };

  const openPublicWinnersPage = () => {
    router.push(`/public/winners/${id}`);
  };

  if (winners.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: 'Ganadores del Sorteo' }} />
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
          <View style={styles.emptyState}>
            <Trophy color="#9ca3af" size={64} />
            <Text style={styles.emptyText}>No hay ganadores aún</Text>
            <Text style={styles.emptySubtext}>
              Realiza el sorteo para ver los ganadores aquí
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Ganadores del Sorteo' }} />
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['bottom']}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              Ganadores del Sorteo
            </Text>
            <Text style={styles.subtitle}>
              {winners.length} ganador{winners.length !== 1 ? 'es' : ''}
            </Text>
          </View>

          <View style={styles.winnersList}>
            {winnersWithDetails.map((winner, index) => (
              <View key={winner.id}>
                <View style={styles.winnerCard}>
                  <View style={styles.winnerInfo}>
                    <View style={styles.winnerBadge}>
                      <Text style={styles.winnerBadgeText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.winnerDetails}>
                      <Text style={styles.winnerName}>{winner.attendeeName}</Text>
                      <Text style={styles.prizeName}>{winner.prizeName}</Text>
                      {winner.prize?.description ? (
                        <Text style={styles.prizeDescription} numberOfLines={2}>
                          {winner.prize.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: primaryColor }]}
                      onPress={() => generateCertificate(winner.id)}
                    >
                      <Download color="#fff" size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteWinner(winner.id, winner.attendeeName)}
                    >
                      <Trash2 color="#fff" size={20} />
                    </TouchableOpacity>
                  </View>
                </View>


              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.announcementButton, { backgroundColor: primaryColor }]}
            onPress={() => setShowAnnouncementOptions(!showAnnouncementOptions)}
          >
            <FileText color="#fff" size={20} />
            <Text style={styles.announcementButtonText}>Generar Comunicado de Sorteo</Text>
          </TouchableOpacity>

          {showAnnouncementOptions && (
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: '#10b981' }]}
                onPress={openPublicWinnersPage}
              >
                <ExternalLink color="#fff" size={18} />
                <Text style={styles.optionButtonText}>Ver Página Pública de Ganadores</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: '#ef4444' }]}
                onPress={generateAnnouncementPDF}
                disabled={isGenerating}
              >
                <Download color="#fff" size={18} />
                <Text style={styles.optionButtonText}>
                  {isGenerating ? 'Generando...' : 'Descargar como PDF'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.deleteAllButton, { backgroundColor: '#ef4444' }]}
            onPress={handleDeleteAllWinners}
          >
            <Trash2 color="#fff" size={20} />
            <Text style={styles.deleteAllText}>Eliminar Todos los Ganadores</Text>
          </TouchableOpacity>


        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  winnersList: {
    gap: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  winnerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  winnerInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  winnerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winnerBadgeText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#6b7280',
  },
  winnerDetails: {
    flex: 1,
    gap: 4,
  },
  winnerName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  prizeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  prizeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  deleteAllText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  announcementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  announcementButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  optionsContainer: {
    marginHorizontal: 20,
    marginTop: 12,
    gap: 8,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },

});
