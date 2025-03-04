import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, SafeAreaView, StatusBar, AppState, ActivityIndicator, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import MoodSlider from '../components/MoodSlider';
import ActivityCard from '../components/ActivityCard';
import MoodTrendGraph from '../components/MoodTrendGraph';
import QuoteComponent from '../components/QuoteComponent';
import Header from '../components/Header';
import ProfileModal from '../components/ProfileModal';
import PremiumFeatureBadge from '../components/PremiumFeatureBadge';
import { MoodRating, Activity } from '../types';
import { getTodayMoodEntry, getRecentMoodEntries, getMoodStreak, getWeeklyAverageMood, getCurrentWeekMoodEntries } from '../services/moodService';
import { getCurrentUser, isAuthenticated } from '../services/authService';
import { getCurrentSubscriptionTier } from '../services/subscriptionService';
import { recommendedActivities } from '../data/mockData';
import { supabase } from '../utils/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActivityRecommendations } from '../services/geminiService';

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

interface HomeScreenProps {
  onLogout: () => void;
  navigation: any;
}

export default function HomeScreen({ onLogout, navigation }: HomeScreenProps) {
  // State for selected mood (now can be null)
  const [selectedMood, setSelectedMood] = useState<MoodRating | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [weeklyAverage, setWeeklyAverage] = useState<number | null>(null);
  const [weeklyMoodEntries, setWeeklyMoodEntries] = useState<any[]>([]);
  const [todayMood, setTodayMood] = useState<MoodRating | null>(null);
  const [isSliderDisabled, setIsSliderDisabled] = useState(false);
  const [activities, setActivities] = useState<Activity[]>(recommendedActivities.slice(0, 3));
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  
  // State for mood trend graph refresh
  const [trendGraphKey, setTrendGraphKey] = useState(0);
  
  // State for profile modal
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  
  // State to force quote refresh
  const [quoteKey, setQuoteKey] = useState(Date.now());
  
  // Memoized refresh mood data function
  const refreshMoodData = useCallback(async () => {
    try {
      console.log('Refreshing mood data...');
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error or no session:', sessionError);
        return;
      }
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Query mood entry for today
      const { data: todayEntry, error: todayError } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .single();
      
      if (todayError) {
        if (todayError.code !== 'PGRST116') {
          console.error('Error fetching today\'s mood entry:', todayError);
        } else {
          console.log('No mood entry found for today');
          setTodayMood(null);
          setSelectedMood(null);
        }
      } else if (todayEntry) {
        console.log('Today\'s mood entry found:', todayEntry);
        setTodayMood(todayEntry.rating);
        setSelectedMood(todayEntry.rating);
      }
      
      // Get all mood entries for streak calculation
      const { data: allEntries, error: entriesError } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });
      
      if (entriesError) {
        console.error('Error fetching all mood entries:', entriesError);
      } else {
        // Calculate streak
        let currentStreak = 0;
        if (allEntries && allEntries.length > 0) {
          // Simple streak calculation
          currentStreak = 1; // Start with 1 for the most recent entry
          
          // Create a map of dates with entries
          const dateMap = new Map();
          allEntries.forEach(entry => {
            dateMap.set(entry.date, true);
          });
          
          // Get the most recent entry date
          const mostRecentDate = new Date(allEntries[0].date);
          
          // Check previous days
          for (let i = 1; i <= 365; i++) { // Check up to a year back
            const prevDate = new Date(mostRecentDate);
            prevDate.setDate(prevDate.getDate() - i);
            const dateStr = prevDate.toISOString().split('T')[0];
            
            if (dateMap.has(dateStr)) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
        
        console.log('Current streak:', currentStreak);
        setStreak(currentStreak);
        
        // Get weekly entries (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const startDate = sevenDaysAgo.toISOString().split('T')[0];
        
        const weekEntries = allEntries.filter(entry => 
          entry.date >= startDate && entry.date <= today
        );
        
        console.log('Weekly entries:', weekEntries);
        setWeeklyMoodEntries(weekEntries);
        
        // Calculate weekly average
        if (weekEntries.length > 0) {
          const sum = weekEntries.reduce((total, entry) => total + entry.rating, 0);
          const avg = sum / weekEntries.length;
          console.log('Weekly average:', avg);
          setWeeklyAverage(avg);
        } else {
          setWeeklyAverage(null);
        }
      }
      
      // Force mood trend graph to refresh
      setTrendGraphKey(prev => prev + 1);
      
      console.log('Mood data refresh complete');
    } catch (error) {
      console.error('Error refreshing mood data:', error);
    }
  }, []);
  
  // Load user data and mood information
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const isLoggedIn = await isAuthenticated();
        if (!isLoggedIn) {
          // Handle not authenticated state
          console.log('User not authenticated');
          onLogout();
          setIsLoading(false);
          return;
        }
        
        // Try to get stored display name first
        const storedName = await AsyncStorage.getItem('user_display_name');
        
        const user = await getCurrentUser();
        if (user) {
          // Use stored name if available, otherwise extract from email
          if (storedName) {
            setUserName(storedName);
          } else {
            const name = user.email ? user.email.split('@')[0] : 'Friend';
            setUserName(name);
            // Store the name for future use
            await AsyncStorage.setItem('user_display_name', name);
          }
          
          // Check subscription status
          try {
            const tier = await getCurrentSubscriptionTier();
            setIsPremium(tier === 'premium');
          } catch (error) {
            console.error('Error checking subscription status:', error);
            setIsPremium(false);
          }
          
          // Load mood data
          await refreshMoodData();
          
          // Load default activities
          setActivities(recommendedActivities.slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // App has come to the foreground, refresh data
        refreshMoodData();
        setQuoteKey(Date.now());
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshMoodData, onLogout]);
  
  // Handle mood change
  const handleMoodChange = (mood: MoodRating | null) => {
    console.log('Mood changed to:', mood);
    setSelectedMood(mood);
    
    // Immediately update today's mood in the UI
    if (mood !== null) {
      setTodayMood(mood);
    }
  };
  
  // Handle mood saved
  const handleMoodSaved = async () => {
    console.log('Mood saved, refreshing data...');
    // Refresh all mood data when a new mood is saved
    await refreshMoodData();
  };
  
  // Handle mood details submission
  const handleMoodDetailsSubmitted = async (rating: MoodRating, details: string) => {
    console.log('Mood details submitted:', { rating, details });
    setIsLoadingActivities(true);
    
    try {
      // Get personalized activity recommendations from Gemini
      const recommendedActivities = await getActivityRecommendations(rating, details);
      setActivities(recommendedActivities);
    } catch (error) {
      console.error('Error getting activity recommendations:', error);
      // Fallback to default activities
      setActivities(recommendedActivities.slice(0, 3));
    } finally {
      setIsLoadingActivities(false);
    }
  };
  
  // Handle profile button press
  const handleProfilePress = () => {
    setProfileModalVisible(true);
  };
  
  // Handle profile modal close
  const handleProfileModalClose = () => {
    setProfileModalVisible(false);
    
    // Refresh user name when profile modal is closed (in case it was updated)
    const refreshUserName = async () => {
      const storedName = await AsyncStorage.getItem('user_display_name');
      if (storedName) {
        setUserName(storedName);
      }
    };
    
    refreshUserName();
    
    // Refresh data when profile modal is closed (in case settings were changed)
    refreshMoodData();
    
    // Check subscription status again
    const checkSubscription = async () => {
      try {
        const tier = await getCurrentSubscriptionTier();
        setIsPremium(tier === 'premium');
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };
    
    checkSubscription();
  };
  
  // Handle premium feature button press
  const handlePremiumFeaturePress = (featureName: string) => {
    if (isPremium) {
      // If user is premium, we would navigate to the feature
      // For now, just log the action
      console.log(`Premium feature pressed: ${featureName}`);
    } else {
      // If user is not premium, navigate to subscription comparison screen
      navigation.navigate('SubscriptionComparison', { source: 'upgrade' });
    }
  };
  
  function getMoodEmoji(rating: number | null): string {
    if (rating === null) return '–';
    switch (rating) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '😄';
      default: return '–';
    }
  }
  
  function getMoodColor(rating: number | null): string {
    if (rating === null) return theme.colors.text;
    switch (rating) {
      case 1: return theme.colors.mood1;
      case 2: return theme.colors.mood2;
      case 3: return theme.colors.mood3;
      case 4: return theme.colors.mood4;
      case 5: return theme.colors.mood5;
      default: return theme.colors.text;
    }
  }
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your mood data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <Header onProfilePress={handleProfilePress} />
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hey {userName},</Text>
          <Text style={styles.subGreeting}>let's make today great! ✨</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
        
        <QuoteComponent key={quoteKey} />
        
        {/* Premium Features Section */}
        <View style={styles.premiumFeaturesContainer}>
          {/* Guided Exercises & Meditations Button */}
          <TouchableOpacity 
            style={styles.premiumFeatureButton}
            onPress={() => handlePremiumFeaturePress('GuidedExercises')}
          >
            <View style={styles.premiumFeatureContent}>
              <View style={styles.premiumFeatureIconContainer}>
                <Ionicons name="flower-outline" size={24} color={theme.colors.background} />
              </View>
              <View style={styles.premiumFeatureTextContainer}>
                <Text style={styles.premiumFeatureTitle}>Guided Exercises & Meditations</Text>
                <Text style={styles.premiumFeatureSubtitle}>
                  Exclusive content tailored to your moods
                </Text>
              </View>
              {!isPremium && (
                <PremiumFeatureBadge
                  featureName="Guided Exercises & Meditations"
                  featureDescription="Access our library of guided exercises and meditations tailored to your specific moods. Perfect for managing stress, anxiety, and improving your overall wellbeing."
                  onUpgrade={() => navigation.navigate('SubscriptionComparison', { source: 'upgrade' })}
                  small
                />
              )}
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
            </View>
          </TouchableOpacity>
          
          {/* Streak Rewards Button */}
          <TouchableOpacity 
            style={styles.premiumFeatureButton}
            onPress={() => handlePremiumFeaturePress('StreakRewards')}
          >
            <View style={styles.premiumFeatureContent}>
              <View style={[styles.premiumFeatureIconContainer, { backgroundColor: theme.colors.accent }]}>
                <Ionicons name="trophy-outline" size={24} color={theme.colors.background} />
              </View>
              <View style={styles.premiumFeatureTextContainer}>
                <Text style={styles.premiumFeatureTitle}>Streak Rewards</Text>
                <Text style={styles.premiumFeatureSubtitle}>
                  {isPremium ? 'Special badges, streak recovery options' : 'Unlock more rewards with premium'}
                </Text>
              </View>
              {!isPremium && (
                <PremiumFeatureBadge
                  featureName="Premium Streak Rewards"
                  featureDescription="Unlock special badges, achievements, and streak recovery options with a premium subscription."
                  onUpgrade={() => navigation.navigate('SubscriptionComparison', { source: 'upgrade' })}
                  small
                />
              )}
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
            </View>
          </TouchableOpacity>
          
          {/* AI Mood Predictions Button */}
          <TouchableOpacity 
            style={styles.premiumFeatureButton}
            onPress={() => handlePremiumFeaturePress('MoodPredictions')}
          >
            <View style={styles.premiumFeatureContent}>
              <View style={[styles.premiumFeatureIconContainer, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="analytics-outline" size={24} color={theme.colors.background} />
              </View>
              <View style={styles.premiumFeatureTextContainer}>
                <Text style={styles.premiumFeatureTitle}>AI Mood Predictions</Text>
                <Text style={styles.premiumFeatureSubtitle}>
                  Get insights into future mood trends
                </Text>
              </View>
              {!isPremium && (
                <PremiumFeatureBadge
                  featureName="AI Mood Predictions"
                  featureDescription="Our AI analyzes your mood patterns to predict future trends and provide personalized insights to help you prepare for potential mood changes."
                  onUpgrade={() => navigation.navigate('SubscriptionComparison', { source: 'upgrade' })}
                  small
                />
              )}
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.moodCheckInContainer}>
          <Text style={styles.sectionTitle}>How are you feeling today?</Text>
          <MoodSlider 
            value={selectedMood} 
            onValueChange={handleMoodChange}
            onMoodSaved={handleMoodSaved}
            onMoodDetailsSubmitted={handleMoodDetailsSubmitted}
            disabled={isSliderDisabled}
          />
        </View>
        
        <View style={styles.moodSummaryContainer}>
          <Text style={styles.sectionTitle}>Your Mood Summary</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Today</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: getMoodColor(todayMood) }
                ]}>
                  {getMoodEmoji(todayMood)}
                </Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Weekly Mood</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: getMoodColor(weeklyAverage ? Math.round(weeklyAverage) : null) }
                ]}>
                  {weeklyAverage ? getMoodEmoji(Math.round(weeklyAverage) as MoodRating) : '–'}
                </Text>
              </View>
              
              <View style={styles.divider} />
              
              <TouchableOpacity 
                style={styles.summaryItem}
                onPress={() => handlePremiumFeaturePress('StreakRewards')}
              >
                <Text style={styles.summaryLabel}>Streak</Text>
                <View style={styles.streakContainer}>
                  <Text style={[styles.summaryValue, styles.streakValue]}>{streak} days</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.trendContainer}>
              <Text style={styles.trendTitle}>Your Mood Trend</Text>
              <MoodTrendGraph key={trendGraphKey} days={5} />
            </View>
          </View>
        </View>
        
        <View style={styles.activitiesContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recommended Activities</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Based on your recent mood patterns</Text>
          
          {isLoadingActivities ? (
            <View style={styles.activitiesLoadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.activitiesLoadingText}>Personalizing your recommendations...</Text>
            </View>
          ) : (
            activities.map(activity => (
              <View key={activity.id} style={styles.activityItem}>
                <ActivityCard activity={activity} />
              </View>
            ))
          )}
        </View>
      </ScrollView>
      
      <ProfileModal 
        visible={profileModalVisible} 
        onClose={handleProfileModalClose}
        onLogout={onLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: screenWidth * 0.05, // 5% of screen width for horizontal padding
    paddingTop: 0, // Reduced because we now have a header
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  subGreeting: {
    fontSize: 22,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: theme.colors.subtext,
    marginTop: 4,
  },
  // Premium Features Section
  premiumFeaturesContainer: {
    marginBottom: 24,
  },
  premiumFeatureButton: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    marginBottom: 12,
    ...theme.shadows.medium,
  },
  premiumFeatureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  premiumFeatureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  premiumFeatureTextContainer: {
    flex: 1,
  },
  premiumFeatureTitle: {
    fontSize: 16,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  premiumFeatureSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: 2,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodCheckInContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: -8,
    marginBottom: 16,
  },
  moodSummaryContainer: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: theme.fontWeights.bold,
  },
  streakValue: {
    color: theme.colors.accent,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 8,
  },
  trendContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  activitiesContainer: {
    marginBottom: 16,
  },
  activityItem: {
    marginBottom: 12,
  },
  activitiesLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    marginBottom: 12,
  },
  activitiesLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.subtext,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.subtext,
  },
});