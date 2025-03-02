import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { getCurrentSubscriptionTier, SubscriptionTier, toggleSubscriptionForDemo } from '../services/subscriptionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsScreenProps {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // Load subscription tier
        const tier = await getCurrentSubscriptionTier();
        setSubscriptionTier(tier);
        
        // Load theme preference
        const darkMode = await AsyncStorage.getItem('dark_mode');
        setIsDarkMode(darkMode === 'true');
        
        // Load notification preference
        const notifications = await AsyncStorage.getItem('notifications_enabled');
        setNotificationsEnabled(notifications !== 'false'); // Default to true
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  const handleThemeToggle = async (value: boolean) => {
    setIsDarkMode(value);
    await AsyncStorage.setItem('dark_mode', value.toString());
    // In a real app, you would apply the theme change here
  };
  
  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', value.toString());
    // In a real app, you would register/unregister for notifications here
  };
  
  const handleSubscriptionToggle = async () => {
    try {
      setIsLoading(true);
      
      // For demo purposes, we'll just toggle between free and premium
      const newTier = await toggleSubscriptionForDemo();
      setSubscriptionTier(newTier);
      
      Alert.alert(
        newTier === 'premium' ? 'Premium Activated' : 'Subscription Cancelled',
        newTier === 'premium' 
          ? 'You now have access to all premium features!' 
          : 'Your subscription has been cancelled. You can still use the free features.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error toggling subscription:', error);
      Alert.alert('Error', 'Failed to update subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionTitle}>
                {subscriptionTier === 'premium' ? 'Premium Plan' : 'Free Plan'}
              </Text>
              <View style={[
                styles.subscriptionBadge,
                subscriptionTier === 'premium' ? styles.premiumBadge : styles.freeBadge
              ]}>
                <Text style={[
                  styles.subscriptionBadgeText,
                  subscriptionTier === 'premium' ? styles.premiumBadgeText : styles.freeBadgeText
                ]}>
                  {subscriptionTier === 'premium' ? 'PREMIUM' : 'FREE'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.subscriptionDescription}>
              {subscriptionTier === 'premium' 
                ? 'You have access to all premium features including unlimited mood check-ins, advanced analytics, and more.'
                : 'Upgrade to Premium for unlimited mood check-ins, advanced analytics, and more premium features.'}
            </Text>
            
            <TouchableOpacity 
              style={[
                styles.subscriptionButton,
                subscriptionTier === 'premium' ? styles.cancelButton : styles.upgradeButton
              ]}
              onPress={handleSubscriptionToggle}
            >
              <Text style={[
                styles.subscriptionButtonText,
                subscriptionTier === 'premium' ? styles.cancelButtonText : styles.upgradeButtonText
              ]}>
                {subscriptionTier === 'premium' ? 'Cancel Subscription' : 'Upgrade to Premium'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Ionicons name="moon-outline" size={24} color={theme.colors.text} />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleThemeToggle}
              trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
              thumbColor={isDarkMode ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
              <Text style={styles.settingText}>Daily Reminders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
              thumbColor={notificationsEnabled ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.text} />
            <Text style={styles.menuItemText}>App Version</Text>
            <Text style={styles.menuItemValue}>1.0.0</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="document-text-outline" size={24} color={theme.colors.text} />
            <Text style={styles.menuItemText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-outline" size={24} color={theme.colors.text} />
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  placeholder: {
    width: 36, // Same width as close button for balance
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 12,
  },
  subscriptionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.medium,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  subscriptionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeBadge: {
    backgroundColor: theme.colors.accent + '20',
  },
  premiumBadge: {
    backgroundColor: theme.colors.primary + '20',
  },
  subscriptionBadgeText: {
    fontSize: 12,
    fontWeight: theme.fontWeights.bold,
  },
  freeBadgeText: {
    color: theme.colors.accent,
  },
  premiumBadgeText: {
    color: theme.colors.primary,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 16,
    lineHeight: 20,
  },
  subscriptionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  subscriptionButtonText: {
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
  },
  upgradeButtonText: {
    color: 'white',
  },
  cancelButtonText: {
    color: theme.colors.error,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    ...theme.shadows.small,
  },
  settingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    ...theme.shadows.small,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
  },
  menuItemValue: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.subtext,
  },
});