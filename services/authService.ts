import { supabase } from '../utils/supabaseClient';

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth session check:', session ? 'Authenticated' : 'Not authenticated');
    return !!session;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user ? `${user.id} (${user.email})` : 'No user');
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper function to retry a function with exponential backoff
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed:`, error.message || error);
      lastError = error;
      
      // If it's not a network error or timeout, don't retry
      if (error.message && !error.message.includes('network') && !error.message.includes('timeout') && !error.message.includes('abort')) {
        throw error;
      }
      
      // Wait before next retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  
  throw lastError;
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  console.log('Attempting to sign in with email:', email);
  
  return retryOperation(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error.message);
      throw error;
    }
    
    console.log('Sign in successful:', data.user?.id);
    return data;
  });
};

// Check if a user exists with the given email
export const checkUserExists = async (email: string): Promise<boolean> => {
  console.log('Checking if user exists with email:', email);
  
  try {
    // Try to sign up with a random password to see if the user exists
    const { error } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36).slice(-12), // Random password
      options: {
        emailRedirectTo: undefined
      }
    });
    
    // If we get "User already registered" error, the user exists
    if (error && (
      error.message.includes('User already registered') || 
      error.message.includes('already exists') ||
      error.message.includes('already taken')
    )) {
      console.log('User exists with email:', email);
      return true;
    }
    
    // If no error or different error, user doesn't exist
    console.log('User does not exist with email:', email);
    return false;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string) => {
  console.log('Attempting to sign up with email:', email);
  
  // First check if user already exists
  const userExists = await checkUserExists(email);
  if (userExists) {
    console.log('User already exists, throwing error');
    const error = new Error('User already registered');
    error.name = 'UserExistsError';
    throw error;
  }
  
  return retryOperation(async () => {
    // Create a new account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Set this to false to allow immediate sign-in without email confirmation
        emailRedirectTo: undefined
      }
    });
    
    if (error) {
      console.error('Sign up error:', error.message);
      
      // Check for user already exists errors
      if (
        error.message.includes('User already registered') || 
        error.message.includes('already exists') ||
        error.message.includes('already taken')
      ) {
        const customError = new Error('User already registered');
        customError.name = 'UserExistsError';
        throw customError;
      }
      
      throw error;
    }
    
    console.log('Sign up response:', data);
    
    // Check if email confirmation is required
    if (data.user && !data.session) {
      if (data.user.identities && data.user.identities.length === 0) {
        const customError = new Error('User already registered');
        customError.name = 'UserExistsError';
        throw customError;
      }
      
      if (data.user.email_confirmed_at === null) {
        console.log('Email confirmation required');
        // Create a custom error for email confirmation required
        const confirmationError = new Error('Email confirmation required');
        confirmationError.name = 'EmailConfirmationRequired';
        throw confirmationError;
      }
    }
    
    return data;
  });
};

// Sign out
export const signOut = async () => {
  console.log('Attempting to sign out');
  
  return retryOperation(async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error.message);
      throw error;
    }
    
    console.log('Sign out successful');
  });
};

// Reset password
export const resetPassword = async (email: string) => {
  console.log('Attempting to reset password for:', email);
  
  return retryOperation(async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      console.error('Password reset error:', error.message);
      throw error;
    }
    
    console.log('Password reset email sent');
  });
};

// Resend confirmation email
export const resendConfirmationEmail = async (email: string) => {
  console.log('Attempting to resend confirmation email for:', email);
  
  return retryOperation(async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    if (error) {
      console.error('Resend confirmation email error:', error.message);
      throw error;
    }
    
    console.log('Confirmation email resent');
  });
};