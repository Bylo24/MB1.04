import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Profile: undefined;
  Tips: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Introduction: undefined;
  SetupName: undefined;
  Login: undefined;
  Main: NavigatorScreenParams<TabParamList>;
  Subscription: undefined;
  SubscriptionComparison: undefined;
  PremiumComparison: undefined;
};

export type MoodEntry = {
  id: string;
  date: string;
  mood: number;
  notes?: string;
  activities?: string[];
};

export type UserProfile = {
  name: string;
  email?: string;
  isPremium: boolean;
  joinDate: string;
};