import { supabase } from '../utils/supabaseClient';
import { MoodEntry, MoodRating } from '../types';

// Format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Normalize time
  return d.toISOString().split('T')[0];
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  return formatDate(new Date());
};

// Check if a date is today
export const isToday = (dateString: string): boolean => {
  return dateString === getTodayDate();
};

// Check if a date is yesterday
export const isYesterday = (dateString: string): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === formatDate(yesterday);
};

// Check if a date is in the past
export const isPastDate = (dateString: string): boolean => {
  const today = getTodayDate();
  return dateString < today;
};

// Get mood entry for a specific date
export const getMoodEntryForDate = async (date: string): Promise<MoodEntry | null> => {
  try {
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return null;
    }
    
    if (!session || !session.user) {
      console.error('No authenticated user found');
      return null;
    }
    
    const userId = session.user.id;
    console.log(`Querying mood entry for date: ${date} and user: ${userId}`);
    
    // Query the database
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - this is not an error for us
        console.log(`No mood entry found for date: ${date}`);
        return null;
      }
      console.error('Error fetching mood entry:', error);
      return null;
    }
    
    console.log(`Found mood entry for date ${date}:`, data);
    return data as MoodEntry;
  } catch (error) {
    console.error('Unexpected error in getMoodEntryForDate:', error);
    return null;
  }
};

// Get mood entry for today
export const getTodayMoodEntry = async (): Promise<MoodEntry | null> => {
  try {
    const today = getTodayDate();
    console.log(`Getting mood entry for today: ${today}`);
    return await getMoodEntryForDate(today);
  } catch (error) {
    console.error('Error in getTodayMoodEntry:', error);
    return null;
  }
};

// Save mood entry for a specific date
export const saveMoodForDate = async (date: string, rating: MoodRating, note?: string): Promise<MoodEntry | null> => {
  try {
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return null;
    }
    
    if (!session || !session.user) {
      console.error('No authenticated user found');
      return null;
    }
    
    const userId = session.user.id;
    console.log(`Saving mood for date (${date}): ${rating} for user ${userId}`);
    
    // Check if an entry already exists for this date
    const existingEntry = await getMoodEntryForDate(date);
    
    if (existingEntry) {
      console.log('Updating existing mood entry for date:', existingEntry);
      // Update existing entry
      const { data, error } = await supabase
        .from('mood_entries')
        .update({ rating, note })
        .eq('id', existingEntry.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating mood entry:', error);
        return null;
      }
      
      console.log('Successfully updated mood entry:', data);
      return data as MoodEntry;
    } else {
      console.log('Creating new mood entry for date:', date);
      // Create new entry
      const { data, error } = await supabase
        .from('mood_entries')
        .insert([
          { user_id: userId, date, rating, note }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating mood entry:', error);
        return null;
      }
      
      console.log('Successfully created new mood entry:', data);
      return data as MoodEntry;
    }
  } catch (error) {
    console.error(`Unexpected error in saveMoodForDate (${date}):`, error);
    return null;
  }
};

// Save mood entry for today
export const saveTodayMood = async (rating: MoodRating, note?: string): Promise<MoodEntry | null> => {
  const today = getTodayDate();
  return saveMoodForDate(today, rating, note);
};

// Get all mood entries sorted by date
export const getAllMoodEntries = async (): Promise<MoodEntry[]> => {
  try {
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return [];
    }
    
    if (!session || !session.user) {
      console.error('No authenticated user found');
      return [];
    }
    
    const userId = session.user.id;
    
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching all mood entries:', error);
      return [];
    }
    
    return data as MoodEntry[];
  } catch (error) {
    console.error('Unexpected error in getAllMoodEntries:', error);
    return [];
  }
};

