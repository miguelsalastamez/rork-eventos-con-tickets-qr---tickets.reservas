export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  venueName: string;
  location: string;
  imageUrl: string;
  organizerLogoUrl?: string;
  venuePlanUrl?: string;
  employeeNumberLabel?: string;
  successSoundId?: string;
  errorSoundId?: string;
  vibrationEnabled?: boolean;
  vibrationIntensity?: 'light' | 'medium' | 'heavy';
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  organizationId?: string;
  createdBy: string;
  createdAt: string;
}

export interface Attendee {
  id: string;
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
  employeeNumber: string;
  checkedIn: boolean;
  checkedInAt?: string;
  ticketCode: string;
}

export interface CheckInData {
  attendeeId: string;
  eventId: string;
  timestamp: string;
}

export interface Prize {
  id: string;
  eventId: string;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}

export interface RaffleWinner {
  id: string;
  eventId: string;
  prizeId: string;
  attendeeId: string;
  prizeName: string;
  attendeeName: string;
  timestamp: string;
}

export type MessageChannel = 'email' | 'whatsapp' | 'both';
export type MessageStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface MessageTemplate {
  id: string;
  name: string;
  subject?: string;
  content: string;
  channel: MessageChannel;
  createdAt: string;
}

export interface ScheduledMessage {
  id: string;
  eventId: string;
  templateId?: string;
  subject?: string;
  content: string;
  channel: MessageChannel;
  scheduledFor: string;
  status: MessageStatus;
  recipientCount: number;
  sentCount?: number;
  failedCount?: number;
  createdAt: string;
  sentAt?: string;
}

export interface MessageHistory {
  id: string;
  eventId: string;
  messageId: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  channel: MessageChannel;
  status: 'sent' | 'failed';
  error?: string;
  sentAt: string;
}

export type NotificationType = 'invitation' | 'reminder-15d' | 'reminder-7d' | 'reminder-1d' | 'reminder-5h' | 'purchase_confirmation' | 'event_reminder' | 'check_in_confirmation';

export interface AutomatedNotification {
  id: string;
  eventId: string;
  type: NotificationType;
  name: string;
  enabled?: boolean;
  isActive?: boolean;
  subject?: string;
  content: string;
  channel: MessageChannel;
  scheduledFor?: string;
  trigger?: 'immediate' | 'before_event';
  triggerHours?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'super_admin' | 'seller_admin' | 'collaborator' | 'viewer';
export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'trial';

export interface Organization {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  ownerId: string;
  primaryColor?: string;
  secondaryColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  organizationId?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  organizationId?: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  price: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  canCreateEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canManageAttendees: boolean;
  canCheckInAttendees: boolean;
  canManagePrizes: boolean;
  canManageRaffle: boolean;
  canViewReports: boolean;
  canManageOrganization: boolean;
  canManageUsers: boolean;
  canManageSubscription: boolean;
  canSendMessages: boolean;
  maxEvents?: number;
  maxAttendeesPerEvent?: number;
}

export interface FeatureLimits {
  maxEvents: number;
  maxAttendeesPerEvent: number;
  hasEmailSupport: boolean;
  hasWhatsAppSupport: boolean;
  hasAdvancedReports: boolean;
  hasCustomBranding: boolean;
  hasPrioritySupport: boolean;
}

export type CapacityType = 'shared' | 'dedicated' | 'unlimited';
export type FormFieldType = 'text' | 'radio' | 'checkbox' | 'dropdown' | 'email' | 'phone' | 'url' | 'birthdate' | 'date';
export type PaymentMethod = 'stripe' | 'transfer';
export type TicketPurchaseStatus = 'pending' | 'completed' | 'failed' | 'awaiting_transfer_confirmation';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
}

export interface Ticket {
  id: string;
  eventId: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  currency: string;
  saleStartDate: string;
  saleEndDate: string;
  capacityType: CapacityType;
  sharedCapacityPoolId?: string;
  sharedCapacityLimit?: number;
  dedicatedCapacity?: number;
  salesLimit?: number;
  soldCount: number;
  formFields: FormField[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CapacityPool {
  id: string;
  eventId: string;
  name: string;
  totalCapacity: number;
  usedCapacity: number;
  createdAt: string;
}

export interface TicketPurchase {
  id: string;
  eventId: string;
  ticketId: string;
  ticketName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  buyerEmail: string;
  buyerFullName: string;
  buyerPhone?: string;
  formData: Record<string, any>;
  paymentMethod: PaymentMethod;
  paymentIntentId?: string;
  transferProofUrl?: string;
  status: TicketPurchaseStatus;
  purchasedAt: string;
  confirmedAt?: string;
  userId?: string;
}

export interface BuyerAccount {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  temporaryPassword?: string;
  createdAt: string;
  purchases: string[];
}
