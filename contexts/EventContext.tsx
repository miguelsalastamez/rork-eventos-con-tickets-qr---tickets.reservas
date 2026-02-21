import { useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Event, Attendee, Prize, RaffleWinner } from '@/types';
import { trpc } from '@/lib/trpc';
import { useUser } from './UserContext';

export const [EventProvider, useEvents] = createContextHook(() => {
  const { authToken } = useUser();

  const eventsQuery = trpc.event.list.useQuery(undefined, {
    enabled: !!authToken,
  });

  const createEventMutation = trpc.event.create.useMutation({
    onSuccess: () => {
      eventsQuery.refetch();
    },
  });

  const updateEventMutation = trpc.event.update.useMutation({
    onSuccess: () => {
      eventsQuery.refetch();
    },
  });

  const deleteEventMutation = trpc.event.delete.useMutation({
    onSuccess: () => {
      eventsQuery.refetch();
    },
  });

  const createAttendeeMutation = trpc.attendee.create.useMutation();
  const createManyAttendeesMutation = trpc.attendee.createMany.useMutation();
  const checkInMutation = trpc.attendee.checkIn.useMutation();
  const toggleCheckInMutation = trpc.attendee.toggleCheckIn.useMutation();
  const checkInAllMutation = trpc.attendee.checkInAll.useMutation();
  const removeDuplicatesMutation = trpc.attendee.removeDuplicates.useMutation();

  const createPrizeMutation = trpc.event.prizes.create.useMutation();
  const createManyPrizesMutation = trpc.event.prizes.createMany.useMutation();
  const deletePrizeMutation = trpc.event.prizes.delete.useMutation();

  const addRaffleWinnerMutation = trpc.event.raffle.addWinner.useMutation();
  const addRaffleWinnersMutation = trpc.event.raffle.addWinners.useMutation();
  const deleteRaffleWinnerMutation = trpc.event.raffle.deleteWinner.useMutation();
  const deleteAllRaffleWinnersMutation = trpc.event.raffle.deleteAll.useMutation();

  const events = useMemo(() => eventsQuery.data || [], [eventsQuery.data]);
  const isLoading = eventsQuery.isLoading;

  const addEvent = useCallback(async (event: Omit<Event, 'id' | 'createdAt'>) => {
    console.log('🎉 Creating event via API:', event);

    try {
      const result = await createEventMutation.mutateAsync({
        name: event.name,
        description: event.description,
        date: event.date,
        time: event.time,
        venueName: event.venueName,
        location: event.location,
        imageUrl: event.imageUrl,
        organizerLogoUrl: event.organizerLogoUrl,
        venuePlanUrl: event.venuePlanUrl,
        employeeNumberLabel: event.employeeNumberLabel,
        successSoundId: event.successSoundId,
        errorSoundId: event.errorSoundId,
        vibrationEnabled: event.vibrationEnabled,
        vibrationIntensity: event.vibrationIntensity,
        primaryColor: event.primaryColor,
        secondaryColor: event.secondaryColor,
        accentColor: event.accentColor,
        organizationId: event.organizationId,
      });

      console.log('✅ Event created successfully:', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Failed to create event:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [createEventMutation]);

  const getOrganizationEvents = useCallback((organizationId: string) => {
    return events.filter((e) => e.organizationId === organizationId);
  }, [events]);

  const getUserEvents = useCallback((userId: string) => {
    return events.filter((e) => e.createdBy === userId);
  }, [events]);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<Event>) => {
    console.log('🔄 Updating event:', eventId, updates);

    try {
      await updateEventMutation.mutateAsync({
        id: eventId,
        name: updates.name,
        description: updates.description,
        date: updates.date,
        time: updates.time,
        venueName: updates.venueName,
        location: updates.location,
        imageUrl: updates.imageUrl,
        organizerLogoUrl: updates.organizerLogoUrl,
        venuePlanUrl: updates.venuePlanUrl,
        employeeNumberLabel: updates.employeeNumberLabel,
        successSoundId: updates.successSoundId,
        errorSoundId: updates.errorSoundId,
        vibrationEnabled: updates.vibrationEnabled,
        vibrationIntensity: updates.vibrationIntensity,
        primaryColor: updates.primaryColor,
        secondaryColor: updates.secondaryColor,
        accentColor: updates.accentColor,
      });
      console.log('✅ Event updated successfully');
    } catch (error) {
      console.error('❌ Failed to update event:', error);
      throw error;
    }
  }, [updateEventMutation]);

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      await deleteEventMutation.mutateAsync({ id: eventId });
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
      throw error;
    }
  }, [deleteEventMutation]);

  const addAttendee = useCallback(async (attendee: Attendee) => {
    try {
      const result = await createAttendeeMutation.mutateAsync({
        eventId: attendee.eventId,
        fullName: attendee.fullName,
        email: attendee.email,
        employeeNumber: attendee.employeeNumber,
        ticketCode: attendee.ticketCode,
      });

      eventsQuery.refetch();
      return result;
    } catch (error) {
      console.error('❌ Failed to add attendee:', error);
      throw error;
    }
  }, [createAttendeeMutation, eventsQuery]);

  const addMultipleAttendees = useCallback(async (newAttendees: Attendee[]) => {
    try {
      await createManyAttendeesMutation.mutateAsync({
        attendees: newAttendees.map(a => ({
          eventId: a.eventId,
          fullName: a.fullName,
          email: a.email,
          employeeNumber: a.employeeNumber,
          ticketCode: a.ticketCode,
        })),
      });

      eventsQuery.refetch();
    } catch (error) {
      console.error('❌ Failed to add multiple attendees:', error);
      throw error;
    }
  }, [createManyAttendeesMutation, eventsQuery]);

  const checkInAttendee = useCallback(async (attendeeId: string) => {
    try {
      const event = events.find(e =>
        e.attendees?.some((a: any) => a.id === attendeeId)
      );

      if (!event) {
        throw new Error('Event not found for attendee');
      }

      const attendee = event.attendees?.find((a: any) => a.id === attendeeId);
      if (!attendee) {
        throw new Error('Attendee not found');
      }

      await checkInMutation.mutateAsync({ ticketCode: attendee.ticketCode });
      eventsQuery.refetch();
    } catch (error) {
      console.error('❌ Failed to check in attendee:', error);
      throw error;
    }
  }, [checkInMutation, events, eventsQuery]);

  const toggleCheckInAttendee = useCallback(async (attendeeId: string) => {
    try {
      await toggleCheckInMutation.mutateAsync({ id: attendeeId });
      eventsQuery.refetch();
    } catch (error) {
      console.error('❌ Failed to toggle check in:', error);
      throw error;
    }
  }, [toggleCheckInMutation, eventsQuery]);

  const checkInAllAttendees = useCallback(async (eventId: string) => {
    try {
      await checkInAllMutation.mutateAsync({ eventId });
      eventsQuery.refetch();
    } catch (error) {
      console.error('❌ Failed to check in all attendees:', error);
      throw error;
    }
  }, [checkInAllMutation, eventsQuery]);

  const removeDuplicates = useCallback(async (eventId: string) => {
    try {
      const result = await removeDuplicatesMutation.mutateAsync({ eventId });
      eventsQuery.refetch();
      return result.removed;
    } catch (error) {
      console.error('❌ Failed to remove duplicates:', error);
      throw error;
    }
  }, [removeDuplicatesMutation, eventsQuery]);

  const getEventAttendees = useCallback((eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    return event?.attendees || [];
  }, [events]);

  const getAttendeeByTicketCode = useCallback((ticketCode: string) => {
    for (const event of events) {
      const attendee = event.attendees?.find((a: any) => a.ticketCode === ticketCode);
      if (attendee) return attendee;
    }
    return undefined;
  }, [events]);

  const getEventById = useCallback((eventId: string) => {
    return events.find((e) => e.id === eventId);
  }, [events]);

  const addPrize = useCallback(async (prize: Prize) => {
    try {
      await createPrizeMutation.mutateAsync({
        eventId: prize.eventId,
        name: prize.name,
        description: prize.description,
        imageUrl: prize.imageUrl,
        quantity: prize.quantity,
      });

      eventsQuery.refetch();
    } catch (error) {
      console.error('❌ Failed to add prize:', error);
      throw error;
    }
  }, [createPrizeMutation, eventsQuery]);

  const addMultiplePrizes = useCallback(async (newPrizes: Prize[]) => {
    try {
      await createManyPrizesMutation.mutateAsync({
        prizes: newPrizes.map(p => ({
          eventId: p.eventId,
          name: p.name,
          description: p.description,
          imageUrl: p.imageUrl,
          quantity: p.quantity,
        })),
      });

      eventsQuery.refetch();
    } catch (error) {
      console.error('❌ Failed to add multiple prizes:', error);
      throw error;
    }
  }, [createManyPrizesMutation, eventsQuery]);

  const deletePrize = useCallback(async (prizeId: string) => {
    try {
      await deletePrizeMutation.mutateAsync({ id: prizeId });
      eventsQuery.refetch();
    } catch (error) {
      console.error('❌ Failed to delete prize:', error);
      throw error;
    }
  }, [deletePrizeMutation, eventsQuery]);

  const getEventPrizes = useCallback((eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    return event?.prizes || [];
  }, [events]);

  const addRaffleWinner = useCallback(async (winner: RaffleWinner) => {
    try {
      await addRaffleWinnerMutation.mutateAsync({
        eventId: winner.eventId,
        prizeId: winner.prizeId,
        attendeeId: winner.attendeeId,
      });

      eventsQuery.refetch();
    } catch (error) {
      console.error('❌ Failed to add raffle winner:', error);
      throw error;
    }
  }, [addRaffleWinnerMutation, eventsQuery]);

  const addMultipleRaffleWinners = useCallback(async (newWinners: RaffleWinner[]) => {
    try {
      await addRaffleWinnersMutation.mutateAsync({
        winners: newWinners.map(w => ({
          eventId: w.eventId,
          prizeId: w.prizeId,
          attendeeId: w.attendeeId,
        })),
      });

      eventsQuery.refetch();
    } catch (error) {
      console.error('❌ Failed to add multiple raffle winners:', error);
      throw error;
    }
  }, [addRaffleWinnersMutation, eventsQuery]);

  const getEventRaffleWinners = useCallback((eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    return event?.raffleWinners || [];
  }, [events]);

  const deleteRaffleWinner = useCallback(async (winnerId: string) => {
    try {
      await deleteRaffleWinnerMutation.mutateAsync({ id: winnerId });
      eventsQuery.refetch();
    } catch (error) {
      console.error('❌ Failed to delete raffle winner:', error);
      throw error;
    }
  }, [deleteRaffleWinnerMutation, eventsQuery]);

  const deleteAllRaffleWinners = useCallback(async (eventId: string) => {
    try {
      await deleteAllRaffleWinnersMutation.mutateAsync({ eventId });
      eventsQuery.refetch();
    } catch (error) {
      console.error('❌ Failed to delete all raffle winners:', error);
      throw error;
    }
  }, [deleteAllRaffleWinnersMutation, eventsQuery]);

  const loadSampleData = useCallback(async () => {
    console.log('📦 Loading sample data...');

    const sampleEvents = [
      {
        name: 'Tech Conference 2026',
        description: 'The biggest tech event of the year.',
        date: '2026-05-15',
        time: '09:00',
        venueName: 'Expo Center',
        location: 'Silicon Valley, CA',
        imageUrl: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a',
        primaryColor: '#6366f1',
      },
      {
        name: 'Music Festival',
        description: 'A weekend of amazing live music.',
        date: '2026-07-20',
        time: '14:00',
        venueName: 'Green Park',
        location: 'Austin, TX',
        imageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c',
        primaryColor: '#ec4899',
      },
      {
        name: 'Startup Pitch Day',
        description: 'New startups pitching to investors.',
        date: '2026-03-10',
        time: '10:00',
        venueName: 'Innovation Hub',
        location: 'New York, NY',
        imageUrl: 'https://images.unsplash.com/photo-1475721027187-4024733923f9',
        primaryColor: '#10b981',
      }
    ];

    try {
      for (const eventData of sampleEvents) {
        const createdEvent = await addEvent(eventData as any);

        // Add sample attendees
        await addMultipleAttendees([
          {
            eventId: createdEvent.id,
            fullName: 'John Doe',
            email: `john.${Date.now()}@example.com`,
            employeeNumber: 'E001',
            ticketCode: `TC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          },
          {
            eventId: createdEvent.id,
            fullName: 'Jane Smith',
            email: `jane.${Date.now()}@example.com`,
            employeeNumber: 'E002',
            ticketCode: `TC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          }
        ] as any);

        // Add sample prizes
        await addMultiplePrizes([
          {
            eventId: createdEvent.id,
            name: 'Mystery Gift',
            description: 'A special surprise for the winner.',
            quantity: 1,
            imageUrl: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a',
          }
        ] as any);
      }

      console.log('✅ Sample data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load sample data:', error);
      throw error;
    }
  }, [addEvent, addMultipleAttendees, addMultiplePrizes]);

  const attendees = useMemo(() => {
    return events.flatMap(e => e.attendees || []);
  }, [events]);

  const prizes = useMemo(() => {
    return events.flatMap(e => e.prizes || []);
  }, [events]);

  const raffleWinners = useMemo(() => {
    return events.flatMap(e => e.raffleWinners || []);
  }, [events]);

  return useMemo(() => ({
    events,
    attendees,
    prizes,
    raffleWinners,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    addAttendee,
    addMultipleAttendees,
    checkInAttendee,
    toggleCheckInAttendee,
    checkInAllAttendees,
    getEventAttendees,
    getAttendeeByTicketCode,
    getEventById,
    getOrganizationEvents,
    getUserEvents,
    removeDuplicates,
    loadSampleData,
    addPrize,
    addMultiplePrizes,
    deletePrize,
    getEventPrizes,
    addRaffleWinner,
    addMultipleRaffleWinners,
    getEventRaffleWinners,
    deleteRaffleWinner,
    deleteAllRaffleWinners,
  }), [events, attendees, prizes, raffleWinners, isLoading, addEvent, updateEvent, deleteEvent, addAttendee, addMultipleAttendees, checkInAttendee, toggleCheckInAttendee, checkInAllAttendees, getEventAttendees, getAttendeeByTicketCode, getEventById, getOrganizationEvents, getUserEvents, removeDuplicates, loadSampleData, addPrize, addMultiplePrizes, deletePrize, getEventPrizes, addRaffleWinner, addMultipleRaffleWinners, getEventRaffleWinners, deleteRaffleWinner, deleteAllRaffleWinners]);
});
