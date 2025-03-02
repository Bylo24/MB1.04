import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Animated, Alert, ToastAndroid, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { MoodRating } from '../types';
import { theme } from '../theme/theme';
import { supabase } from '../utils/supabaseClient';
import MoodDetailsInput from './MoodDetailsInput';

interface MoodSliderProps {
  value: MoodRating | null;
  onValueChange: (value: MoodRating | null) => void;
  onMoodSaved?: () => void; // Callback for when mood is saved
  onMoodDetailsSubmitted?: (rating: MoodRating, details: string) => Promise<void>;
  onGenerateRecommendations?: (rating: MoodRating) => Promise<void>; // New callback for generating recommendations without details
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
  onGenerateRecommendations,
  disabled = false
}: MoodSliderProps) {
  // Use refs for animation values to prevent re-renders
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [hasUserMoved, setHasUserMoved] = useState(false);
  const [localMoodValue, setLocalMoodValue] = useState<MoodRating | null>(value);
  const [showDetailsInput, setShowDetailsInput] = useState(false);
  const initialLoadRef = useRef(true);
  const prevValueRef = useRef<MoodRating | null>(null);
  
  // Define mood options
  const moodOptions: MoodOption[] = [
    { rating: 1, label: "Terrible", emoji: "😢", color: theme.colors.mood1 },
    { rating: 2, label: "Not Good", emoji: "😕", color: theme.colors.mood2 },
    { rating: 3, label: "Okay", emoji: "😐", color: theme.colors.mood3 },
    { rating: 4, label: "Good", emoji: "🙂", color: theme.colors.mood4 },
    { rating: 5, label: "Great", emoji: "😄", color: theme.colors.mood5 },
  ];
  
  // Get current mood option based on value
  const currentMood = localMoodValue ? moodOptions.find(option => option.rating === localMoodValue) : null;
  
  // Show success message
  const showSuccessMessage = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // For iOS, we could use a custom toast component or Alert
      console.log(message);
      Alert.alert('Success', message, [{ text: 'OK' }], { cancelable: true });
    }
  };
  
  // Smoother animation for emoji when mood changes
  const animateEmoji = useCallback(() => {
    // Reset animation values
    scaleAnim.setValue(1);
    opacityAnim.setValue(1);
    
    // Create a smoother animation sequence
    Animated.sequence([
      // Fade out slightly while scaling up
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
      // Fade back in while scaling down
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
  }, [scaleAnim, opacityAnim]);
  
  // Update local value when prop changes
  useEffect(() => {
    setLocalMoodValue(value);
  }, [value]);
  
  // Animate emoji when mood changes (but only when it actually changes)
  useEffect(() => {
    if (localMoodValue !== null && localMoodValue !== prevValueRef.current) {
      animateEmoji();
      prevValueRef.current = localMoodValue;
    }
  }, [localMoodValue, animateEmoji]);
  
  // Load today's mood entry when component mounts
  useEffect(() => {
    const loadTodayMood = async () => {
      try {
        console.log('Loading today\'s mood entry...');
        setIsLoading(true);
        
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          return;
        }
        
        if (!session) {
          console.log('No active session found');
          return;
        }
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Query mood entry for today
        const { data, error } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('date', today)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned - this is not an error for us
            console.log('No mood entry found for today');
            onValueChange(null);
            setIsSaved(false);
          } else {
            console.error('Error fetching mood entry:', error);
          }
        } else if (data) {
          console.log('Found mood entry for today:', data);
          onValueChange(data.rating);
          setIsSaved(true);
          
          // Check if the entry is editable (today's entry)
          setIsEditable(true); // Today's entry is always editable
        }
      } catch (error) {
        console.error('Error loading today\'s mood:', error);
      } finally {
        setIsLoading(false);
        initialLoadRef.current = false;
      }
    };
    
    loadTodayMood();
  }, [onValueChange]);
  
  // Debounced slider value change handler
  const handleSliderChange = useCallback((sliderValue: number) => {
    // Convert to integer between 1-5
    const moodRating = Math.round(sliderValue) as MoodRating;
    
    // Mark that user has moved the slider
    if (!hasUserMoved) {
      setHasUserMoved(true);
    }
    
    // Update local state immediately for UI updates
    setLocalMoodValue(moodRating);
    
    // Only update parent component if value has changed
    if (moodRating !== value) {
      onValueChange(moodRating);
    }
  }, [hasUserMoved, onValueChange, value]);
  
  // Handle slider value change (when sliding completes)
  const handleSlidingComplete = async (sliderValue: number) => {
    // Only save if the user has actively moved the slider
    if (!hasUserMoved && !initialLoadRef.current) {
      console.log('Slider not moved by user, not saving');
      return;
    }
    
    // Convert to integer between 1-5
    const moodRating = Math.round(sliderValue) as MoodRating;
    
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
      
      // Check if an entry already exists for today
      const { data: existingEntry, error: checkError } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .single();
      
      let savedEntry;
      
      if (checkError && checkError.code === 'PGRST116') {
        // No entry exists, create a new one
        console.log('Creating new mood entry for today');
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
        
        savedEntry = data;
      } else if (existingEntry) {
        // Entry exists, update it
        console.log('Updating existing mood entry for today:', existingEntry);
        const { data, error } = await supabase
          .from('mood_entries')
          .update({ rating: moodRating })
          .eq('id', existingEntry.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating mood entry:', error);
          Alert.alert('Error', 'Failed to update your mood. Please try again.');
          return;
        }
        
        savedEntry = data;
      }
      
      if (savedEntry) {
        setIsSaved(true);
        console.log('Mood saved successfully:', savedEntry);
        
        // Show success message
        showSuccessMessage("Mood saved for today!");
        
        // Show details input after saving mood
        setShowDetailsInput(true);
        
        // Call the onMoodSaved callback to refresh parent component data
        if (onMoodSaved) {
          onMoodSaved();
        }
      } else {
        console.error('Failed to save mood: No entry returned');
        Alert.alert('Error', 'Failed to save your mood. Please try again.');
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Failed to save your mood. Please try again.');
    } finally {
      setIsLoading(false);
      // Reset hasUserMoved after saving
      setHasUserMoved(false);
    }
  };
  
  // Handle mood details submission
  const handleMoodDetailsSubmit = async (details: string) => {
    if (!localMoodValue) return;
    
    try {
      if (onMoodDetailsSubmitted) {
        await onMoodDetailsSubmitted(localMoodValue, details);
      }
      
      // Show success message
      showSuccessMessage("Thanks for sharing! We've updated your recommendations.");
      
      // Hide the details input after submission
      setShowDetailsInput(false);
    } catch (error) {
      console.error('Error submitting mood details:', error);
      Alert.alert('Error', 'Failed to process your input. Please try again.');
    }
  };
  
  // Handle generating recommendations without details
  const handleGenerateRecommendations = async () => {
    if (!localMoodValue) return;
    
    try {
      if (onGenerateRecommendations) {
        await onGenerateRecommendations(localMoodValue);
      }
      
      // Show success message
      showSuccessMessage("Generating recommendations based on your mood!");
      
      // Hide the details input after generating recommendations
      setShowDetailsInput(false);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      Alert.alert('Error', 'Failed to generate recommendations. Please try again.');
    }
  };
  
  return (
    <View style={styles.container}>
      {localMoodValue === null ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>How are you feeling today?</Text>
          <Text style={styles.emptyStateSubText}>Move the slider to select your mood</Text>
        </View>
      ) : null}
      
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={5}
        step={1}
        value={localMoodValue || 3} // Default to middle position visually, but don't save it
        onValueChange={handleSliderChange}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={currentMood?.color || theme.colors.border}
        maximumTrackTintColor={theme.colors.border}
        thumbTintColor={currentMood?.color || theme.colors.primary}
        disabled={disabled || !isEditable || isLoading}
        // Add these props for smoother sliding
        tapToSeek={true}
        thumbStyle={styles.sliderThumb}
        trackStyle={styles.sliderTrack}
      />
      
      <View style={styles.labelContainer}>
        {moodOptions.map((option) => (
          <View key={option.rating} style={styles.labelItem}>
            <Text style={styles.labelEmoji}>{option.emoji}</Text>
            <Text 
              style={[
                styles.sliderLabel,
                localMoodValue === option.rating && { color: option.color, fontWeight: theme.fontWeights.bold }
              ]}
            >
              {option.rating}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={styles.moodDisplay}>
        {localMoodValue ? (
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
              {currentMood?.emoji}
            </Animated.Text>
            <Text style={[styles.moodLabel, { color: currentMood?.color }]}>
              {currentMood?.label}
            </Text>
          </>
        ) : (
          <Text style={styles.noMoodText}>No mood selected</Text>
        )}
        
        {isLoading ? (
          <Text style={styles.savingText}>Saving your mood...</Text>
        ) : isSaved && localMoodValue ? (
          <Text style={styles.savedText}>
            {isEditable 
              ? "Today's mood is saved" 
              : "This mood is locked and can't be changed"}
          </Text>
        ) : null}
      </View>
      
      {/* Mood details input with mood rating passed */}
      {isSaved && showDetailsInput && localMoodValue && (
        <MoodDetailsInput 
          isVisible={true}
          onSubmit={handleMoodDetailsSubmit}
          moodRating={localMoodValue}
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
  noMoodText: {
    fontSize: 18,
    color: theme.colors.subtext,
    fontStyle: 'italic',
  },
});