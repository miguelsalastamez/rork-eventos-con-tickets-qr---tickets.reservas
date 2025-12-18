import { Event, User, UserRole } from '@/types';

export function isEventOwner(event: Event, user: User | null): boolean {
  if (!user) return false;
  return event.createdBy === user.id;
}

export function canEditEvent(event: Event, user: User | null): boolean {
  if (!user) return false;
  
  if (isEventOwner(event, user)) return true;
  
  if (user.role === 'super_admin' || user.role === 'seller_admin') return true;
  
  if (user.role === 'collaborator' && event.organizationId === user.organizationId) {
    return true;
  }
  
  return false;
}

export function canDeleteEvent(event: Event, user: User | null): boolean {
  if (!user) return false;
  
  if (isEventOwner(event, user)) return true;
  
  if (user.role === 'super_admin' || user.role === 'seller_admin') {
    if (event.organizationId === user.organizationId) return true;
  }
  
  return false;
}

export function canManageEventSettings(event: Event, user: User | null): boolean {
  return canEditEvent(event, user);
}

export function canManageEventTickets(event: Event, user: User | null): boolean {
  if (!user) return false;
  
  if (isEventOwner(event, user)) return true;
  
  if (user.role === 'super_admin' || user.role === 'seller_admin') {
    if (event.organizationId === user.organizationId) return true;
  }
  
  return false;
}

export function canManageAttendees(event: Event, user: User | null): boolean {
  return canEditEvent(event, user);
}

export function canManagePrizesAndRaffle(event: Event, user: User | null): boolean {
  return canEditEvent(event, user);
}

export function canSendMessages(event: Event, user: User | null): boolean {
  return canEditEvent(event, user);
}

export function canViewEvent(event: Event, user: User | null): boolean {
  return true;
}

export function getUserRoleLabel(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Administrador';
    case 'seller_admin':
      return 'Administrador';
    case 'collaborator':
      return 'Colaborador';
    case 'viewer':
      return 'Visitante';
    default:
      return 'Usuario';
  }
}
