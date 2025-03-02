import { supabase } from '../utils/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Cache key for subscription status
const SUBSCRIPTION_CACHE_KEY = 'user_subscription_tier';

// Subscription tiers
export type SubscriptionTier = 'free' | 'premium';

// Get the current user's subscription tier
export async function getCurrentSubscriptionTier(): Promise<SubscriptionTier> {
  try {
    // First check local cache for faster response
    const cachedTier = await AsyncStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (cachedTier === 'premium') {
      return 'premium';
    }
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.log('No active session, returning free tier');
      return 'free';
    }
    
    // Query subscription status from Supabase
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('tier, expires_at')
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching subscription:', error);
      return 'free';
    }
    
    if (!data) {
      return 'free';
    }
    
    // Check if subscription is active (not expired)
    const now = new Date();
    const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
    
    if (data.tier === 'premium' && (!expiresAt || expiresAt > now)) {
      // Cache the premium status
      await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, 'premium');
      return 'premium';
    }
    
    return 'free';
  } catch (error) {
    console.error('Error getting subscription tier:', error);
    return 'free';
  }
}

// Subscribe to premium (in a real app, this would integrate with a payment provider)
export async function subscribeToPremium(): Promise<boolean> {
  try {
    console.log('Starting premium subscription process...');
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      Alert.alert('Error', 'You must be logged in to subscribe to premium.');
      return false;
    }
    
    console.log('User authenticated, proceeding with subscription...');
    
    // In a real app, this would trigger a payment flow
    // For this demo, we'll simulate a successful subscription
    
    // Set expiration date to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    // Check if user already has a subscription record
    const { data: existingSubscription, error: checkError } = await supabase
      .from('user_subscriptions')
      .select('id, tier')
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    console.log('Existing subscription check:', existingSubscription, checkError);
    
    let result;
    
    if (existingSubscription) {
      console.log('Updating existing subscription:', existingSubscription.id);
      // Update existing subscription
      result = await supabase
        .from('user_subscriptions')
        .update({
          tier: 'premium',
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id);
    } else {
      console.log('Creating new subscription for user:', session.user.id);
      // Create new subscription
      result = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: session.user.id,
          tier: 'premium',
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
    
    console.log('Subscription operation result:', result);
    
    if (result.error) {
      console.error('Error saving subscription:', result.error);
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
      return false;
    }
    
    // Cache the premium status
    await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, 'premium');
    
    // Show success message
    Alert.alert(
      'Subscription Successful',
      'You are now a premium member! Enjoy all the premium features.',
      [{ text: 'Great!' }]
    );
    
    return true;
  } catch (error) {
    console.error('Error subscribing to premium:', error);
    Alert.alert('Error', 'Failed to process subscription. Please try again.');
    return false;
  }
}

// Cancel premium subscription
export async function cancelPremiumSubscription(): Promise<boolean> {
  try {
    console.log('Starting subscription cancellation process...');
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      Alert.alert('Error', 'You must be logged in to manage your subscription.');
      return false;
    }
    
    console.log('User authenticated, proceeding with cancellation...');
    
    // Check if user has a subscription
    const { data: existingSubscription, error: checkError } = await supabase
      .from('user_subscriptions')
      .select('id, tier')
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    console.log('Existing subscription check:', existingSubscription, checkError);
    
    if (checkError) {
      console.error('Error checking existing subscription:', checkError);
      Alert.alert('Error', 'Failed to retrieve subscription information. Please try again.');
      return false;
    }
    
    if (!existingSubscription) {
      console.log('No subscription found');
      Alert.alert('Error', 'No subscription found.');
      return false;
    }
    
    console.log('Cancelling subscription:', existingSubscription.id);
    
    // Set expiration date to now (effectively cancelling the subscription)
    const result = await supabase
      .from('user_subscriptions')
      .update({
        tier: 'free',
        expires_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSubscription.id);
    
    console.log('Cancellation result:', result);
    
    if (result.error) {
      console.error('Error cancelling subscription:', result.error);
      Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
      return false;
    }
    
    // Clear the premium status from cache
    await AsyncStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
    
    // Show success message
    Alert.alert(
      'Subscription Cancelled',
      'Your premium subscription has been cancelled.',
      [{ text: 'OK' }]
    );
    
    return true;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
    return false;
  }
}

// Get subscription details
export async function getSubscriptionDetails(): Promise<any> {
  try {
    console.log('Getting subscription details...');
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.log('No active session, returning null');
      return null;
    }
    
    // Query subscription details from Supabase
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    console.log('Subscription details result:', data, error);
    
    if (error) {
      console.error('Error fetching subscription details:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting subscription details:', error);
    return null;
  }
}

// Check if a feature is available for the current subscription tier
export async function isFeatureAvailable(featureName: string): Promise<boolean> {
  const tier = await getCurrentSubscriptionTier();
  
  // Define which features are available for free users
  const freeFeatures = [
    'daily_mood_tracking',
    'basic_mood_summary',
    'simple_mood_trends',
    'daily_quote',
    'basic_activities',
    'streak_tracking',
    'theme_toggle',
    'basic_notifications'
  ];
  
  // If user is premium, all features are available
  if (tier === 'premium') {
    return true;
  }
  
  // Otherwise, check if the feature is in the free features list
  return freeFeatures.includes(featureName);
}

// Clear subscription cache (useful for testing or logout)
export async function clearSubscriptionCache(): Promise<void> {
  await AsyncStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
}