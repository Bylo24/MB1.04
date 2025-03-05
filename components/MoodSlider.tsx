import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Alert, ToastAndroid, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { MoodRating } from '../types';
import { theme } from '../theme/theme';
import { supabase } from '../utils/supabaseClient';
import MoodDetailsInput from './MoodDetailsInput';
import { getCurrentSubscriptionTier } from '../services/subscriptionService';
import { getTodayMoodEntry, getTodayDetailedMoodEntries } from '../services/moodService';

interface MoodSliderProps {
  value: MoodRating | null;
  onValueChange: (value: MoodRating | null) => void;
  onMoodSaved?: () => void;
  onMoodDetailsSubmitted?: (rating: MoodRating, details: string) => Promise<void>;
  disabled?: boolean;
}

interface MoodOption {
  rating: MoodRating;
  label: string;
  emoji: string;
  color: string;
}

export default function MoodSlider({ 
  value, 
  onValueChange,
  onMoodSaved,
  onMoodDetailsSubmitted,
  disabled = false
}: MoodSliderProps) {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  // Core state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [freeLimitReached, setFreeLimitReached] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'premium'>('free');
  const [todayEntriesCount, setTodayEntriesCount] = useState(0);
  const [showDetailsInput, setShowDetailsInput] = useState(false);
  
  // IMPORTANT: These are the key state variables for fixing the issue
  const [currentSliderValue, setCurrentSliderValue] = useState<MoodRating | null>(value);
  const [displayedMood, setDisplayedMood] = useState<MoodRating | null>(value);
  const [isUserDragging, setIsUserDragging] = useState(false);
  
  // Define mood options
  const moodOptions: MoodOption[] = [
    { rating: 1, label: "Terrible", emoji: "😢", color: theme.colors.mood1 },
    { rating: 2, label: "Not Good", emoji: "😕", color: theme.colors.mood2 },
    { rating: 3, label: "Okay", emoji: "😐", color: theme.colors.mood3 },
    { rating: 4, label: "Good", emoji: "🙂", color: theme.colors.mood4 },
    { rating: 5, label: "Great", emoji: "😄", color: theme.colors.mood5 },
  ];
  
  // Get current mood option based on displayed mood
  const currentMood = displayedMood !== null ? moodOptions.find(option => option.rating === displayedMood) : null;
  
  // Show success message
  const showSuccessMessage = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      console.log(message);
      Alert.alert('Success', message, [{ text: 'OK' }], { cancelable: true });
    }
  };
  
  // Animate emoji when mood changes
  const animateEmoji = () => {
    scaleAnim.setValue(1);
    opacityAnim.setValue(1);
    
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };
  
  // Update from props when value changes
  useEffect(() => {
    if (!isUserDragging) {
      console.log('Setting values from prop:', value);
      setCurrentSliderValue(value);
      setDisplayedMood(value);
    }
  }, [value, isUserDragging]);
  
  // Load initial mood data
  useEffect(() => {
    const loadMoodData = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error('Session error or no session:', sessionError);
          return;
        }
        
        // Get subscription tier
        const tier = await getCurrentSubscriptionTier();
        setSubscriptionTier(tier);
        
        // Get today's mood entry
        const todayEntry = await getTodayMoodEntry();
        
        if (todayEntry) {
          console.log('Found mood entry for today:', todayEntry);
          setCurrentSliderValue(todayEntry.rating);
          setDisplayedMood(todayEntry.rating);
          onValueChange(todayEntry.rating);
          setIsSaved(true);
          
          // If user is on free plan and already has a mood entry for today, disable the slider
          if (tier === 'free') {
            setFreeLimitReached(true);
          }
        } else {
          console.log('No mood entry found for today');
          // Important: Only set values if they exist, otherwise leave as null
          if (value !== null) {
            setCurrentSliderValue(value);
            setDisplayedMood(value);
          } else {
            // Set to null to indicate no mood selected
            setCurrentSliderValue(null);
            setDisplayedMood(null);
          }
          setIsSaved(false);
        }
        
        // For premium users, check how many entries they've made today
        if (tier === 'premium') {
          const detailedEntries = await getTodayDetailedMoodEntries();
          setTodayEntriesCount(detailedEntries.length);
        }
      } catch (error) {
        console.error('Error loading mood data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMoodData();
  }, [onValueChange, value]);
  
  // Handle slider value change (while dragging)
  const handleSliderChange = (newValue: number) => {
    const moodRating = Math.round(newValue) as MoodRating;
    
    // Set that user is dragging
    setIsUserDragging(true);
    
    // Update both the slider value and displayed mood
    setCurrentSliderValue(moodRating);
    setDisplayedMood(moodRating);
    
    // Animate the emoji
    animateEmoji();
    
    // Update parent component
    onValueChange(moodRating);
  };
  
  // Handle slider release
  const handleSlidingComplete = async (newValue: number) => {
    const moodRating = Math.round(newValue) as MoodRating;
    
    // Set that user is no longer dragging
    setIsUserDragging(false);
    
    // Ensure values are in sync
    setCurrentSliderValue(moodRating);
    setDisplayedMood(moodRating);
    
    // Save to database
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error or no session:', sessionError);
        Alert.alert('Error', 'You must be logged in to save your mood.');
        return;
      }
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Check subscription tier
      const tier = await getCurrentSubscriptionTier();
      
      // For premium users, always allow new entries
      if (tier === 'premium') {
        // Insert a new detailed entry
        const { data: detailedEntry, error: detailedError } = await supabase
          .from('mood_entries_detailed')
          .insert([
            { 
              user_id: session.user.id, 
              date: today, 
              time: new Date().toISOString().split('T')[1], 
              rating: moodRating
            }
          ])
          .select()
          .single();
        
        if (detailedError) {
          console.error('Error inserting detailed mood entry:', detailedError);
          Alert.alert('Error', 'Failed to save your mood. Please try again.');
          return;
        }
        
        // Get all entries for today to calculate average
        const { data: todayEntries, error: entriesError } = await supabase
          .from('mood_entries_detailed')
          .select('rating')
          .eq('user_id', session.user.id)
          .eq('date', today);
        
        if (entriesError) {
          console.error('Error fetching today\'s mood entries:', entriesError);
          return;
        }
        
        // Calculate average rating
        const sum = todayEntries.reduce((total, entry) => total + entry.rating, 0);
        const averageRating = Math.round(sum / todayEntries.length) as MoodRating;
        
        // Update today's entries count
        setTodayEntriesCount(todayEntries.length);
        
        // Check if a summary entry already exists for today
        const { data: existingEntry, error: checkError } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('date', today)
          .single();
        
        if (existingEntry) {
          // Update the existing summary entry with the new average
          const { data, error } = await supabase
            .from('mood_entries')
            .update({ rating: averageRating })
            .eq('id', existingEntry.id)
            .select()
            .single();
          
          if (error) {
            console.error('Error updating mood entry:', error);
            return;
          }
          
          // Update displayed mood with the new average
          setDisplayedMood(averageRating);
        } else {
          // Insert a new summary entry
          const { data, error } = await supabase
            .from('mood_entries')
            .insert([
              { user_id: session.user.id, date: today, rating: averageRating }
            ])
            .select()
            .single();
          
          if (error) {
            console.error('Error inserting mood entry:', error);
            return;
          }
          
          // Update displayed mood with the new average
          setDisplayedMood(averageRating);
        }
        
        setIsSaved(true);
        showSuccessMessage(`Mood saved! (Entry #${todayEntries.length} today)`);
        setShowDetailsInput(true);
        
        // Call the onMoodSaved callback to refresh parent component data
        if (onMoodSaved) {
          onMoodSaved();
        }
      } else {
        // For free users, check if an entry already exists for today
        const { data: existingEntry, error: checkError } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('date', today)
          .single();
        
        // If user is on free plan and already has a mood entry for today, show an error
        if (existingEntry) {
          Alert.alert(
            'Free Plan Limit Reached',
            'Free users can only log their mood once per day. Upgrade to premium for unlimited mood logging.',
            [{ text: 'OK' }]
          );
          setFreeLimitReached(true);
          
          // Reset displayed mood to the existing entry
          setDisplayedMood(existingEntry.rating);
          setCurrentSliderValue(existingEntry.rating);
          return;
        }
        
        // No entry exists, create a new one
        const { data, error } = await supabase
          .from('mood_entries')
          .insert([
            { user_id: session.user.id, date: today, rating: moodRating }
          ])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating mood entry:', error);
          Alert.alert('Error', 'Failed to save your mood. Please try again.');
          return;
        }
        
        setIsSaved(true);
        showSuccessMessage("Mood saved for today!");
        setShowDetailsInput(true);
        setFreeLimitReached(true);
        
        // Call the onMoodSaved callback to refresh parent component data
        if (onMoodSaved) {
          onMoodSaved();
        }
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Failed to save your mood. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle mood details submission
  const handleMoodDetailsSubmit = async (details: string) => {
    if (!displayedMood) return;
    
    try {
      if (onMoodDetailsSubmitted) {
        await onMoodDetailsSubmitted(displayedMood, details);
      }
      
      showSuccessMessage("Thanks for sharing! We've updated your recommendations.");
      setShowDetailsInput(false);
    } catch (error) {
      console.error('Error submitting mood details:', error);
      Alert.alert('Error', 'Failed to process your input. Please try again.');
    }
  };
  
  // Handle generating recommendations without details
  const handleGenerateRecommendations = async () => {
    if (!displayedMood) return;
    
    try {
      if (onMoodDetailsSubmitted) {
        await onMoodDetailsSubmitted(displayedMood, "");
      }
      
      showSuccessMessage("Generating recommendations based on your mood!");
      setShowDetailsInput(false);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      Alert.alert('Error', 'Failed to generate recommendations. Please try again.');
    }
  };
  
  // Determine if slider should be disabled
  const isSliderDisabled = disabled || !isEditable || isLoading || (subscriptionTier === 'free' && freeLimitReached);
  
  // Get message for free plan limit or premium entries
  const getStatusMessage = () => {
    if (subscriptionTier === 'free' && freeLimitReached) {
      return "Free plan limited to 1 mood log per day. Upgrade for unlimited logs.";
    } else if (subscriptionTier === 'premium' && todayEntriesCount > 0) {
      return `You've logged your mood ${todayEntriesCount} time${todayEntriesCount !== 1 ? 's' : ''} today.`;
    }
    return null;
  };
  
  // Get the slider value to display - UPDATED to not default to any position
  const getSliderValue = () => {
    if (currentSliderValue !== null) {
      return currentSliderValue;
    }
    // If no mood is selected, don't default to any position
    return null;
  };
  
  return (
    <View style={styles.container}>
      {/* Empty state message when no mood is selected */}
      {displayedMood === null && !isUserDragging && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>How are you feeling today?</Text>
          <Text style={styles.emptyStateSubText}>Move the slider to select your mood</Text>
        </View>
      )}
      
      {/* Slider component */}
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={5}
        step={1}
        value={getSliderValue() || undefined}
        onValueChange={handleSliderChange}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={currentMood?.color || theme.colors.border}
        maximumTrackTintColor={theme.colors.border}
        thumbTintColor={currentMood?.color || theme.colors.primary}
        disabled={isSliderDisabled}
        tapToSeek={true}
        thumbStyle={styles.sliderThumb}
        trackStyle={styles.sliderTrack}
      />
      
      {/* Slider labels */}
      <View style={styles.labelContainer}>
        {moodOptions.map((option) => (
          <View key={option.rating} style={styles.labelItem}>
            <Text style={styles.labelEmoji}>{option.emoji}</Text>
            <Text 
              style={[
                styles.sliderLabel,
                currentSliderValue === option.rating && { color: option.color, fontWeight: theme.fontWeights.bold }
              ]}
            >
              {option.rating}
            </Text>
          </View>
        ))}
      </View>
      
      {/* Mood display - only show if there's a mood to display or user is dragging */}
      {(displayedMood !== null || isUserDragging) && (
        <View style={styles.moodDisplay}>
          {/* Large emoji and mood label */}
          {currentMood && (
            <>
              <Animated.Text 
                style={[
                  styles.emoji,
                  { 
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim
                  }
                ]}
              >
                {currentMood.emoji}
              </Animated.Text>
              <Text style={[styles.moodLabel, { color: currentMood.color }]}>
                {currentMood.label}
              </Text>
            </>
          )}
          
          {/* Status messages */}
          {isUserDragging && (
            <Text style={styles.draggingText}>Release to save this mood</Text>
          )}
          
          {isLoading ? (
            <Text style={styles.savingText}>Saving your mood...</Text>
          ) : isSaved && !isUserDragging ? (
            <Text style={styles.savedText}>
              {subscriptionTier === 'premium' 
                ? "Your mood is saved - you can update it anytime" 
                : "Today's mood is saved"}
            </Text>
          ) : null}
          
          {/* Free plan limit or premium entries count */}
          {getStatusMessage() && !isUserDragging && (
            <Text style={[
              styles.statusText,
              subscriptionTier === 'free' && freeLimitReached ? styles.freeLimitText : styles.premiumStatusText
            ]}>
              {getStatusMessage()}
            </Text>
          )}
        </View>
      )}
      
      {/* Mood details input */}
      {isSaved && showDetailsInput && !isUserDragging && displayedMood !== null && (
        <MoodDetailsInput 
          isVisible={true}
          onSubmit={handleMoodDetailsSubmit}
          moodRating={displayedMood}
          onGenerateRecommendations={handleGenerateRecommendations}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.small,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  labelItem: {
    alignItems: 'center',
  },
  labelEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: 14,
    color: theme.colors.subtext,
    fontWeight: theme.fontWeights.medium,
  },
  moodDisplay: {
    alignItems: 'center',
    marginTop: 8,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 20,
    fontWeight: theme.fontWeights.bold,
  },
  draggingText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  savedText: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 8,
    fontStyle: 'italic',
  },
  savingText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: theme.fontWeights.medium,
  },
  freeLimitText: {
    color: theme.colors.error,
  },
  premiumStatusText: {
    color: theme.colors.accent,
  },
  emptyStateContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: theme.fontWeights.semibold,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: theme.colors.subtext,
    fontStyle: 'italic',
    marginTop: 4,
  },
});