import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar, MapPin, User, Mail, Phone, IdCard, Share2, CheckCircle2 } from 'lucide-react-native';
import { useEvents } from '@/contexts/EventContext';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from '@/components/QRCode';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

export default function TicketScreen() {
  const router = useRouter();
  const { attendeeId } = useLocalSearchParams<{ attendeeId: string }>();
  const { attendees, events } = useEvents();
  const qrCardRef = useRef<View>(null);

  const attendee = attendees.find((a) => a.id === attendeeId);
  const event = attendee ? events.find((e) => e.id === attendee.eventId) : undefined;

  if (!attendee || !event) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top', 'bottom']}>
        <Text style={styles.errorText}>Ticket no encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const generateHTMLTemplate = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(attendee.ticketCode)}&format=png&margin=0`;
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket - ${event.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
      padding: 32px;
      text-align: center;
      color: white;
    }
    .organizer-logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      border-radius: 16px;
      background: rgba(255,255,255,0.2);
      padding: 8px;
    }
    .organizer-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 12px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 2px;
    }
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    .event-image {
      width: 100%;
      height: 280px;
      object-fit: cover;
      background: #f3f4f6;
    }
    .content {
      padding: 32px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #6366f1;
    }
    .event-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .event-name {
      font-size: 26px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
    }
    .event-detail {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 16px;
      color: #4b5563;
    }
    .event-detail:last-child { margin-bottom: 0; }
    .event-detail-icon {
      font-size: 20px;
      margin-top: 2px;
    }
    .qr-section {
      text-align: center;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
      padding: 32px;
      border-radius: 16px;
      margin-bottom: 24px;
    }
    .qr-container {
      background: white;
      padding: 20px;
      border-radius: 16px;
      display: inline-block;
      margin-bottom: 20px;
    }
    .qr-code {
      width: 300px;
      height: 300px;
    }
    .ticket-code {
      color: white;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 2px;
      margin-top: 12px;
    }
    .ticket-code-label {
      font-size: 12px;
      opacity: 0.8;
      margin-bottom: 6px;
    }
    .ticket-code-value {
      font-size: 20px;
      font-family: 'Courier New', monospace;
      font-weight: 700;
    }
    .attendee-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 12px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }
    .info-value {
      font-size: 15px;
      color: #111827;
      font-weight: 600;
      text-align: right;
    }
    .instructions {
      background: #eff6ff;
      padding: 20px;
      border-radius: 12px;
      border-left: 4px solid #3b82f6;
    }
    .instructions h3 {
      color: #1e40af;
      font-size: 18px;
      margin-bottom: 12px;
    }
    .instructions ul {
      list-style: none;
      color: #1e40af;
    }
    .instructions li {
      padding: 6px 0;
      padding-left: 24px;
      position: relative;
    }
    .instructions li:before {
      content: "✓";
      position: absolute;
      left: 0;
      font-weight: 700;
    }
    .footer {
      background: #111827;
      padding: 24px;
      text-align: center;
    }
    .footer-logo {
      font-size: 24px;
      font-weight: 700;
      color: white;
      margin-bottom: 8px;
      letter-spacing: 2px;
    }
    .footer-text {
      color: #9ca3af;
      font-size: 14px;
    }
    @media (max-width: 600px) {
      body { padding: 20px 10px; }
      .content { padding: 20px; }
      .event-name { font-size: 22px; }
      .qr-code { width: 250px; height: 250px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${event.organizerLogoUrl ? `
      <div class="organizer-logo">
        <img src="${event.organizerLogoUrl}" alt="Logo">
      </div>
      ` : ''}
      <h1>🎟️ TICKET DE ACCESO</h1>
      <p>Pase oficial para el evento</p>
    </div>

    ${event.imageUrl ? `
    <img src="${event.imageUrl}" alt="${event.name}" class="event-image">
    ` : ''}

    <div class="content">
      <div class="section">
        <h2 class="section-title">📋 Información del Evento</h2>
        <div class="event-info">
          <div class="event-name">${event.name}</div>
          ${event.description ? `<p style="color: #6b7280; margin-bottom: 16px; line-height: 1.6;">${event.description}</p>` : ''}
          
          <div class="event-detail">
            <span class="event-detail-icon">📅</span>
            <div>
              <strong>Fecha y Hora:</strong><br>
              ${new Date(event.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}<br>
              ${event.time}
            </div>
          </div>
          
          <div class="event-detail">
            <span class="event-detail-icon">🏢</span>
            <div>
              <strong>Sede:</strong><br>
              ${event.venueName}
            </div>
          </div>
          
          <div class="event-detail">
            <span class="event-detail-icon">📍</span>
            <div>
              <strong>Ubicación:</strong><br>
              ${event.location}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">🔒 Código QR de Acceso</h2>
        <div class="qr-section">
          <div class="qr-container">
            <img src="${qrUrl}" alt="QR Code" class="qr-code">
          </div>
          <div class="ticket-code">
            <div class="ticket-code-label">CÓDIGO DE TICKET</div>
            <div class="ticket-code-value">${attendee.ticketCode}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">👤 Información del Titular</h2>
        <div class="attendee-info">
          <div class="info-row">
            <span class="info-label">Nombre Completo</span>
            <span class="info-value">${attendee.fullName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${attendee.email}</span>
          </div>
          ${attendee.phone ? `
          <div class="info-row">
            <span class="info-label">Teléfono</span>
            <span class="info-value">${attendee.phone}</span>
          </div>
          ` : ''}
          ${attendee.employeeNumber ? `
          <div class="info-row">
            <span class="info-label">${event.employeeNumberLabel || 'Número de Empleado'}</span>
            <span class="info-value">${attendee.employeeNumber}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="instructions">
        <h3>📱 Instrucciones Importantes</h3>
        <ul>
          <li>Presenta este código QR en la entrada del evento</li>
          <li>El personal escaneará tu código para validar tu acceso</li>
          <li>Guarda este ticket en tu dispositivo</li>
          <li>Puedes imprimirlo o mostrarlo desde tu móvil</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <div class="footer-logo">EVENTPASS</div>
      <div class="footer-text">Sistema de Gestión de Eventos</div>
    </div>
  </div>
