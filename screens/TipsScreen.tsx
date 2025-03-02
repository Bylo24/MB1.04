import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  useWindowDimensions
} from 'react-native';
import { theme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import OnboardingProgress from '../components/OnboardingProgress';

interface TipsScreenProps {
  onComplete: () => void;
}

export default function TipsScreen({ onComplete }: TipsScreenProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <OnboardingProgress steps={3} currentStep={2} />
          <Text style={styles.title}>Tips for Getting Started</Text>
          <Text style={styles.subtitle}>
            Here are a few tips to help you get the most out of Mood Buddy
          </Text>
        </View>
        
        <View style={styles.tipsContainer}>
          <View style={styles.tipItem}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>1</Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Track Daily</Text>
              <Text style={styles.tipDescription}>
                Try to log your mood every day for the most accurate insights. It only takes a few seconds!
              </Text>
            </View>
          </View>
          
          <View style={styles.tipItem}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>2</Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Be Honest</Text>
              <Text style={styles.tipDescription}>
                Record how you truly feel, not how you think you should feel. This app is for your eyes only.
              </Text>
            </View>
          </View>
          
          <View style={styles.tipItem}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>3</Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Try Activities</Text>
              <Text style={styles.tipDescription}>
                The recommended activities are personalized based on your mood patterns. Give them a try!
              </Text>
            </View>
          </View>
          
          <View style={styles.tipItem}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>4</Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Check Trends</Text>
              <Text style={styles.tipDescription}>
                Review your mood trends weekly to gain insights about what affects your emotional wellbeing.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={onComplete}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100, // Extra padding for footer
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginHorizontal: 20,
    lineHeight: 22,
  },
  tipsContainer: {
    marginTop: 10,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  tipNumberText: {
    color: 'white',
    fontSize: 18,
    fontWeight: theme.fontWeights.bold,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: theme.colors.subtext,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: theme.fontWeights.bold,
  },
});