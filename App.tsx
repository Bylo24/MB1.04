import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './theme/theme';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import SetupNameScreen from './screens/SetupNameScreen';
import IntroductionScreen from './screens/IntroductionScreen';
import TipsScreen from './screens/TipsScreen';
import { isAuthenticated, signOut, getCurrentUser } from './services/authService';
import { supabase } from './utils/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define app states
type AppState = 'loading' | 'login' | 'onboarding-name' | 'onboarding-intro' | 'onboarding-tips' | 'home';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Check authentication status when app loads
  useEffect(() => {
    checkAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      console.log('Session:', session ? 'Present' : 'None');
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in, checking onboarding status');
        checkOnboardingStatus();
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log('User signed out, updating UI');
        setAppState('login');
        setIsLoading(false);
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  // Check if user is authenticated
  const checkAuth = async () => {
    setIsLoading(true);
    try {
      console.log('Checking authentication status...');
      const authenticated = await isAuthenticated();
      console.log('Authentication check result:', authenticated);
      
      if (authenticated) {
        await checkOnboardingStatus();
      } else {
        setAppState('login');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setAppState('login');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if user has completed onboarding
  const checkOnboardingStatus = async () => {
    try {
      // Check if user has completed onboarding
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      
      if (onboardingCompleted === 'true') {
        console.log('User has completed onboarding, proceeding to home');
        // Get user name
        const storedName = await AsyncStorage.getItem('user_display_name');
        if (storedName) {
          setUserName(storedName);
        } else {
          // Fall back to email-based name
          const user = await getCurrentUser();
          if (user?.email) {
            const emailName = user.email.split('@')[0];
            setUserName(emailName);
            // Save this name for future use
            await AsyncStorage.setItem('user_display_name', emailName);
          }
        }
        setAppState('home');
      } else {
        // Check if this is a new user or returning user
        if (isNewUser) {
          // New user - show onboarding
          // Check if user has a name set but hasn't completed full onboarding
          const storedName = await AsyncStorage.getItem('user_display_name');
          
          if (storedName) {
            setUserName(storedName);
            setAppState('onboarding-intro');
          } else {
            // Get user email to extract name if available
            const user = await getCurrentUser();
            if (user?.email) {
              const emailName = user.email.split('@')[0];
              setUserName(emailName);
            }
            
            console.log('User needs to complete onboarding');
            setAppState('onboarding-name');
          }
        } else {
          // Returning user - skip onboarding and mark as completed
          console.log('Returning user, skipping onboarding');
          await AsyncStorage.setItem('onboarding_completed', 'true');
          
          // Get user name
          const storedName = await AsyncStorage.getItem('user_display_name');
          if (storedName) {
            setUserName(storedName);
          } else {
            // Fall back to email-based name
            const user = await getCurrentUser();
            if (user?.email) {
              const emailName = user.email.split('@')[0];
              setUserName(emailName);
              // Save this name for future use
              await AsyncStorage.setItem('user_display_name', emailName);
            }
          }
          
          setAppState('home');
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setAppState('onboarding-name');
    }
  };
  
  // Handle login
  const handleLogin = (isSignUp: boolean) => {
    console.log('Login successful, isSignUp:', isSignUp);
    setIsNewUser(isSignUp);
    checkOnboardingStatus();
  };
  
  // Handle name setup completion
  const handleNameComplete = async (name: string) => {
    console.log('Name setup complete with name:', name);
    try {
      await AsyncStorage.setItem('user_display_name', name);
      setUserName(name);
      setAppState('onboarding-intro');
    } catch (error) {
      console.error('Error saving user name:', error);
      // Proceed anyway
      setAppState('onboarding-intro');
    }
  };
  
  // Handle name setup skip
  const handleNameSkip = async () => {
    console.log('Name setup skipped');
    // If we have a username from email, use that
    if (userName) {
      try {
        await AsyncStorage.setItem('user_display_name', userName);
      } catch (error) {
        console.error('Error saving default user name:', error);
      }
    }
    setAppState('onboarding-intro');
  };
  
  // Handle introduction completion
  const handleIntroComplete = () => {
    console.log('Introduction complete');
    setAppState('onboarding-tips');
  };
  
  // Handle tips completion
  const handleTipsComplete = async () => {
    console.log('Tips complete, onboarding finished');
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setAppState('home');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // Proceed anyway
      setAppState('home');
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await signOut();
      console.log('Logout successful, updating UI');
      setAppState('login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer}>
          <StatusBar style="light" />
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading Mood Buddy...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }
  
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        {appState === 'login' && (
          <LoginScreen onLogin={handleLogin} />
        )}
        
        {appState === 'onboarding-name' && (
          <SetupNameScreen 
            onComplete={handleNameComplete}
            onSkip={handleNameSkip}
          />
        )}
        
        {appState === 'onboarding-intro' && (
          <IntroductionScreen 
            onComplete={handleIntroComplete}
            userName={userName}
          />
        )}
        
        {appState === 'onboarding-tips' && (
          <TipsScreen 
            onComplete={handleTipsComplete}
          />
        )}
        
        {appState === 'home' && (
          <HomeScreen onLogout={handleLogout} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.subtext,
  },
});