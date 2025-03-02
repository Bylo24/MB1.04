export type MoodRating = 1 | 2 | 3 | 4 | 5;

export type MoodEntry = {
  id?: string;
  user_id: string;
  date: string;
  rating: MoodRating;
  note?: string;
  created_at?: string;
};

export type Activity = {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  category: 'mindfulness' | 'exercise' | 'social' | 'creative' | 'relaxation';
  moodImpact: 'low' | 'medium' | 'high';
  imageUrl?: string;
  tags?: string[]; // Added tags field
};

export type User = {
  id: string;
  email: string;
  created_at: string;
};