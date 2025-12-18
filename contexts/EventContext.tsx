import { useCallback, useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Event, Attendee, Prize, RaffleWinner } from '@/types';
import { sampleEvents } from '@/mocks/sampleEvents';
import { supabase } from '@/lib/supabase';
import { useUser } from './UserContext';

export const [EventProvider, useEvents] = createContextHook(() => {
  const { user, createDemoUser } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [raffleWinners, setRaffleWinners] = useState<RaffleWinner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('📚 Loading data from Supabase...');
      
      const [eventsRes, attendeesRes, prizesRes, winnersRes] = await Promise.all([
        supabase.from('Event').select('*'),
        supabase.from('Attendee').select('*'),
        supabase.from('Prize').select('*'),
        supabase.from('RaffleWinner').select('*'),
      ]);

      if (eventsRes.data) {
        console.log('✅ Loaded', eventsRes.data.length, 'events from Supabase');
        setEvents(eventsRes.data as Event[]);
      }
      if (attendeesRes.data) setAttendees(attendeesRes.data as Attendee[]);
      if (prizesRes.data) setPrizes(prizesRes.data as Prize[]);
      if (winnersRes.data) setRaffleWinners(winnersRes.data as RaffleWinner[]);
    } catch (error) {
      console.error('❌ Error loading data from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addEvent = useCallback(async (event: Omit<Event, 'id' | 'createdAt'>) => {
    console.log('🎉 Creating event in Supabase:', event);
    
    try {
      let currentUser = user;
      if (!currentUser) {
        console.log('⚠️ No user found, creating demo user...');
        currentUser = await createDemoUser();
      }

      const { data: existingUser, error: userCheckError } = await supabase
        .from('User')
        .select('id')
        .eq('id', currentUser.id)
        .single();

      if (userCheckError || !existingUser) {
        console.log('⚠️ User not found in Supabase, creating...');
        const now = new Date().toISOString();
        const { error: userInsertError } = await supabase
          .from('User')
          .upsert({
            id: currentUser.id,
            email: currentUser.email,
            password: 'placeholder',
            fullName: currentUser.fullName,
            phone: currentUser.phone,
            role: currentUser.role,
            organizationId: currentUser.organizationId,
            createdAt: currentUser.createdAt,
            updatedAt: now,
          });
        
        if (userInsertError) {
          console.error('❌ Failed to create user in Supabase:', userInsertError);
          throw new Error(`Failed to ensure user exists: ${userInsertError.message}`);
        }
        console.log('✅ User created in Supabase:', currentUser.id);
      }

      const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const now = new Date().toISOString();
      
      const eventData: any = {
        id,
        name: event.name,
        description: event.description,
        date: event.date,
        time: event.time,
        venueName: event.venueName,
        location: event.location,
        imageUrl: event.imageUrl,
        successSoundId: event.successSoundId,
        errorSoundId: event.errorSoundId,
        vibrationEnabled: event.vibrationEnabled,
        vibrationIntensity: event.vibrationIntensity,
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
      };

      if (event.organizerLogoUrl) eventData.organizerLogoUrl = event.organizerLogoUrl;
      if (event.venuePlanUrl) eventData.venuePlanUrl = event.venuePlanUrl;
      if (event.employeeNumberLabel) eventData.employeeNumberLabel = event.employeeNumberLabel;
      if (event.primaryColor) eventData.primaryColor = event.primaryColor;
      if (event.secondaryColor) eventData.secondaryColor = event.secondaryColor;
      if (event.organizationId) eventData.organizationId = event.organizationId;

      console.log('📤 Sending to Supabase:', eventData);

      const { data, error } = await supabase
        .from('Event')
        .insert(eventData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to save event: ${error.message || JSON.stringify(error)}`);
      }
      
      console.log('✅ Event saved successfully to Supabase:', data);
      setEvents((prev) => [...prev, data as Event]);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Failed to save event to Supabase:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, createDemoUser]);

  const getOrganizationEvents = useCallback((organizationId: string) => {
    return events.filter((e) => e.organizationId === organizationId);
  }, [events]);

  const getUserEvents = useCallback((userId: string) => {
    return events.filter((e) => e.createdBy === userId);
  }, [events]);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<Event>) => {
    console.log('🔄 Updating event:', eventId, updates);
    
    try {
      const { error } = await supabase
        .from('Event')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;

      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, ...updates } : e)));
      console.log('✅ Event updated successfully');
    } catch (error) {
      console.error('❌ Failed to update event:', error);
      throw error;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      const { error } = await supabase.from('Event').delete().eq('id', eventId);
      if (error) throw error;

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setAttendees((prev) => prev.filter((a) => a.eventId !== eventId));
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
      throw error;
    }
  }, []);

  const addAttendee = useCallback(async (attendee: Attendee) => {
    try {
      const attendeeData = {
        ...attendee,
        id: attendee.id || `attendee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const { data, error } = await supabase
        .from('Attendee')
        .insert(attendeeData)
        .select()
        .single();

      if (error) throw error;

      setAttendees((prev) => [...prev, data as Attendee]);
    } catch (error) {
      console.error('❌ Failed to add attendee:', error);
      throw error;
    }
  }, []);

  const addMultipleAttendees = useCallback(async (newAttendees: Attendee[]) => {
    try {
      const attendeesWithIds = newAttendees.map(a => ({
        ...a,
        id: a.id || `attendee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));

      const { data, error } = await supabase
        .from('Attendee')
        .insert(attendeesWithIds)
        .select();

      if (error) throw error;

      setAttendees((prev) => [...prev, ...(data as Attendee[])]);
    } catch (error) {
      console.error('❌ Failed to add multiple attendees:', error);
      throw error;
    }
  }, []);

  const checkInAttendee = useCallback(async (attendeeId: string) => {
    try {
      const { error } = await supabase
        .from('Attendee')
        .update({ checkedIn: true, checkedInAt: new Date().toISOString() })
        .eq('id', attendeeId);

      if (error) throw error;

      setAttendees((prev) =>
        prev.map((a) =>
          a.id === attendeeId ? { ...a, checkedIn: true, checkedInAt: new Date().toISOString() } : a
        )
      );
    } catch (error) {
      console.error('❌ Failed to check in attendee:', error);
      throw error;
    }
  }, []);

  const toggleCheckInAttendee = useCallback(async (attendeeId: string) => {
    try {
      const attendee = attendees.find((a) => a.id === attendeeId);
      if (!attendee) return;

      const updates = attendee.checkedIn
        ? { checkedIn: false, checkedInAt: undefined }
        : { checkedIn: true, checkedInAt: new Date().toISOString() };

      const { error } = await supabase
        .from('Attendee')
        .update(updates)
        .eq('id', attendeeId);

      if (error) throw error;

      setAttendees((prev) =>
        prev.map((a) => (a.id === attendeeId ? { ...a, ...updates } : a))
      );
    } catch (error) {
      console.error('❌ Failed to toggle check in:', error);
      throw error;
    }
  }, [attendees]);

  const checkInAllAttendees = useCallback(async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('Attendee')
        .update({ checkedIn: true, checkedInAt: new Date().toISOString() })
        .eq('eventId', eventId)
        .eq('checkedIn', false);

      if (error) throw error;

      setAttendees((prev) =>
        prev.map((a) =>
          a.eventId === eventId && !a.checkedIn
            ? { ...a, checkedIn: true, checkedInAt: new Date().toISOString() }
            : a
        )
      );
    } catch (error) {
      console.error('❌ Failed to check in all attendees:', error);
      throw error;
    }
  }, []);

  const removeDuplicates = useCallback(async (eventId: string) => {
    const eventAttendees = attendees.filter((a) => a.eventId === eventId);
    
    const uniqueAttendees = eventAttendees.reduce((acc, current) => {
      const existingIndex = acc.findIndex((a) => a.email.toLowerCase() === current.email.toLowerCase());
      
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        const existing = acc[existingIndex];
        if (current.checkedIn && !existing.checkedIn) {
          acc[existingIndex] = current;
        } else if (new Date(current.checkedInAt || 0) > new Date(existing.checkedInAt || 0)) {
          acc[existingIndex] = current;
        }
      }
      
      return acc;
    }, [] as Attendee[]);

    const duplicateIds = eventAttendees
      .filter((a) => !uniqueAttendees.find((u) => u.id === a.id))
      .map((a) => a.id);

    if (duplicateIds.length > 0) {
      try {
        const { error } = await supabase
          .from('Attendee')
          .delete()
          .in('id', duplicateIds);

        if (error) throw error;

        setAttendees((prev) => prev.filter((a) => !duplicateIds.includes(a.id)));
      } catch (error) {
        console.error('❌ Failed to remove duplicates:', error);
        throw error;
      }
    }
    
    return eventAttendees.length - uniqueAttendees.length;
  }, [attendees]);

  const getEventAttendees = useCallback((eventId: string) => {
    return attendees.filter((a) => a.eventId === eventId);
  }, [attendees]);

  const getAttendeeByTicketCode = useCallback((ticketCode: string) => {
    return attendees.find((a) => a.ticketCode === ticketCode);
  }, [attendees]);

  const getEventById = useCallback((eventId: string) => {
    return events.find((e) => e.id === eventId);
  }, [events]);

  const addPrize = useCallback(async (prize: Prize) => {
    try {
      const prizeData = {
        ...prize,
        id: prize.id || `prize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const { data, error } = await supabase
        .from('Prize')
        .insert(prizeData)
        .select()
        .single();

      if (error) throw error;

      setPrizes((prev) => [...prev, data as Prize]);
    } catch (error) {
      console.error('❌ Failed to add prize:', error);
      throw error;
    }
  }, []);

  const addMultiplePrizes = useCallback(async (newPrizes: Prize[]) => {
    try {
      const prizesWithIds = newPrizes.map(p => ({
        ...p,
        id: p.id || `prize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));

      const { data, error } = await supabase
        .from('Prize')
        .insert(prizesWithIds)
        .select();

      if (error) throw error;

      setPrizes((prev) => [...prev, ...(data as Prize[])]);
    } catch (error) {
      console.error('❌ Failed to add multiple prizes:', error);
      throw error;
    }
  }, []);

  const deletePrize = useCallback(async (prizeId: string) => {
    try {
      const { error } = await supabase.from('Prize').delete().eq('id', prizeId);
      if (error) throw error;

      setPrizes((prev) => prev.filter((p) => p.id !== prizeId));
    } catch (error) {
      console.error('❌ Failed to delete prize:', error);
      throw error;
    }
  }, []);

  const getEventPrizes = useCallback((eventId: string) => {
    return prizes.filter((p) => p.eventId === eventId);
  }, [prizes]);

  const addRaffleWinner = useCallback(async (winner: RaffleWinner) => {
    try {
      const winnerData = {
        ...winner,
        id: winner.id || `winner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const { data, error } = await supabase
        .from('RaffleWinner')
        .insert(winnerData)
        .select()
        .single();

      if (error) throw error;

      setRaffleWinners((prev) => [...prev, data as RaffleWinner]);
    } catch (error) {
      console.error('❌ Failed to add raffle winner:', error);
      throw error;
    }
  }, []);

  const addMultipleRaffleWinners = useCallback(async (newWinners: RaffleWinner[]) => {
    try {
      const winnersWithIds = newWinners.map(w => ({
        ...w,
        id: w.id || `winner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));

      const { data, error } = await supabase
        .from('RaffleWinner')
        .insert(winnersWithIds)
        .select();

      if (error) throw error;

      setRaffleWinners((prev) => [...prev, ...(data as RaffleWinner[])]);
    } catch (error) {
      console.error('❌ Failed to add multiple raffle winners:', error);
      throw error;
    }
  }, []);

  const getEventRaffleWinners = useCallback((eventId: string) => {
    return raffleWinners.filter((w) => w.eventId === eventId);
  }, [raffleWinners]);

  const deleteRaffleWinner = useCallback(async (winnerId: string) => {
    try {
      const { error } = await supabase.from('RaffleWinner').delete().eq('id', winnerId);
      if (error) throw error;

      setRaffleWinners((prev) => prev.filter((w) => w.id !== winnerId));
    } catch (error) {
      console.error('❌ Failed to delete raffle winner:', error);
      throw error;
    }
  }, []);

  const deleteAllRaffleWinners = useCallback(async (eventId: string) => {
    try {
      const { error } = await supabase.from('RaffleWinner').delete().eq('eventId', eventId);
      if (error) throw error;

      setRaffleWinners((prev) => prev.filter((w) => w.eventId !== eventId));
    } catch (error) {
      console.error('❌ Failed to delete all raffle winners:', error);
      throw error;
    }
  }, []);

  const loadSampleData = useCallback(async () => {
    console.log('📦 Loading sample data...');
    try {
      const allAttendees: Attendee[] = [];
      
      sampleEvents.forEach((event: any) => {
        if (event.attendees && Array.isArray(event.attendees)) {
          allAttendees.push(...event.attendees);
        }
      });

      const eventsWithoutAttendees = sampleEvents.map((event) => {
        const copy = { ...event } as any;
        delete copy.attendees;
        return copy;
      });

      const { data: eventData, error: eventError } = await supabase
        .from('Event')
        .insert(eventsWithoutAttendees)
        .select();

      if (eventError) throw eventError;

      const { data: attendeeData, error: attendeeError } = await supabase
        .from('Attendee')
        .insert(allAttendees)
        .select();

      if (attendeeError) throw attendeeError;

      setEvents(eventData as Event[]);
      setAttendees(attendeeData as Attendee[]);

      console.log('✅ Sample data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading sample data:', error);
      throw error;
    }
  }, []);

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
