import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { getRecentMoodEntries, MoodEntry } from '../services/moodService';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

interface MoodPredictionsScreenProps {
  navigation: any;
  route: any;
}

interface MoodPattern {
  day: string;
  pattern: string;
  description: string;
}

interface MoodTrigger {
  trigger: string;
  impact: 'positive' | 'negative';
  frequency: number;
}

export default function MoodPredictionsScreen({ navigation, route }: MoodPredictionsScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [predictedMood, setPredictedMood] = useState<number | null>(null);
  const [moodPatterns, setMoodPatterns] = useState<MoodPattern[]>([]);
  const [moodTriggers, setMoodTriggers] = useState<MoodTrigger[]>([]);
  const [isPremium, setIsPremium] = useState(route.params?.isPremium || false);
  const [userName, setUserName] = useState('');

  // Days of the week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Current day index
  const currentDayIndex = new Date().getDay();
  
  // Next 7 days (starting from tomorrow)
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const dayIndex = (currentDayIndex + i + 1) % 7;
    return daysOfWeek[dayIndex];
  });

  useEffect(() => {
    const loadMoodData = async () => {
      setIsLoading(true);
      try {
        // Get user name
        const storedName = await AsyncStorage.getItem('user_display_name');
        if (storedName) {
          setUserName(storedName);
        }

        // Get mood entries from the last 30 days
        const entries = await getRecentMoodEntries(30);
        setMoodEntries(entries);

        // Check if we have enough data for predictions (at least 10 entries)
        const hasEnough = entries.length >= 10;
        setHasEnoughData(hasEnough);

        if (hasEnough) {
          // Analyze mood patterns
          analyzeMoodPatterns(entries);
        }
      } catch (error) {
        console.error('Error loading mood data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMoodData();
  }, [isPremium]);

  const analyzeMoodPatterns = (entries: MoodEntry[]) => {
    // Group entries by day of week
    const entriesByDay = daysOfWeek.map(day => {
      const dayEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return daysOfWeek[entryDate.getDay()] === day;
      });
      
      return {
        day,
        entries: dayEntries,
        averageMood: dayEntries.length > 0 
          ? dayEntries.reduce((sum, entry) => sum + entry.rating, 0) / dayEntries.length 
          : null
      };
    });

    // Find patterns
    const patterns: MoodPattern[] = [];
    
    // Find the day with highest average mood
    const highestMoodDay = [...entriesByDay]
      .filter(day => day.averageMood !== null)
      .sort((a, b) => (b.averageMood || 0) - (a.averageMood || 0))[0];
      
    if (highestMoodDay && highestMoodDay.averageMood) {
      patterns.push({
        day: highestMoodDay.day,
        pattern: 'Peak Day',
        description: `You tend to feel your best on ${highestMoodDay.day}s with an average mood of ${highestMoodDay.averageMood.toFixed(1)}.`
      });
    }
    
    // Find the day with lowest average mood
    const lowestMoodDay = [...entriesByDay]
      .filter(day => day.averageMood !== null)
      .sort((a, b) => (a.averageMood || 0) - (b.averageMood || 0))[0];
      
    if (lowestMoodDay && lowestMoodDay.averageMood) {
      patterns.push({
        day: lowestMoodDay.day,
        pattern: 'Dip Day',
        description: `You tend to experience lower moods on ${lowestMoodDay.day}s with an average mood of ${lowestMoodDay.averageMood.toFixed(1)}.`
      });
    }
    
    // Check for weekend vs weekday pattern
    const weekdayEntries = entries.filter(entry => {
      const day = new Date(entry.date).getDay();
      return day >= 1 && day <= 5; // Monday to Friday
    });
    
    const weekendEntries = entries.filter(entry => {
      const day = new Date(entry.date).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });
    
    const weekdayAvg = weekdayEntries.length > 0 
      ? weekdayEntries.reduce((sum, entry) => sum + entry.rating, 0) / weekdayEntries.length 
      : 0;
      
    const weekendAvg = weekendEntries.length > 0 
      ? weekendEntries.reduce((sum, entry) => sum + entry.rating, 0) / weekendEntries.length 
      : 0;
    
    if (Math.abs(weekdayAvg - weekendAvg) > 0.5 && weekdayEntries.length > 0 && weekendEntries.length > 0) {
      if (weekendAvg > weekdayAvg) {
        patterns.push({
          day: 'Weekend',
          pattern: 'Weekend Boost',
          description: `Your mood tends to improve on weekends by ${(weekendAvg - weekdayAvg).toFixed(1)} points on average.`
        });
      } else {
        patterns.push({
          day: 'Weekday',
          pattern: 'Weekday Preference',
          description: `You tend to have better moods during weekdays compared to weekends by ${(weekdayAvg - weekendAvg).toFixed(1)} points.`
        });
      }
    }
    
    // Look for mood triggers in details
    const triggerWords = {
      positive: ['exercise', 'workout', 'friend', 'family', 'nature', 'outdoors', 'sleep', 'rest', 'meditation', 'hobby'],
      negative: ['work', 'stress', 'tired', 'sick', 'argument', 'conflict', 'deadline', 'anxiety', 'worry']
    };
    
    const triggers: Record<string, { count: number, totalImpact: number, type: 'positive' | 'negative' }> = {};
    
    // Analyze details for triggers
    entries.forEach(entry => {
      if (!entry.details) return;
      
      const details = entry.details.toLowerCase();
      
      // Check for positive triggers
      triggerWords.positive.forEach(word => {
        if (details.includes(word)) {
          if (!triggers[word]) {
            triggers[word] = { count: 0, totalImpact: 0, type: 'positive' };
          }
          triggers[word].count += 1;
          triggers[word].totalImpact += entry.rating;
        }
      });
      
      // Check for negative triggers
      triggerWords.negative.forEach(word => {
        if (details.includes(word)) {
          if (!triggers[word]) {
            triggers[word] = { count: 0, totalImpact: 0, type: 'negative' };
          }
          triggers[word].count += 1;
          triggers[word].totalImpact += entry.rating;
        }
      });
    });
    
    // Convert triggers to array and sort by frequency
    const triggersArray: MoodTrigger[] = Object.entries(triggers)
      .filter(([_, data]) => data.count >= 2) // Only include triggers that appear at least twice
      .map(([trigger, data]) => ({
        trigger: trigger.charAt(0).toUpperCase() + trigger.slice(1), // Capitalize first letter
        impact: data.type,
        frequency: data.count
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5); // Take top 5
    
    setMoodPatterns(patterns);
    setMoodTriggers(triggersArray);
    
    // Predict mood for tomorrow
    predictNextDayMood(entries);
  };

  const predictNextDayMood = (entries: MoodEntry[]) => {
    // Simple prediction based on day of week averages
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayIndex = tomorrow.getDay();
    const tomorrowDay = daysOfWeek[tomorrowDayIndex];
    
    // Get entries for the same day of week
    const sameDayEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getDay() === tomorrowDayIndex;
    });
    
    if (sameDayEntries.length >= 2) {
      // Calculate average mood for this day of week
      const avgMood = sameDayEntries.reduce((sum, entry) => sum + entry.rating, 0) / sameDayEntries.length;
      setPredictedMood(avgMood);
    } else {
      // Not enough data for this specific day, use overall average
      const avgMood = entries.reduce((sum, entry) => sum + entry.rating, 0) / entries.length;
      setPredictedMood(avgMood);
    }
  };

  const getMoodColor = (rating: number): string => {
    if (rating < 1.5) return theme.colors.mood1;
    if (rating < 2.5) return theme.colors.mood2;
    if (rating < 3.5) return theme.colors.mood3;
    if (rating < 4.5) return theme.colors.mood4;
    return theme.colors.mood5;
  };

  const getMoodEmoji = (rating: number): string => {
    if (rating < 1.5) return '😢';
    if (rating < 2.5) return '😕';
    if (rating < 3.5) return '😐';
    if (rating < 4.5) return '🙂';
    return '😄';
  };

  const getChartData = () => {
    // Get last 7 days of data plus predictions for next 7 days
    const today = new Date();
    const labels: string[] = [];
    const data: number[] = [];
    
    // Past 7 days data
    for (let i = 7; i > 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find entry for this date
      const entry = moodEntries.find(e => e.date === dateStr);
      
      labels.push(daysOfWeek[date.getDay()].substring(0, 3));
      data.push(entry ? entry.rating : 0);
    }
    
    // Today's data
    const todayStr = today.toISOString().split('T')[0];
    const todayEntry = moodEntries.find(e => e.date === todayStr);
    labels.push('Today');
    data.push(todayEntry ? todayEntry.rating : 0);
    
    // Future predictions (only if we have enough data)
    if (hasEnoughData && predictedMood !== null) {
      for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        
        labels.push(daysOfWeek[date.getDay()].substring(0, 3));
        
        // Add some minor variation to the prediction
        const variation = (Math.random() * 0.4) - 0.2; // Random value between -0.2 and 0.2
        const predictedValue = Math.max(1, Math.min(5, predictedMood + variation));
        data.push(predictedValue);
      }
    }
    
    return {
      labels,
      datasets: [
        {
          data: data.map(d => d || 0), // Replace null/undefined with 0
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Mood Rating"]
    };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Mood Predictions</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Analyzing your mood patterns...</Text>
          </View>
        ) : !hasEnoughData ? (
          <View style={styles.notEnoughDataContainer}>
            <Ionicons name="analytics-outline" size={64} color={theme.colors.subtext} />
            <Text style={styles.notEnoughDataTitle}>Not Enough Data</Text>
            <Text style={styles.notEnoughDataText}>
              We need at least 10 days of mood data to generate accurate predictions.
              Keep tracking your mood daily, and check back soon!
            </Text>
            <View style={styles.dataCountContainer}>
              <Text style={styles.dataCountText}>
                Current data: {moodEntries.length} day{moodEntries.length !== 1 ? 's' : ''}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(100, (moodEntries.length / 10) * 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.dataCountSubtext}>
                {10 - moodEntries.length} more day{10 - moodEntries.length !== 1 ? 's' : ''} needed
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.returnButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.returnButtonText}>Return to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.introSection}>
              <Text style={styles.greeting}>Hello {userName},</Text>
              <Text style={styles.subGreeting}>
                Here are your personalized mood insights based on your tracking history.
              </Text>
            </View>
            
            <View style={styles.predictionCard}>
              <Text style={styles.sectionTitle}>Tomorrow's Mood Prediction</Text>
              
              {predictedMood ? (
                <View style={styles.predictionContent}>
                  <View style={[
                    styles.moodEmojiContainer, 
                    { backgroundColor: getMoodColor(predictedMood) }
                  ]}>
                    <Text style={styles.moodEmoji}>{getMoodEmoji(predictedMood)}</Text>
                  </View>
                  <View style={styles.predictionTextContainer}>
                    <Text style={styles.predictionValue}>
                      {predictedMood.toFixed(1)} / 5
                    </Text>
                    <Text style={styles.predictionDescription}>
                      Based on your historical patterns, we predict your mood will be 
                      {predictedMood < 2.5 ? ' lower than average' : 
                       predictedMood > 3.5 ? ' better than average' : ' average'} tomorrow.
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.noDataText}>
                  Unable to predict tomorrow's mood due to insufficient data.
                </Text>
              )}
            </View>
            
            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>Your Mood Forecast</Text>
              <Text style={styles.chartSubtitle}>Past 7 days + Next 7 days prediction</Text>
              
              <LineChart
                data={getChartData()}
                width={screenWidth * 0.9}
                height={220}
                chartConfig={{
                  backgroundColor: theme.colors.card,
                  backgroundGradientFrom: theme.colors.card,
                  backgroundGradientTo: theme.colors.card,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: theme.colors.primary
                  }
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
              />
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                  <Text style={styles.legendText}>Actual Mood</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: 'rgba(134, 65, 244, 0.8)' }]} />
                  <Text style={styles.legendText}>Predicted Mood</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.patternsContainer}>
              <Text style={styles.sectionTitle}>Your Mood Patterns</Text>
              
              {moodPatterns.length > 0 ? (
                moodPatterns.map((pattern, index) => (
                  <View key={index} style={styles.patternCard}>
                    <View style={styles.patternHeader}>
                      <Text style={styles.patternDay}>{pattern.day}</Text>
                      <Text style={styles.patternType}>{pattern.pattern}</Text>
                    </View>
                    <Text style={styles.patternDescription}>{pattern.description}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>
                  No clear mood patterns detected yet. Continue tracking to reveal patterns.
                </Text>
              )}
            </View>
            
            {moodTriggers.length > 0 && (
              <View style={styles.triggersContainer}>
                <Text style={styles.sectionTitle}>Potential Mood Triggers</Text>
                <Text style={styles.sectionSubtitle}>
                  Based on your mood entries and descriptions
                </Text>
                
                {moodTriggers.map((trigger, index) => (
                  <View key={index} style={styles.triggerItem}>
                    <View style={[
                      styles.triggerIcon, 
                      { backgroundColor: trigger.impact === 'positive' ? theme.colors.mood5 : theme.colors.mood2 }
                    ]}>
                      <Ionicons 
                        name={trigger.impact === 'positive' ? 'trending-up' : 'trending-down'} 
                        size={16} 
                        color="#fff" 
                      />
                    </View>
                    <View style={styles.triggerContent}>
                      <Text style={styles.triggerName}>{trigger.trigger}</Text>
                      <Text style={styles.triggerImpact}>
                        {trigger.impact === 'positive' ? 'Positive impact' : 'Negative impact'} 
                        {' • '} 
                        Mentioned {trigger.frequency} time{trigger.frequency !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerText}>
                Note: These predictions are based on your historical mood patterns and may not account for unexpected events or changes in your routine.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: screenWidth * 0.05,
    paddingTop: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.subtext,
  },
  notEnoughDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 400,
  },
  notEnoughDataTitle: {
    fontSize: 22,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  notEnoughDataText: {
    fontSize: 16,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginBottom: 24,
  },
  dataCountContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  dataCountText: {
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  dataCountSubtext: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  returnButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  returnButtonText: {
    color: '#fff',
    fontWeight: theme.fontWeights.semibold,
    fontSize: 16,
  },
  introSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 16,
    color: theme.colors.subtext,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 16,
  },
  predictionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    ...theme.shadows.medium,
  },
  predictionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  moodEmojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  moodEmoji: {
    fontSize: 32,
  },
  predictionTextContainer: {
    flex: 1,
  },
  predictionValue: {
    fontSize: 24,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  predictionDescription: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  noDataText: {
    fontSize: 16,
    color: theme.colors.subtext,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  chartContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    ...theme.shadows.medium,
  },
  chartSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.subtext,
  },
  patternsContainer: {
    marginBottom: 24,
  },
  patternCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  patternDay: {
    fontSize: 16,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  patternType: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.semibold,
  },
  patternDescription: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  triggersContainer: {
    marginBottom: 24,
  },
  triggerItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  triggerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  triggerContent: {
    flex: 1,
  },
  triggerName: {
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  triggerImpact: {
    fontSize: 12,
    color: theme.colors.subtext,
  },
  disclaimerContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: theme.colors.subtext,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});