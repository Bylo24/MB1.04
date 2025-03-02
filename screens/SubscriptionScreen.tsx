import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { getCurrentSubscriptionTier, subscribeToPremium, cancelPremiumSubscription } from '../services/subscriptionService';

interface SubscriptionScreenProps {
  onClose: () => void;
}

export default function SubscriptionScreen({ onClose }: SubscriptionScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState<'free' | 'premium'>('free');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Load subscription status
  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      try {
        const tier = await getCurrentSubscriptionTier();
        setCurrentTier(tier);
      } catch (error) {
        console.error('Error loading subscription status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSubscriptionStatus();
  }, []);

  // Handle subscription
  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const success = await subscribeToPremium();
      if (success) {
        setCurrentTier('premium');
      }
    } catch (error) {
      console.error('Error subscribing to premium:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  // Handle cancellation
  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const success = await cancelPremiumSubscription();
      if (success) {
        setCurrentTier('free');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading subscription details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentTier === 'premium' ? 'Manage Subscription' : 'Upgrade to Premium'}
        </Text>
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <FontAwesome name="diamond" size={80} color={theme.colors.premium} />
          </View>
          <Text style={styles.heroTitle}>
            {currentTier === 'premium' ? 'Premium Subscription' : 'Unlock Premium Features'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {currentTier === 'premium' 
              ? 'Thank you for being a premium member!' 
              : 'Get personalized insights, unlimited check-ins, and more'}
          </Text>
        </View>
        
        <View style={styles.plansContainer}>
          {/* Free Plan */}
          <View style={[
            styles.planCard, 
            currentTier === 'free' && styles.currentPlanCard
          ]}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>🆓 Free Plan</Text>
              {currentTier === 'free' && (
                <View style={styles.currentPlanBadge}>
                  <Text style={styles.currentPlanText}>Current</Text>
                </View>
              )}
            </View>
            
            <View style={styles.featuresContainer}>
              <FeatureItem text="Daily Mood Tracking – Once per day" />
              <FeatureItem text="Basic Mood Summary" />
              <FeatureItem text="Simple Mood Trends Graph" />
              <FeatureItem text="Daily Mental Health Quote" />
              <FeatureItem text="Limited Activity Recommendations" />
              <FeatureItem text="Basic Streak Tracking" />
              <FeatureItem text="Light & Dark Mode" />
              <FeatureItem text="Basic Daily Notifications" />
            </View>
          </View>
          
          {/* Premium Plan */}
          <View style={[
            styles.planCard, 
            styles.premiumPlanCard,
            currentTier === 'premium' && styles.currentPlanCard
          ]}>
            <View style={styles.planHeader}>
              <Text style={[styles.planTitle, styles.premiumPlanTitle]}>💎 Premium Plan</Text>
              {currentTier === 'premium' && (
                <View style={styles.currentPlanBadge}>
                  <Text style={styles.currentPlanText}>Current</Text>
                </View>
              )}
            </View>
            
            <View style={styles.featuresContainer}>
              <FeatureItem text="Unlimited Mood Check-ins" isPremium />
              <FeatureItem text="Advanced Mood Analytics & Reports" isPremium />
              <FeatureItem text="AI-Driven Activity Recommendations" isPremium />
              <FeatureItem text="Customizable Mood Tracking" isPremium />
              <FeatureItem text="Guided Exercises & Meditations" isPremium />
              <FeatureItem text="Enhanced Streak Rewards" isPremium />
              <FeatureItem text="AI Mood Predictions" isPremium />
              <FeatureItem text="Personalized Themes" isPremium />
              <FeatureItem text="Journaling Feature" isPremium />
              <FeatureItem text="Ad-Free Experience" isPremium />
            </View>
          </View>
        </View>
        
        <View style={styles.ctaContainer}>
          {currentTier === 'premium' ? (
            <TouchableOpacity 
              style={[
                styles.cancelButton,
                isCancelling && styles.buttonDisabled
              ]}
              onPress={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={[
                  styles.subscribeButton,
                  isSubscribing && styles.buttonDisabled
                ]}
                onPress={handleSubscribe}
                disabled={isSubscribing}
              >
                {isSubscribing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.subscribeButtonText}>Upgrade to Premium</Text>
                )}
              </TouchableOpacity>
              
              <Text style={styles.pricingInfo}>
                $4.99/month or $49.99/year
              </Text>
            </>
          )}
          
          <TouchableOpacity onPress={onClose} style={styles.closeTextButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper component for feature items
function FeatureItem({ text, isPremium = false }: { text: string; isPremium?: boolean }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons 
        name="checkmark-circle" 
        size={20} 
        color={isPremium ? theme.colors.premium : theme.colors.success} 
      />
      <Text style={[
        styles.featureText,
        isPremium && styles.premiumFeatureText
      ]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.medium,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: theme.colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
  },
  plansContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.medium,
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  premiumPlanCard: {
    backgroundColor: theme.colors.cardAlt,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  premiumPlanTitle: {
    color: theme.colors.premium,
  },
  currentPlanBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentPlanText: {
    color: 'white',
    fontSize: 12,
    fontWeight: theme.fontWeights.semibold,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: theme.colors.text,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  premiumFeatureText: {
    fontWeight: theme.fontWeights.medium,
  },
  ctaContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  subscribeButton: {
    backgroundColor: theme.colors.premium,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    ...theme.shadows.small,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: theme.fontWeights.bold,
  },
  pricingInfo: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: theme.fontWeights.bold,
  },
  closeTextButton: {
    paddingVertical: 12,
  },
  closeText: {
    fontSize: 16,
    color: theme.colors.subtext,
    fontWeight: theme.fontWeights.medium,
  },
});