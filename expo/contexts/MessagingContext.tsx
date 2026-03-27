import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { MessageTemplate, ScheduledMessage, MessageHistory, AutomatedNotification } from '@/types';

const TEMPLATES_STORAGE_KEY = '@eventpass_message_templates';
const SCHEDULED_MESSAGES_STORAGE_KEY = '@eventpass_scheduled_messages';
const MESSAGE_HISTORY_STORAGE_KEY = '@eventpass_message_history';
const AUTOMATED_NOTIFICATIONS_STORAGE_KEY = '@eventpass_automated_notifications';

export const [MessagingProvider, useMessaging] = createContextHook(() => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([]);
  const [automatedNotifications, setAutomatedNotifications] = useState<AutomatedNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storedTemplates, storedScheduled, storedHistory, storedAutomated] = await Promise.all([
        AsyncStorage.getItem(TEMPLATES_STORAGE_KEY),
        AsyncStorage.getItem(SCHEDULED_MESSAGES_STORAGE_KEY),
        AsyncStorage.getItem(MESSAGE_HISTORY_STORAGE_KEY),
        AsyncStorage.getItem(AUTOMATED_NOTIFICATIONS_STORAGE_KEY),
      ]);

      if (storedTemplates) setTemplates(JSON.parse(storedTemplates));
      if (storedScheduled) setScheduledMessages(JSON.parse(storedScheduled));
      if (storedHistory) setMessageHistory(JSON.parse(storedHistory));
      if (storedAutomated) setAutomatedNotifications(JSON.parse(storedAutomated));
    } catch (error) {
      console.error('Error loading messaging data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTemplate = useCallback(async (template: MessageTemplate) => {
    const updated = [...templates, template];
    setTemplates(updated);
    await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
  }, [templates]);

  const updateTemplate = useCallback(async (templateId: string, updates: Partial<MessageTemplate>) => {
    const updated = templates.map((t) => (t.id === templateId ? { ...t, ...updates } : t));
    setTemplates(updated);
    await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
  }, [templates]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    const updated = templates.filter((t) => t.id !== templateId);
    setTemplates(updated);
    await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
  }, [templates]);

  const scheduleMessage = useCallback(async (message: ScheduledMessage) => {
    const updated = [...scheduledMessages, message];
    setScheduledMessages(updated);
    await AsyncStorage.setItem(SCHEDULED_MESSAGES_STORAGE_KEY, JSON.stringify(updated));
  }, [scheduledMessages]);

  const updateScheduledMessage = useCallback(async (messageId: string, updates: Partial<ScheduledMessage>) => {
    const updated = scheduledMessages.map((m) => (m.id === messageId ? { ...m, ...updates } : m));
    setScheduledMessages(updated);
    await AsyncStorage.setItem(SCHEDULED_MESSAGES_STORAGE_KEY, JSON.stringify(updated));
  }, [scheduledMessages]);

  const deleteScheduledMessage = useCallback(async (messageId: string) => {
    const updated = scheduledMessages.filter((m) => m.id !== messageId);
    setScheduledMessages(updated);
    await AsyncStorage.setItem(SCHEDULED_MESSAGES_STORAGE_KEY, JSON.stringify(updated));
  }, [scheduledMessages]);

  const getEventScheduledMessages = useCallback((eventId: string) => {
    return scheduledMessages.filter((m) => m.eventId === eventId);
  }, [scheduledMessages]);

  const addMessageHistory = useCallback(async (history: MessageHistory) => {
    const updated = [...messageHistory, history];
    setMessageHistory(updated);
    await AsyncStorage.setItem(MESSAGE_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  }, [messageHistory]);

  const addMultipleMessageHistory = useCallback(async (newHistory: MessageHistory[]) => {
    const updated = [...messageHistory, ...newHistory];
    setMessageHistory(updated);
    await AsyncStorage.setItem(MESSAGE_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  }, [messageHistory]);

  const getEventMessageHistory = useCallback((eventId: string) => {
    return messageHistory.filter((h) => h.eventId === eventId);
  }, [messageHistory]);

  const getMessageHistory = useCallback((messageId: string) => {
    return messageHistory.filter((h) => h.messageId === messageId);
  }, [messageHistory]);

  const sendMessage = useCallback(async (messageId: string, recipients: { id: string; name: string; email: string; phone?: string }[]) => {
    const message = scheduledMessages.find((m) => m.id === messageId);
    if (!message) return { sentCount: 0, failedCount: 0 };

    updateScheduledMessage(messageId, { status: 'sending' });

    const newHistory: MessageHistory[] = recipients.map((recipient) => ({
      id: `history-${Date.now()}-${recipient.id}`,
      messageId,
      eventId: message.eventId,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      recipientPhone: recipient.phone,
      channel: message.channel,
      status: 'sent' as const,
      sentAt: new Date().toISOString(),
    }));

    await addMultipleMessageHistory(newHistory);

    updateScheduledMessage(messageId, {
      status: 'sent',
      sentAt: new Date().toISOString(),
    });

    return { sentCount: recipients.length, failedCount: 0 };
  }, [scheduledMessages, updateScheduledMessage, addMultipleMessageHistory]);

  const addAutomatedNotification = useCallback(async (notification: AutomatedNotification) => {
    const updated = [...automatedNotifications, notification];
    setAutomatedNotifications(updated);
    await AsyncStorage.setItem(AUTOMATED_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  }, [automatedNotifications]);

  const updateAutomatedNotification = useCallback(async (notificationId: string, updates: Partial<AutomatedNotification>) => {
    const updated = automatedNotifications.map((n) =>
      n.id === notificationId ? { ...n, ...updates } : n
    );
    setAutomatedNotifications(updated);
    await AsyncStorage.setItem(AUTOMATED_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  }, [automatedNotifications]);

  const getEventAutomatedNotifications = useCallback((eventId: string) => {
    return automatedNotifications.filter((n) => n.eventId === eventId);
  }, [automatedNotifications]);

  const initializeEventNotifications = useCallback(async (
    eventId: string,
    eventName: string,
    eventDate: string,
    eventTime: string,
    venueName: string,
    location: string
  ) => {
    const existingNotifications = automatedNotifications.filter((n) => n.eventId === eventId);
    if (existingNotifications.length > 0) {
      console.log('Notifications already initialized for this event');
      return;
    }

    const baseNotifications: AutomatedNotification[] = [
      {
        id: `notification-${eventId}-confirmation`,
        eventId,
        type: 'purchase_confirmation',
        name: 'Confirmación de Compra',
        channel: 'email',
        subject: `¡Confirmación de Compra - ${eventName}!`,
        content: `¡Gracias por tu compra!\n\nHas adquirido un boleto para ${eventName}.\n\nFecha: ${eventDate}\nHora: ${eventTime}\nLugar: ${venueName}\nDirección: ${location}\n\nTe esperamos!`,
        isActive: true,
        trigger: 'immediate',
      },
      {
        id: `notification-${eventId}-reminder-24h`,
        eventId,
        type: 'event_reminder',
        name: 'Recordatorio 24 horas antes',
        channel: 'email',
        subject: `¡Mañana es ${eventName}!`,
        content: `¡No olvides que mañana es ${eventName}!\n\nFecha: ${eventDate}\nHora: ${eventTime}\nLugar: ${venueName}\nDirección: ${location}\n\n¡Te esperamos!`,
        isActive: true,
        trigger: 'before_event',
        triggerHours: 24,
      },
      {
        id: `notification-${eventId}-reminder-2h`,
        eventId,
        type: 'event_reminder',
        name: 'Recordatorio 2 horas antes',
        channel: 'whatsapp',
        content: `¡${eventName} comienza en 2 horas!\n\nHora: ${eventTime}\nLugar: ${venueName}\nDirección: ${location}\n\n¡Nos vemos pronto!`,
        isActive: true,
        trigger: 'before_event',
        triggerHours: 2,
      },
      {
        id: `notification-${eventId}-checkin`,
        eventId,
        type: 'check_in_confirmation',
        name: 'Confirmación de Check-in',
        channel: 'whatsapp',
        content: `¡Bienvenido a ${eventName}!\n\nTu check-in se ha realizado exitosamente.\n\n¡Disfruta del evento!`,
        isActive: true,
        trigger: 'immediate',
      },
    ];

    for (const notification of baseNotifications) {
      await addAutomatedNotification(notification);
    }

    console.log('✅ Event notifications initialized');
  }, [automatedNotifications, addAutomatedNotification]);

  return useMemo(() => ({
    templates,
    scheduledMessages,
    messageHistory,
    automatedNotifications,
    isLoading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    scheduleMessage,
    updateScheduledMessage,
    deleteScheduledMessage,
    getEventScheduledMessages,
    addMessageHistory,
    addMultipleMessageHistory,
    getEventMessageHistory,
    getMessageHistory,
    sendMessage,
    addAutomatedNotification,
    updateAutomatedNotification,
    getEventAutomatedNotifications,
    initializeEventNotifications,
  }), [templates, scheduledMessages, messageHistory, automatedNotifications, isLoading, addTemplate, updateTemplate, deleteTemplate, scheduleMessage, updateScheduledMessage, deleteScheduledMessage, getEventScheduledMessages, addMessageHistory, addMultipleMessageHistory, getEventMessageHistory, getMessageHistory, sendMessage, addAutomatedNotification, updateAutomatedNotification, getEventAutomatedNotifications, initializeEventNotifications]);
});