// Get recent mood entries for the current week (Sunday to Saturday)
export const getCurrentWeekMoodEntries = async (): Promise<MoodEntry[]> => {
  try {
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return [];
    }
    
    if (!session || !session.user) {
      console.error('No authenticated user found');
      return [];
    }
    
    const userId = session.user.id;
    
    // Get current date
    const now = new Date();
    
    // Calculate the start of the week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Go back to Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate the end of the week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Go forward to Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    const startDate = formatDate(startOfWeek);
    const endDate = formatDate(endOfWeek);
    
    console.log(`Fetching mood entries from ${startDate} to ${endDate}`);
    
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching weekly mood entries:', error);
      return [];
    }
    
    return data as MoodEntry[];
  } catch (error) {
    console.error('Unexpected error in getCurrentWeekMoodEntries:', error);
    return [];
  }
};

// Get recent mood entries
export const getRecentMoodEntries = async (days: number = 7): Promise<MoodEntry[]> => {
  try {
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return [];
    }
    
    if (!session || !session.user) {
      console.error('No authenticated user found');
      return [];
    }
    
    const userId = session.user.id;
    
    const endDate = getTodayDate();
    const startDate = formatDate(new Date(Date.now() - (days * 24 * 60 * 60 * 1000)));
    
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching recent mood entries:', error);
      return [];
    }
    
    return data as MoodEntry[];
  } catch (error) {
    console.error('Unexpected error in getRecentMoodEntries:', error);
    return [];
  }
};

// Calculate weekly average mood
export const getWeeklyAverageMood = async (): Promise<number | null> => {
  try {
    const entries = await getCurrentWeekMoodEntries();
    
    if (entries.length === 0) return null;
    
    const sum = entries.reduce((total, entry) => total + entry.rating, 0);
    return sum / entries.length;
  } catch (error) {
    console.error('Error calculating weekly average mood:', error);
    return null;
  }
};

// Calculate average mood for a period
export const getAverageMood = async (days: number = 7): Promise<number | null> => {
  try {
    const entries = await getRecentMoodEntries(days);
    
    if (entries.length === 0) return null;
    
    const sum = entries.reduce((total, entry) => total + entry.rating, 0);
    return sum / entries.length;
  } catch (error) {
    console.error('Error calculating average mood:', error);
    return null;
  }
};

// Get mood streak (consecutive days with mood entries)
export const getMoodStreak = async (): Promise<number> => {
  try {
    console.log('Calculating mood streak...');
    
    // Get all mood entries
    const entries = await getAllMoodEntries();
    if (entries.length === 0) {
      console.log('No mood entries found, streak is 0');
      return 0;
    }
    
    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    console.log(`Found ${sortedEntries.length} mood entries, sorted by date`);
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);
    
    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);
    
    console.log(`Today: ${todayStr}, Yesterday: ${yesterdayStr}`);
    
    // Check if the most recent entry is from today or yesterday
    const mostRecentEntry = sortedEntries[0];
    const mostRecentDate = mostRecentEntry.date;
    
    console.log(`Most recent entry date: ${mostRecentDate}`);
    
    // If most recent entry is older than yesterday, streak is broken
    if (mostRecentDate !== todayStr && mostRecentDate !== yesterdayStr) {
      console.log('Most recent entry is older than yesterday, streak is 0');
      return 0;
    }
    
    // Start counting streak
    let streak = 1;
    let currentDate = new Date(mostRecentDate);
    
    console.log(`Starting streak calculation with date: ${currentDate.toISOString()}`);
    
    // Create a map of dates with entries for faster lookup
    const dateMap = new Map();
    for (const entry of entries) {
      dateMap.set(entry.date, true);
    }
    
    // Loop through previous days to find consecutive entries
    for (let i = 1; i <= 365; i++) { // Check up to a year back
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1);
      const dateStr = formatDate(currentDate);
      
      // Check if there's an entry for this date
      if (dateMap.has(dateStr)) {
        streak++;
        console.log(`Found entry for ${dateStr}, streak is now ${streak}`);
      } else {
        console.log(`No entry found for ${dateStr}, breaking streak`);
        break;
      }
    }
    
    console.log(`Final streak calculation: ${streak} days`);
    return streak;
  } catch (error) {
    console.error('Error calculating mood streak:', error);
    return 0;
  }
};

// Check if user can edit mood for a specific date
export const canEditMood = (dateString: string): boolean => {
  // Only allow editing for today's mood
  return isToday(dateString);
};