</body>
</html>
`;
  };

  const handleShare = async () => {
    const message = `🎟️ Ticket para ${event.name}\n\n` +
      `👤 ${attendee.fullName}\n` +
      `📅 ${new Date(event.date).toLocaleDateString('es-ES')} a las ${event.time}\n` +
      `📍 ${event.location}\n\n` +
      `Código: ${attendee.ticketCode}`;

    try {
      if (Platform.OS === 'web') {
        const htmlContent = generateHTMLTemplate();
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ticket-${attendee.ticketCode}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Éxito', 'Ticket descargado como HTML');
      } else {
        if (!qrCardRef.current) {
          await Share.share({
            message,
            title: `Ticket - ${event.name}`,
          });
          return;
        }

        try {
          const uri = await captureRef(qrCardRef, {
            format: 'png',
            quality: 1,
          });

          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(uri, {
              mimeType: 'image/png',
              dialogTitle: `Ticket - ${event.name}`,
              UTI: 'public.png',
            });
          } else {
            await Share.share({
              message,
              title: `Ticket - ${event.name}`,
            });
          }
        } catch (captureError) {
          console.error('Error capturing QR:', captureError);
          await Share.share({
            message,
            title: `Ticket - ${event.name}`,
          });
        }
      }
    } catch (error) {
      console.error('Error sharing ticket:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View ref={qrCardRef} collapsable={false}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ticketCard}
            >
              {event.organizerLogoUrl && (
                <Image
                  source={{ uri: event.organizerLogoUrl }}
                  style={styles.organizerLogoTop}
                  resizeMode="contain"
                />
              )}

              {event.imageUrl && (
                <Image
                  source={{ uri: event.imageUrl }}
                  style={styles.eventImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.ticketHeader}>
                <View style={styles.ticketTitleRow}>
                  <Text style={styles.ticketTitle}>TICKET DE ACCESO</Text>
                </View>
                {attendee.checkedIn && (
                  <View style={styles.checkedInBadge}>
                    <CheckCircle2 color="#fff" size={16} />
                    <Text style={styles.checkedInText}>Validado</Text>
                  </View>
                )}
              </View>

              <View style={styles.eventDataInCard}>
                <Text style={styles.eventNameInCard}>{event.name}</Text>
                <Text style={styles.eventDateInCard}>
                  {new Date(event.date).toLocaleDateString('es-ES')} • {event.time}
                </Text>
                <Text style={styles.eventVenueInCard}>{event.venueName}</Text>
              </View>

              <View style={styles.qrContainer}>
              <QRCode value={attendee.ticketCode} size={220} />
            </View>

              <View style={styles.ticketCode}>
                <Text style={styles.ticketCodeLabel}>CÓDIGO DE TICKET</Text>
                <Text style={styles.ticketCodeValue}>{attendee.ticketCode}</Text>
              </View>

              <View style={styles.footerInCard}>
                <Text style={styles.footerAppName}>EVENTPASS</Text>
                <Text style={styles.footerAppTagline}>Sistema de Gestión de Eventos</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.eventSection}>
            <Text style={styles.sectionTitle}>Evento</Text>
            <View style={styles.infoCard}>
              <Text style={styles.eventName}>{event.name}</Text>
              {event.description ? (
                <Text style={styles.eventDescription}>{event.description}</Text>
              ) : null}

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Calendar color="#6366f1" size={20} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Fecha y Hora</Text>
                  <Text style={styles.infoValue}>
                    {new Date(event.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.infoValue}>{event.time}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MapPin color="#6366f1" size={20} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Ubicación</Text>
                  <Text style={styles.infoValue}>{event.location}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.attendeeSection}>
            <Text style={styles.sectionTitle}>Información del Titular</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <User color="#6366f1" size={20} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nombre Completo</Text>
                  <Text style={styles.infoValue}>{attendee.fullName}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Mail color="#6366f1" size={20} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{attendee.email}</Text>
                </View>
              </View>

              {attendee.phone ? (
                <View style={styles.infoRow}>
                  <Phone color="#6366f1" size={20} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Teléfono</Text>
                    <Text style={styles.infoValue}>{attendee.phone}</Text>
                  </View>
                </View>
              ) : null}

              {attendee.employeeNumber ? (
                <View style={styles.infoRow}>
                  <IdCard color="#6366f1" size={20} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Número de Empleado</Text>
                    <Text style={styles.infoValue}>{attendee.employeeNumber}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>📱 Instrucciones</Text>
            <Text style={styles.instructionsText}>
              • Presenta este código QR en la entrada del evento{'\n'}
              • El personal escaneará tu código para validar tu acceso{'\n'}
              • Guarda este ticket en tu dispositivo{'\n'}
              • Comparte por email o WhatsApp si es necesario
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 color="#fff" size={20} />
          <Text style={styles.shareButtonText}>Compartir Ticket</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  ticketCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  organizerLogoTop: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
  },
  eventImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 8,
  },
  eventDataInCard: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  eventNameInCard: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center',
  },
  eventDateInCard: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  eventVenueInCard: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  footerInCard: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  footerAppName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 2,
  },
  footerAppTagline: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  ticketHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTitleRow: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 2,
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  checkedInText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
  },
  ticketCode: {
    alignItems: 'center',
    gap: 8,
  },
  ticketCodeLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  ticketCodeValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  eventSection: {
    gap: 12,
  },
  attendeeSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#111827',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#111827',
  },
  eventDescription: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    textTransform: 'capitalize' as const,
  },
  instructionsCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1e40af',
  },
  instructionsText: {
    fontSize: 15,
    color: '#1e40af',
    lineHeight: 24,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
