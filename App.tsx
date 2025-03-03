import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from './theme/theme';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import SetupNameScreen from './screens/SetupNameScreen';
import IntroductionScreen from './screens/IntroductionScreen';
import TipsScreen from './screens/TipsScreen';
import { isAuthenticated, signOut, getCurrentUser } from './services/authService';
import { supabase } from './utils/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define navigation stack param list
type RootStackParamList = {
  Login: undefined;
  SetupName: undefined;
  Introduction: { userName: string };
  Tips: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [initialRouteName, setInitialRouteName] = useState<keyof RootStackParamList>('Login');
  
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
        setInitialRouteName('Login');
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
        setInitialRouteName('Login');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setInitialRouteName('Login');
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
        setInitialRouteName('Home');
      } else {
        // Check if this is a new user or returning user
        if (isNewUser) {
          // New user - show onboarding
          // Check if user has a name set but hasn't completed full onboarding
          const storedName = await AsyncStorage.getItem('user_display_name');
          
          if (storedName) {
            setUserName(storedName);
            setInitialRouteName('Introduction');
          } else {
            // Get user email to extract name if available
            const user = await getCurrentUser();
            if (user?.email) {
              const emailName = user.email.split('@')[0];
              setUserName(emailName);
            }
            
            console.log('User needs to complete onboarding');
            setInitialRouteName('SetupName');
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
          
          setInitialRouteName('Home');
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setInitialRouteName('SetupName');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle login
  const handleLogin = (isSignUp: boolean) => {
    console.log('Login successful, isSignUp:', isSignUp);
    setIsNewUser(isSignUp);
    checkOnboardingStatus();
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await signOut();
      console.log('Logout successful, updating UI');
      setInitialRouteName('Login');
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
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator 
          initialRouteName={initialRouteName}
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background }
          }}
        >
          <Stack.Screen name="Login">
            {props => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
          
          <Stack.Screen name="SetupName">
            {props => (
              <SetupNameScreen 
                {...props}
                onComplete={(name) => {
                  AsyncStorage.setItem('user_display_name', name).then(() => {
                    setUserName(name);
                    props.navigation.navigate('Introduction');
                  });
                }}
                onSkip={() => {
                  if (userName) {
                    AsyncStorage.setItem('user_display_name', userName).catch(err => 
                      console.error('Error saving default user name:', err)
                    );
                  }
                  props.navigation.navigate('Introduction');
                }}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Introduction" initialParams={{ userName }}>
            {props => (
              <IntroductionScreen 
                {...props}
                onComplete={() => props.navigation.navigate('Tips')}
                userName={userName}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Tips">
            {props => (
              <TipsScreen 
                {...props}
                onComplete={() => {
                  AsyncStorage.setItem('onboarding_completed', 'true').then(() => {
                    props.navigation.navigate('Home');
                  }).catch(error => {
                    console.error('Error saving onboarding status:', error);
                    props.navigation.navigate('Home');
                  });
                }}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Home">
            {props => (
              <HomeScreen 
                {...props}
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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