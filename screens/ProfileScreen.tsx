import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { getCurrentUser } from '../services/authService';
import { getMoodStreak, getAverageMood } from '../services/moodService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabaseClient';
import { MoodRating } from '../types';
import { getCurrentSubscriptionTier, SubscriptionTier, toggleSubscriptionForDemo } from '../services/subscriptionService';
import PremiumFeatureModal from '../components/PremiumFeatureModal';
import SubscriptionComparisonScreen from './SubscriptionComparisonScreen';

interface ProfileScreenProps {
  onClose: () => void;
  onLogout: () => void;
}

export default function ProfileScreen({ onClose, onLogout }: ProfileScreenProps) {
  const [userName, setUserName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [streak, setStreak] = useState(0);
  const [averageMood, setAverageMood] = useState<number | null>(null);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);
  const [subscriptionComparisonVisible, setSubscriptionComparisonVisible] = useState(false);
  
  // Edit profile states
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Available languages
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
  ];
  
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // Try to get stored display name first
        const storedName = await AsyncStorage.getItem('user_display_name');
        
        // Load saved language preference
        const savedLanguage = await AsyncStorage.getItem('user_language');
        if (savedLanguage) {
          const langObj = languages.find(lang => lang.code === savedLanguage);
          if (langObj) {
            setCurrentLanguage(langObj.name);
          }
        }
        
        // Load notification preference
        const notifications = await AsyncStorage.getItem('notifications_enabled');
        setNotificationsEnabled(notifications !== 'false'); // Default to true
        
        // Load subscription tier
        const tier = await getCurrentSubscriptionTier();
        setSubscriptionTier(tier);
        
        const user = await getCurrentUser();
        if (user) {
          // Use stored name if available, otherwise extract from email
          if (storedName) {
            setUserName(storedName);
          } else {
            const name = user.email ? user.email.split('@')[0] : 'User';
            setUserName(name);
            // Store the name for future use
            await AsyncStorage.setItem('user_display_name', name);
          }
          
          setEmail(user.email || '');
          
          // Load streak
          const currentStreak = await getMoodStreak();
          setStreak(currentStreak);
          
          // Load average mood
          const avgMood = await getAverageMood(30); // Last 30 days
          setAverageMood(avgMood);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  // Function to convert mood rating to emoji
  function getMoodEmoji(rating: number | null): string {
    if (rating === null) return '–';
    const roundedRating = Math.round(rating) as MoodRating;
    switch (roundedRating) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '😄';
      default: return '–';
    }
  }
  
  // Function to get mood color based on rating
  function getMoodColor(rating: number | null): string {
    if (rating === null) return theme.colors.text;
    const roundedRating = Math.round(rating) as MoodRating;
    switch (roundedRating) {
      case 1: return theme.colors.mood1 || '#E53935';
      case 2: return theme.colors.mood2 || '#FB8C00';
      case 3: return theme.colors.mood3 || '#FDD835';
      case 4: return theme.colors.mood4 || '#7CB342';
      case 5: return theme.colors.mood5 || '#43A047';
      default: return theme.colors.text;
    }
  }
  
  // Direct sign out function with minimal steps
  const handleDirectSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Show loading state
              setIsSigningOut(true);
              console.log('User confirmed direct sign out');
              
              // Close the modal first
              onClose();
              
              // Short delay to let modal close
              setTimeout(async () => {
                try {
                  // Clear all storage
                  console.log('Clearing AsyncStorage');
                  await AsyncStorage.clear();
                  
                  // Sign out from Supabase
                  console.log('Signing out from Supabase');
                  await supabase.auth.signOut();
                  
                  // Call the logout callback
                  console.log('Calling onLogout callback');
                  onLogout();
                } catch (error) {
                  console.error('Error during direct sign out:', error);
                  Alert.alert('Error', 'Failed to sign out. Please try again.');
                }
              }, 300);
            } catch (error) {
              console.error('Error in direct sign out:', error);
              setIsSigningOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  // Handle language selection
  const handleLanguageSelect = async (langCode: string, langName: string) => {
    try {
      // Save language preference
      await AsyncStorage.setItem('user_language', langCode);
      setCurrentLanguage(langName);
      setLanguageModalVisible(false);
      
      // Show confirmation
      Alert.alert(
        'Language Updated',
        `Your language has been set to ${langName}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving language preference:', error);
      Alert.alert('Error', 'Failed to update language. Please try again.');
    }
  };
  
  // Open edit profile modal
  const handleEditProfile = () => {
    setNewName(userName);
    setEditProfileModalVisible(true);
  };
  
  // Save profile changes
  const handleSaveProfile = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    
    setIsSavingProfile(true);
    
    try {
      // Save the new name to AsyncStorage
      await AsyncStorage.setItem('user_display_name', newName.trim());
      
      // Update the state
      setUserName(newName.trim());
      
      // Close the modal
      setEditProfileModalVisible(false);
      
      // Show success message
      Alert.alert(
        'Profile Updated',
        'Your profile has been updated successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  // Handle notifications toggle
  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', value.toString());
    // In a real app, you would register/unregister for notifications here
  };
  
  // Handle subscription upgrade/downgrade
  const handleSubscriptionToggle = async () => {
    try {
      setIsUpdatingSubscription(true);
      
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
      setIsUpdatingSubscription(false);
    }
  };
  
  // Open subscription comparison screen
  const handleOpenSubscriptionComparison = () => {
    setSubscriptionComparisonVisible(true);
  };
  
  // Close subscription comparison screen
  const handleCloseSubscriptionComparison = async () => {
    setSubscriptionComparisonVisible(false);
    // Refresh subscription tier after closing
    const tier = await getCurrentSubscriptionTier();
    setSubscriptionTier(tier);
  };
  
  // Open premium modal
  const handleOpenPremiumModal = () => {
    if (subscriptionTier === 'premium') {
      // If already premium, show cancel option
      Alert.alert(
        'Premium Subscription',
        'You currently have an active premium subscription.',
        [
          { text: 'OK' },
          { 
            text: 'Cancel Subscription', 
            style: 'destructive',
            onPress: handleSubscriptionToggle
          }
        ]
      );
    } else {
      // If free, show subscription comparison screen
      handleOpenSubscriptionComparison();
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  if (subscriptionComparisonVisible) {
    return (
      <SubscriptionComparisonScreen 
        onClose={handleCloseSubscriptionComparison}
        onSubscribe={handleSubscriptionToggle}
        showCloseButton={true}
        source="upgrade"
      />
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
          disabled={isSigningOut}
        >
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.email}>{email}</Text>
          
          <TouchableOpacity
            onPress={handleOpenPremiumModal}
            style={[
              styles.subscriptionBadge,
              subscriptionTier === 'premium' ? styles.premiumBadge : styles.freeBadge
            ]}
          >
            <Ionicons 
              name={subscriptionTier === 'premium' ? 'diamond' : 'star'} 
              size={16} 
              color={subscriptionTier === 'premium' ? theme.colors.primary : theme.colors.accent} 
            />
            <Text style={[
              styles.subscriptionBadgeText,
              subscriptionTier === 'premium' ? styles.premiumBadgeText : styles.freeBadgeText
            ]}>
              {subscriptionTier === 'premium' ? 'PREMIUM' : 'FREE'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[
              styles.statValue, 
              { color: getMoodColor(averageMood) }
            ]}>
              {getMoodEmoji(averageMood)}
            </Text>
            <Text style={styles.statLabel}>Avg Mood</Text>
          </View>
        </View>
        
        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionTitle}>
                {subscriptionTier === 'premium' ? 'Premium Plan' : 'Free Plan'}
              </Text>
              <View style={[
                styles.subscriptionStatusBadge,
                subscriptionTier === 'premium' ? styles.premiumStatusBadge : styles.freeStatusBadge
              ]}>
                <Text style={[
                  styles.subscriptionStatusText,
                  subscriptionTier === 'premium' ? styles.premiumStatusText : styles.freeStatusText
                ]}>
                  {subscriptionTier === 'premium' ? 'ACTIVE' : 'BASIC'}
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
                subscriptionTier === 'premium' ? styles.cancelButton : styles.upgradeButton,
                isUpdatingSubscription && styles.disabledButton
              ]}
              onPress={subscriptionTier === 'premium' ? handleSubscriptionToggle : handleOpenSubscriptionComparison}
              disabled={isUpdatingSubscription}
            >
              {isUpdatingSubscription ? (
                <ActivityIndicator size="small" color={subscriptionTier === 'premium' ? theme.colors.error : 'white'} />
              ) : (
                <Text style={[
                  styles.subscriptionButtonText,
                  subscriptionTier === 'premium' ? styles.cancelButtonText : styles.upgradeButtonText
                ]}>
                  {subscriptionTier === 'premium' ? 'Cancel Subscription' : 'Upgrade to Premium'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleEditProfile}
          >
            <Ionicons name="person-outline" size={24} color={theme.colors.text} />
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setLanguageModalVisible(true)}
          >
            <Ionicons name="language-outline" size={24} color={theme.colors.text} />
            <Text style={styles.menuItemText}>Language</Text>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>{currentLanguage}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="lock-closed-outline" size={24} color={theme.colors.text} />
            <Text style={styles.menuItemText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
          </TouchableOpacity>
        </View>
        
        {/* Notifications Section */}
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
        
        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.text} />
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.text} />
            <Text style={styles.menuItemText}>About</Text>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>v1.0.0</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
            </View>
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
        
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleDirectSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator size="small" color={theme.colors.error} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setLanguageModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.modalItem,
                    currentLanguage === language.name && styles.modalItemSelected
                  ]}
                  onPress={() => handleLanguageSelect(language.code, language.name)}
                >
                  <Text 
                    style={[
                      styles.modalItemText,
                      currentLanguage === language.name && styles.modalItemTextSelected
                    ]}
                  >
                    {language.name}
                  </Text>
                  {currentLanguage === language.name && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setEditProfileModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Display Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.colors.subtext}
                  autoCapitalize="words"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <View style={styles.disabledInput}>
                  <Text style={styles.disabledInputText}>{email}</Text>
                </View>
                <Text style={styles.formHint}>Email cannot be changed</Text>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.saveButton,
                  (!newName.trim() || isSavingProfile) && styles.saveButtonDisabled
                ]}
                onPress={handleSaveProfile}
                disabled={!newName.trim() || isSavingProfile}
              >
                {isSavingProfile ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Premium Feature Modal */}
      <PremiumFeatureModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onUpgrade={handleOpenSubscriptionComparison}
        featureName="Unlock Premium Features"
        featureDescription="Take your mood tracking to the next level with premium features designed to help you understand and improve your mental wellbeing."
      />
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
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: theme.fontWeights.bold,
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: theme.colors.subtext,
    marginBottom: 8,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
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
    marginLeft: 4,
  },
  freeBadgeText: {
    color: theme.colors.accent,
  },
  premiumBadgeText: {
    color: theme.colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '45%',
    ...theme.shadows.small,
  },
  statValue: {
    fontSize: 24,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.subtext,
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
  subscriptionStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeStatusBadge: {
    backgroundColor: theme.colors.accent + '20',
  },
  premiumStatusBadge: {
    backgroundColor: theme.colors.primary + '20',
  },
  subscriptionStatusText: {
    fontSize: 12,
    fontWeight: theme.fontWeights.bold,
  },
  freeStatusText: {
    color: theme.colors.accent,
  },
  premiumStatusText: {
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
  disabledButton: {
    opacity: 0.7,
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
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemValue: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginRight: 8,
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
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 32,
    ...theme.shadows.small,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.error,
    marginLeft: 8,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    ...theme.shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalList: {
    padding: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  modalItemSelected: {
    backgroundColor: theme.colors.primary + '15',
  },
  modalItemText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  modalItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.semibold,
  },
  // Form styles
  modalContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disabledInput: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    opacity: 0.7,
  },
  disabledInputText: {
    fontSize: 16,
    color: theme.colors.subtext,
  },
  formHint: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.primary + '80',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
  },
});