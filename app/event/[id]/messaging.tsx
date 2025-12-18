import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  Send,
  Mail,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Bell,
} from 'lucide-react-native';
import { useEvents } from '@/contexts/EventContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { MessageChannel, MessageTemplate, ScheduledMessage, AutomatedNotification, NotificationType } from '@/types';

export default function MessagingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEventById, getEventAttendees } = useEvents();
  const {
    templates,
    addTemplate,
    scheduleMessage,
    deleteScheduledMessage,
    deleteTemplate,
    sendMessage,
    getEventScheduledMessages,
    getEventMessageHistory,
    getEventAutomatedNotifications,
    updateAutomatedNotification,
    initializeEventNotifications,
  } = useMessaging();

  const event = useMemo(() => getEventById(id), [getEventById, id]);
  const attendees = useMemo(() => getEventAttendees(id), [getEventAttendees, id]);
  const scheduledMessages = useMemo(() => getEventScheduledMessages(id), [getEventScheduledMessages, id]);
  const messageHistory = useMemo(() => getEventMessageHistory(id), [getEventMessageHistory, id]);
  const automatedNotifications = useMemo(() => getEventAutomatedNotifications(id), [getEventAutomatedNotifications, id]);

  const [activeTab, setActiveTab] = useState<'compose' | 'scheduled' | 'templates' | 'history' | 'automated'>('automated');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<AutomatedNotification | null>(null);
  const [showEditNotificationModal, setShowEditNotificationModal] = useState(false);
  const [testEmails, setTestEmails] = useState<Record<string, string>>({});
  const [testPhones, setTestPhones] = useState<Record<string, string>>({});
  const [sendingTest, setSendingTest] = useState<Record<string, boolean>>({});

  const [channel, setChannel] = useState<MessageChannel>('both');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');

  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [templateChannel, setTemplateChannel] = useState<MessageChannel>('both');

  const primaryColor = event?.primaryColor || '#6366f1';
  const backgroundColor = event?.backgroundColor || '#f9fafb';

  React.useEffect(() => {
    if (event && automatedNotifications.length === 0) {
      initializeEventNotifications(
        event.id,
        event.name,
        event.date,
        event.time,
        event.venueName,
        event.location
      );
    }
  }, [event, automatedNotifications.length, initializeEventNotifications]);

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !templateContent.trim()) {
      Alert.alert('Error', 'El nombre y el contenido son obligatorios');
      return;
    }

    const newTemplate: MessageTemplate = {
      id: Date.now().toString(),
      name: templateName,
      subject: templateSubject,
      content: templateContent,
      channel: templateChannel,
      createdAt: new Date().toISOString(),
    };

    addTemplate(newTemplate);
    setShowTemplateModal(false);
    setTemplateName('');
    setTemplateSubject('');
    setTemplateContent('');
    setTemplateChannel('both');
    Alert.alert('Éxito', 'Plantilla guardada correctamente');
  };

  const handleScheduleMessage = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'El contenido del mensaje es obligatorio');
      return;
    }

    if (channel !== 'whatsapp' && !subject.trim()) {
      Alert.alert('Error', 'El asunto es obligatorio para correos');
      return;
    }

    const scheduleDate = scheduledFor ? new Date(scheduledFor) : new Date();

    const newMessage: ScheduledMessage = {
      id: Date.now().toString(),
      eventId: id,
      subject: subject || undefined,
      content,
      channel,
      scheduledFor: scheduleDate.toISOString(),
      status: 'scheduled',
      recipientCount: attendees.length,
      createdAt: new Date().toISOString(),
    };

    scheduleMessage(newMessage);
    setContent('');
    setSubject('');
    setScheduledFor('');
    setActiveTab('scheduled');
    Alert.alert('Éxito', 'Mensaje programado correctamente');
  };

  const handleSendNow = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'El contenido del mensaje es obligatorio');
      return;
    }

    if (channel !== 'whatsapp' && !subject.trim()) {
      Alert.alert('Error', 'El asunto es obligatorio para correos');
      return;
    }

    if (attendees.length === 0) {
      Alert.alert('Error', 'No hay invitados en este evento');
      return;
    }

    Alert.alert(
      'Confirmar Envío',
      `¿Enviar mensaje a ${attendees.length} invitados?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            const newMessage: ScheduledMessage = {
              id: Date.now().toString(),
              eventId: id,
              subject: subject || undefined,
              content,
              channel,
              scheduledFor: new Date().toISOString(),
              status: 'sending',
              recipientCount: attendees.length,
              createdAt: new Date().toISOString(),
            };

            scheduleMessage(newMessage);

            const recipients = attendees.map((a) => ({
              id: a.id,
              name: a.fullName,
              email: a.email,
              phone: a.phone,
            }));

            const result = await sendMessage(newMessage.id, recipients);
            
            if (result) {
              Alert.alert(
                'Envío Completado',
                `Enviados: ${result.sentCount}\nFallidos: ${result.failedCount}`,
                [{ text: 'OK', onPress: () => setActiveTab('history') }]
              );
              setContent('');
              setSubject('');
            }
          },
        },
      ]
    );
  };

  const handleSendScheduledMessage = async (messageId: string) => {
    const message = scheduledMessages.find((m) => m.id === messageId);
    if (!message) return;

    Alert.alert(
      'Confirmar Envío',
      `¿Enviar mensaje a ${attendees.length} invitados?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            const recipients = attendees.map((a) => ({
              id: a.id,
              name: a.fullName,
              email: a.email,
              phone: a.phone,
            }));

            const result = await sendMessage(messageId, recipients);
            
            if (result) {
              Alert.alert(
                'Envío Completado',
                `Enviados: ${result.sentCount}\nFallidos: ${result.failedCount}`
              );
            }
          },
        },
      ]
    );
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    setChannel(template.channel);
    setSubject(template.subject || '');
    setContent(template.content);
    setActiveTab('compose');
  };

  const handleDeleteScheduledMessage = (messageId: string) => {
    Alert.alert(
      'Eliminar Mensaje',
      '¿Estás seguro de eliminar este mensaje programado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteScheduledMessage(messageId),
        },
      ]
    );
  };

  const handleDeleteTemplate = (templateId: string) => {
    Alert.alert(
      'Eliminar Plantilla',
      '¿Estás seguro de eliminar esta plantilla?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteTemplate(templateId),
        },
      ]
    );
  };

  const getNotificationLabel = (type: NotificationType) => {
    switch (type) {
      case 'invitation':
        return 'Invitación al Evento';
      case 'reminder-15d':
        return 'Recordatorio 15 días antes';
      case 'reminder-7d':
        return 'Recordatorio 1 semana antes';
      case 'reminder-1d':
        return 'Recordatorio 1 día antes';
      case 'reminder-5h':
        return 'Recordatorio 5 horas antes';
      default:
        return 'Notificación';
    }
  };

  const handleToggleNotification = (notificationId: string, enabled: boolean) => {
    updateAutomatedNotification(notificationId, { enabled });
  };

  const handleEditNotification = (notification: AutomatedNotification) => {
    setEditingNotification(notification);
    setShowEditNotificationModal(true);
  };

  const handleSaveNotification = () => {
    if (!editingNotification) return;

    updateAutomatedNotification(editingNotification.id, {
      subject: editingNotification.subject,
      content: editingNotification.content,
      channel: editingNotification.channel,
    });

    setShowEditNotificationModal(false);
    setEditingNotification(null);
    Alert.alert('Éxito', 'Notificación actualizada correctamente');
  };

  const handleSendNotification = async (notification: AutomatedNotification) => {
    if (attendees.length === 0) {
      Alert.alert('Error', 'No hay invitados en este evento');
      return;
    }

    Alert.alert(
      'Confirmar Envío',
      `¿Enviar "${getNotificationLabel(notification.type)}" a ${attendees.length} invitados?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            const newMessage: ScheduledMessage = {
              id: Date.now().toString(),
              eventId: id,
              subject: notification.subject,
              content: notification.content,
              channel: notification.channel,
              scheduledFor: new Date().toISOString(),
              status: 'sending',
              recipientCount: attendees.length,
              createdAt: new Date().toISOString(),
            };

            scheduleMessage(newMessage);

            const recipients = attendees.map((a) => ({
              id: a.id,
              name: a.fullName,
              email: a.email,
              phone: a.phone,
            }));

            const result = await sendMessage(newMessage.id, recipients);
            
            if (result) {
              Alert.alert(
                'Envío Completado',
                `Enviados: ${result.sentCount}\nFallidos: ${result.failedCount}`
              );
            }
          },
        },
      ]
    );
  };

  const handleSendTest = async (notification: AutomatedNotification) => {
    const email = testEmails[notification.id] || '';
    const phone = testPhones[notification.id] || '';

    if (!email && !phone) {
      Alert.alert('Error', 'Ingresa al menos un email o teléfono');
      return;
    }

    if (notification.channel === 'email' && !email) {
      Alert.alert('Error', 'Ingresa un email para prueba');
      return;
    }

    if (notification.channel === 'whatsapp' && !phone) {
      Alert.alert('Error', 'Ingresa un teléfono para prueba');
      return;
    }

    setSendingTest((prev) => ({ ...prev, [notification.id]: true }));
    
    try {
      const testRecipient = {
        id: 'test',
        name: 'Prueba',
        email: email || undefined,
        phone: phone || undefined,
      };

      console.log(`📤 Enviando mensaje de prueba a:`);
      if (email) console.log(`📧 Email: ${email}`);
      if (phone) console.log(`📱 Teléfono: ${phone}`);
      console.log(`📝 Asunto: ${notification.subject}`);
      console.log(`💬 Contenido: ${notification.content.substring(0, 100)}...`);

      await new Promise(resolve => setTimeout(resolve, 500));

      Alert.alert(
        '✅ Prueba Enviada',
        `El mensaje de prueba se envió correctamente a:\n${email ? `📧 ${email}` : ''}${email && phone ? '\n' : ''}${phone ? `📱 ${phone}` : ''}`
      );
    } catch (error) {
      console.error('Error sending test:', error);
      Alert.alert('Error', 'Ocurrió un error al enviar la prueba');
    } finally {
      setSendingTest((prev) => ({ ...prev, [notification.id]: false }));
    }
  };

  const getChannelIcon = (ch: MessageChannel) => {
    if (ch === 'email') return <Mail size={16} color={primaryColor} />;
    if (ch === 'whatsapp') return <MessageCircle size={16} color={primaryColor} />;
    return (
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <Mail size={16} color={primaryColor} />
        <MessageCircle size={16} color={primaryColor} />
      </View>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle size={16} color="#10b981" />;
      case 'failed':
        return <XCircle size={16} color="#ef4444" />;
      case 'scheduled':
        return <Clock size={16} color="#f59e0b" />;
      default:
        return <Clock size={16} color="#6b7280" />;
    }
  };

  const renderComposeTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: `${primaryColor}10` }]}>
          <Users size={24} color={primaryColor} />
          <Text style={styles.statNumber}>{attendees.length}</Text>
          <Text style={styles.statLabel}>Invitados</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: `${primaryColor}10` }]}>
          <Send size={24} color={primaryColor} />
          <Text style={styles.statNumber}>{messageHistory.length}</Text>
          <Text style={styles.statLabel}>Enviados</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Canal de Envío</Text>
        <View style={styles.channelSelector}>
          <TouchableOpacity
            style={[
              styles.channelButton,
              channel === 'email' && { backgroundColor: primaryColor },
            ]}
            onPress={() => setChannel('email')}
          >
            <Mail size={20} color={channel === 'email' ? '#fff' : primaryColor} />
            <Text
              style={[
                styles.channelButtonText,
                channel === 'email' && styles.channelButtonTextActive,
              ]}
            >
              Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.channelButton,
              channel === 'whatsapp' && { backgroundColor: primaryColor },
            ]}
            onPress={() => setChannel('whatsapp')}
          >
            <MessageCircle size={20} color={channel === 'whatsapp' ? '#fff' : primaryColor} />
            <Text
              style={[
                styles.channelButtonText,
                channel === 'whatsapp' && styles.channelButtonTextActive,
              ]}
            >
              WhatsApp
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.channelButton,
              channel === 'both' && { backgroundColor: primaryColor },
            ]}
            onPress={() => setChannel('both')}
          >
            <Send size={20} color={channel === 'both' ? '#fff' : primaryColor} />
            <Text
              style={[
                styles.channelButtonText,
                channel === 'both' && styles.channelButtonTextActive,
              ]}
            >
              Ambos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {channel !== 'whatsapp' && (
        <View style={styles.section}>
          <Text style={styles.label}>Asunto</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Escribe el asunto del correo..."
            placeholderTextColor="#9ca3af"
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Mensaje</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={content}
          onChangeText={setContent}
          placeholder="Escribe tu mensaje aquí..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />
        <Text style={styles.hint}>
          Variables disponibles: &#123;nombre&#125;, &#123;evento&#125;, &#123;fecha&#125;, &#123;hora&#125;, &#123;lugar&#125;
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${primaryColor}20` }]}
          onPress={() => setShowScheduleModal(true)}
        >
          <Clock size={20} color={primaryColor} />
          <Text style={[styles.actionButtonText, { color: primaryColor }]}>Programar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: primaryColor }]}
          onPress={handleSendNow}
        >
          <Send size={20} color="#fff" />
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>Enviar Ahora</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderScheduledTab = () => (
    <View style={styles.tabContent}>
      {scheduledMessages.length === 0 ? (
        <View style={styles.emptyState}>
          <Clock size={48} color="#9ca3af" />
          <Text style={styles.emptyStateText}>No hay mensajes programados</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {scheduledMessages.map((message) => (
            <View key={message.id} style={styles.messageCard}>
              <View style={styles.messageCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.messageCardTitle} numberOfLines={1}>
                    {message.subject || 'Sin asunto'}
                  </Text>
                  <Text style={styles.messageCardSubtitle} numberOfLines={2}>
                    {message.content}
                  </Text>
                </View>
                <View style={styles.messageCardStatus}>
                  {getStatusIcon(message.status)}
                  <Text style={styles.messageCardStatusText}>{message.status}</Text>
                </View>
              </View>

              <View style={styles.messageCardFooter}>
                <View style={styles.messageCardInfo}>
                  {getChannelIcon(message.channel)}
                  <Text style={styles.messageCardInfoText}>
                    {new Date(message.scheduledFor).toLocaleString('es-ES')}
                  </Text>
                  <Text style={styles.messageCardInfoText}>• {message.recipientCount} destinatarios</Text>
                </View>

                <View style={styles.messageCardActions}>
                  {message.status === 'scheduled' && (
                    <TouchableOpacity
                      style={styles.messageCardAction}
                      onPress={() => handleSendScheduledMessage(message.id)}
                    >
                      <Send size={18} color={primaryColor} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.messageCardAction}
                    onPress={() => handleDeleteScheduledMessage(message.id)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderTemplatesTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: primaryColor }]}
        onPress={() => setShowTemplateModal(true)}
      >
        <Plus size={20} color="#fff" />
        <Text style={styles.createButtonText}>Nueva Plantilla</Text>
      </TouchableOpacity>

      {templates.length === 0 ? (
        <View style={styles.emptyState}>
          <FileText size={48} color="#9ca3af" />
          <Text style={styles.emptyStateText}>No hay plantillas guardadas</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {templates.map((template) => (
            <View key={template.id} style={styles.templateCard}>
              <View style={styles.templateCardHeader}>
                <Text style={styles.templateCardTitle}>{template.name}</Text>
                {getChannelIcon(template.channel)}
              </View>
              {template.subject && (
                <Text style={styles.templateCardSubject}>{template.subject}</Text>
              )}
              <Text style={styles.templateCardContent} numberOfLines={3}>
                {template.content}
              </Text>
              <View style={styles.templateCardActions}>
                <TouchableOpacity
                  style={[styles.templateAction, { backgroundColor: `${primaryColor}15` }]}
                  onPress={() => handleUseTemplate(template)}
                >
                  <Edit3 size={16} color={primaryColor} />
                  <Text style={[styles.templateActionText, { color: primaryColor }]}>Usar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.templateAction, { backgroundColor: '#fee' }]}
                  onPress={() => handleDeleteTemplate(template.id)}
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text style={[styles.templateActionText, { color: '#ef4444' }]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderHistoryTab = () => {
    const groupedHistory = messageHistory.reduce((acc, item) => {
      if (!acc[item.messageId]) {
        acc[item.messageId] = [];
      }
      acc[item.messageId].push(item);
      return acc;
    }, {} as Record<string, typeof messageHistory>);

    return (
      <View style={styles.tabContent}>
        {messageHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Eye size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No hay historial de mensajes</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {Object.entries(groupedHistory).map(([messageId, items]) => {
              const sentCount = items.filter((i) => i.status === 'sent').length;
              const failedCount = items.filter((i) => i.status === 'failed').length;
              const firstItem = items[0];

              return (
                <View key={messageId} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyCardDate}>
                        {new Date(firstItem.sentAt).toLocaleString('es-ES')}
                      </Text>
                      {getChannelIcon(firstItem.channel)}
                    </View>
                  </View>
                  <View style={styles.historyCardStats}>
                    <View style={styles.historyCardStat}>
                      <CheckCircle size={16} color="#10b981" />
                      <Text style={styles.historyCardStatText}>{sentCount} enviados</Text>
                    </View>
                    {failedCount > 0 && (
                      <View style={styles.historyCardStat}>
                        <XCircle size={16} color="#ef4444" />
                        <Text style={styles.historyCardStatText}>{failedCount} fallidos</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderAutomatedTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.automatedHeader}>
        <Text style={styles.automatedHeaderTitle}>Notificaciones Automatizadas</Text>
        <Text style={styles.automatedHeaderSubtitle}>
          Gestiona los mensajes que se enviarán automáticamente a tus invitados
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {automatedNotifications
          .sort((a, b) => {
            const order: NotificationType[] = ['invitation', 'reminder-15d', 'reminder-7d', 'reminder-1d', 'reminder-5h'];
            return order.indexOf(a.type) - order.indexOf(b.type);
          })
          .map((notification) => (
            <View
              key={notification.id}
              style={[
                styles.notificationCard,
                { borderColor: notification.enabled ? primaryColor : '#e5e7eb' },
              ]}
            >
              <View style={styles.notificationCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notificationCardTitle}>
                    {getNotificationLabel(notification.type)}
                  </Text>
                  {notification.scheduledFor && (
                    <Text style={styles.notificationCardSchedule}>
                      📅 {new Date(notification.scheduledFor).toLocaleString('es-ES')}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.notificationToggle,
                    notification.enabled && { backgroundColor: primaryColor },
                  ]}
                  onPress={() => handleToggleNotification(notification.id, !notification.enabled)}
                >
                  <View
                    style={[
                      styles.notificationToggleThumb,
                      notification.enabled && styles.notificationToggleThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.notificationPreview}>
                {getChannelIcon(notification.channel)}
                <Text style={styles.notificationPreviewSubject} numberOfLines={1}>
                  {notification.subject}
                </Text>
              </View>

              <Text style={styles.notificationPreviewContent} numberOfLines={3}>
                {notification.content}
              </Text>

              <View style={styles.testSection}>
                <Text style={styles.testSectionTitle}>Envío de Prueba</Text>
                <View style={styles.testInputsRow}>
                  {notification.channel !== 'whatsapp' && (
                    <TextInput
                      style={styles.testInput}
                      value={testEmails[notification.id] || ''}
                      onChangeText={(text) => setTestEmails({ ...testEmails, [notification.id]: text })}
                      placeholder="email@ejemplo.com"
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  )}
                  {notification.channel !== 'email' && (
                    <TextInput
                      style={styles.testInput}
                      value={testPhones[notification.id] || ''}
                      onChangeText={(text) => setTestPhones({ ...testPhones, [notification.id]: text })}
                      placeholder="+52 123 456 7890"
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                    />
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.testButton, { backgroundColor: `${primaryColor}20` }]}
                  onPress={() => handleSendTest(notification)}
                  disabled={sendingTest[notification.id]}
                >
                  <Send size={14} color={primaryColor} />
                  <Text style={[styles.testButtonText, { color: primaryColor }]}>
                    {sendingTest[notification.id] ? 'Enviando...' : 'Enviar Prueba'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.notificationCardActions}>
                <TouchableOpacity
                  style={[styles.notificationAction, { backgroundColor: `${primaryColor}15` }]}
                  onPress={() => handleEditNotification(notification)}
                >
                  <Edit3 size={16} color={primaryColor} />
                  <Text style={[styles.notificationActionText, { color: primaryColor }]}>
                    Editar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.notificationAction, { backgroundColor: primaryColor }]}
                  onPress={() => handleSendNotification(notification)}
                  disabled={!notification.enabled}
                >
                  <Send size={16} color="#fff" />
                  <Text style={[styles.notificationActionText, { color: '#fff' }]}>
                    Enviar Ahora
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </ScrollView>
    </View>
  );

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Evento no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Difusión del Evento</Text>
        <Text style={styles.subtitle}>{event.name}</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'automated' && { borderBottomColor: primaryColor }]}
          onPress={() => setActiveTab('automated')}
        >
          <Bell size={20} color={activeTab === 'automated' ? primaryColor : '#6b7280'} />
          <Text
            style={[styles.tabText, activeTab === 'automated' && { color: primaryColor }]}
          >
            Auto
          </Text>
          {automatedNotifications.filter((n) => n.enabled).length > 0 && (
            <View style={[styles.badge, { backgroundColor: primaryColor }]}>
              <Text style={styles.badgeText}>
                {automatedNotifications.filter((n) => n.enabled).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'compose' && { borderBottomColor: primaryColor }]}
          onPress={() => setActiveTab('compose')}
        >
          <Send size={20} color={activeTab === 'compose' ? primaryColor : '#6b7280'} />
          <Text
            style={[styles.tabText, activeTab === 'compose' && { color: primaryColor }]}
          >
            Redactar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'scheduled' && { borderBottomColor: primaryColor }]}
          onPress={() => setActiveTab('scheduled')}
        >
          <Clock size={20} color={activeTab === 'scheduled' ? primaryColor : '#6b7280'} />
          <Text
            style={[styles.tabText, activeTab === 'scheduled' && { color: primaryColor }]}
          >
            Programados
          </Text>
          {scheduledMessages.length > 0 && (
            <View style={[styles.badge, { backgroundColor: primaryColor }]}>
              <Text style={styles.badgeText}>{scheduledMessages.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && { borderBottomColor: primaryColor }]}
          onPress={() => setActiveTab('templates')}
        >
          <FileText size={20} color={activeTab === 'templates' ? primaryColor : '#6b7280'} />
          <Text
            style={[styles.tabText, activeTab === 'templates' && { color: primaryColor }]}
          >
            Plantillas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && { borderBottomColor: primaryColor }]}
          onPress={() => setActiveTab('history')}
        >
          <Eye size={20} color={activeTab === 'history' ? primaryColor : '#6b7280'} />
          <Text
            style={[styles.tabText, activeTab === 'history' && { color: primaryColor }]}
          >
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'compose' && renderComposeTab()}
      {activeTab === 'scheduled' && renderScheduledTab()}
      {activeTab === 'templates' && renderTemplatesTab()}
      {activeTab === 'history' && renderHistoryTab()}
      {activeTab === 'automated' && renderAutomatedTab()}

      <Modal
        visible={showTemplateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Plantilla</Text>

            <View style={styles.modalSection}>
              <Text style={styles.label}>Nombre de la Plantilla</Text>
              <TextInput
                style={styles.input}
                value={templateName}
                onChangeText={setTemplateName}
                placeholder="Ej: Bienvenida, Recordatorio, etc."
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.label}>Canal</Text>
              <View style={styles.channelSelector}>
                <TouchableOpacity
                  style={[
                    styles.channelButtonSmall,
                    templateChannel === 'email' && { backgroundColor: primaryColor },
                  ]}
                  onPress={() => setTemplateChannel('email')}
                >
                  <Mail size={18} color={templateChannel === 'email' ? '#fff' : primaryColor} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.channelButtonSmall,
                    templateChannel === 'whatsapp' && { backgroundColor: primaryColor },
                  ]}
                  onPress={() => setTemplateChannel('whatsapp')}
                >
                  <MessageCircle size={18} color={templateChannel === 'whatsapp' ? '#fff' : primaryColor} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.channelButtonSmall,
                    templateChannel === 'both' && { backgroundColor: primaryColor },
                  ]}
                  onPress={() => setTemplateChannel('both')}
                >
                  <Send size={18} color={templateChannel === 'both' ? '#fff' : primaryColor} />
                </TouchableOpacity>
              </View>
            </View>

            {templateChannel !== 'whatsapp' && (
              <View style={styles.modalSection}>
                <Text style={styles.label}>Asunto</Text>
                <TextInput
                  style={styles.input}
                  value={templateSubject}
                  onChangeText={setTemplateSubject}
                  placeholder="Asunto del correo..."
                  placeholderTextColor="#9ca3af"
                />
              </View>
            )}

            <View style={styles.modalSection}>
              <Text style={styles.label}>Mensaje</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={templateContent}
                onChangeText={setTemplateContent}
                placeholder="Contenido del mensaje..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowTemplateModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: primaryColor }]}
                onPress={handleSaveTemplate}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showScheduleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Programar Envío</Text>

            <View style={styles.modalSection}>
              <Text style={styles.label}>Fecha y Hora</Text>
              <TextInput
                style={styles.input}
                value={scheduledFor}
                onChangeText={setScheduledFor}
                placeholder="YYYY-MM-DD HH:MM"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.hint}>
                Formato: 2024-12-25 18:00 (dejar vacío para envío inmediato)
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowScheduleModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: primaryColor }]}
                onPress={() => {
                  handleScheduleMessage();
                  setShowScheduleModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Programar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditNotificationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                Editar {editingNotification ? getNotificationLabel(editingNotification.type) : 'Notificación'}
              </Text>

              {editingNotification && (
                <>
                  <View style={styles.modalSection}>
                    <Text style={styles.label}>Canal</Text>
                    <View style={styles.channelSelector}>
                      <TouchableOpacity
                        style={[
                          styles.channelButtonSmall,
                          editingNotification.channel === 'email' && { backgroundColor: primaryColor },
                        ]}
                        onPress={() => setEditingNotification({ ...editingNotification, channel: 'email' })}
                      >
                        <Mail size={18} color={editingNotification.channel === 'email' ? '#fff' : primaryColor} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.channelButtonSmall,
                          editingNotification.channel === 'whatsapp' && { backgroundColor: primaryColor },
                        ]}
                        onPress={() => setEditingNotification({ ...editingNotification, channel: 'whatsapp' })}
                      >
                        <MessageCircle size={18} color={editingNotification.channel === 'whatsapp' ? '#fff' : primaryColor} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.channelButtonSmall,
                          editingNotification.channel === 'both' && { backgroundColor: primaryColor },
                        ]}
                        onPress={() => setEditingNotification({ ...editingNotification, channel: 'both' })}
                      >
                        <Send size={18} color={editingNotification.channel === 'both' ? '#fff' : primaryColor} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {editingNotification.channel !== 'whatsapp' && (
                    <View style={styles.modalSection}>
                      <Text style={styles.label}>Asunto</Text>
                      <TextInput
                        style={styles.input}
                        value={editingNotification.subject}
                        onChangeText={(text) => setEditingNotification({ ...editingNotification, subject: text })}
                        placeholder="Asunto del correo..."
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <Text style={styles.label}>Mensaje</Text>
                    <TextInput
                      style={[styles.input, styles.textAreaLarge]}
                      value={editingNotification.content}
                      onChangeText={(text) => setEditingNotification({ ...editingNotification, content: text })}
                      placeholder="Contenido del mensaje..."
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={12}
                      textAlignVertical="top"
                    />
                    <Text style={styles.hint}>
                      Variables: &#123;nombre&#125;, &#123;evento&#125;, &#123;fecha&#125;, &#123;hora&#125;, &#123;lugar&#125;
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowEditNotificationModal(false);
                    setEditingNotification(null);
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: primaryColor }]}
                  onPress={handleSaveNotification}
                >
                  <Text style={styles.modalButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  textAreaLarge: {
    height: 200,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  channelSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  channelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  channelButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#374151',
  },
  channelButtonTextActive: {
    color: '#fff',
  },
  channelButtonSmall: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  messageCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  messageCardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  messageCardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  messageCardStatusText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize' as const,
  },
  messageCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  messageCardInfoText: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  messageCardAction: {
    padding: 8,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  templateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  templateCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  templateCardSubject: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  templateCardContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  templateCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  templateAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  templateActionText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  historyCardDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
  },
  historyCardStats: {
    flexDirection: 'row',
    gap: 16,
  },
  historyCardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyCardStatText: {
    fontSize: 13,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#374151',
  },
  automatedHeader: {
    marginBottom: 20,
  },
  automatedHeaderTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
  },
  automatedHeaderSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  notificationCardTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  notificationCardSchedule: {
    fontSize: 13,
    color: '#6b7280',
  },
  notificationToggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#d1d5db',
    padding: 2,
    justifyContent: 'center',
  },
  notificationToggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationToggleThumbActive: {
    alignSelf: 'flex-end',
  },
  notificationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  notificationPreviewSubject: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#374151',
    flex: 1,
  },
  notificationPreviewContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  notificationCardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  notificationAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  notificationActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  testSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  testSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 10,
  },
  testInputsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  testInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  testButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
