import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { MoodRating } from '../types';
import { generateMoodBasedPrompt } from '../services/geminiService';

interface MoodDetailsInputProps {
  onSubmit: (details: string) => Promise<void>;
  isVisible: boolean;
  moodRating: MoodRating;
  onGenerateRecommendations: () => Promise<void>; // New prop for generating recommendations without details
}

export default function MoodDetailsInput({ 
  onSubmit, 
  isVisible, 
  moodRating, 
  onGenerateRecommendations 
}: MoodDetailsInputProps) {
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);

  useEffect(() => {
    // Generate a prompt based on the mood rating when component becomes visible
    if (isVisible) {
      const loadPrompt = async () => {
        setIsLoadingPrompt(true);
        try {
          const generatedPrompt = await generateMoodBasedPrompt(moodRating);
          setPrompt(generatedPrompt);
        } catch (error) {
          console.error('Error loading prompt:', error);
          setPrompt('Tell us more about how you feel today...');
        } finally {
          setIsLoadingPrompt(false);
        }
      };
      
      loadPrompt();
    }
  }, [isVisible, moodRating]);

  if (!isVisible) return null;

  const handleSubmit = async () => {
    if (!details.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(details);
      setDetails(''); // Clear input after successful submission
    } catch (error) {
      console.error('Error submitting mood details:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    setIsGeneratingRecommendations(true);
    try {
      await onGenerateRecommendations();
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.headerContainer} 
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Ionicons 
            name="chatbubble-ellipses-outline" 
            size={20} 
            color={theme.colors.primary} 
          />
          <Text style={styles.headerText}>
            Tell us more about how you feel
          </Text>
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={theme.colors.subtext} 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.contentContainer}>
          {isLoadingPrompt ? (
            <View style={styles.promptLoadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.promptLoadingText}>Generating a prompt for you...</Text>
            </View>
          ) : (
            <Text style={styles.promptText}>{prompt}</Text>
          )}
          
          <TextInput
            style={styles.input}
            value={details}
            onChangeText={setDetails}
            placeholder="Share your thoughts here..."
            placeholderTextColor={theme.colors.subtext + '80'}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={200}
          />
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={handleGenerateRecommendations}
              disabled={isGeneratingRecommendations}
            >
              {isGeneratingRecommendations ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <>
                  <Text style={styles.generateButtonText}>Get Recommendations</Text>
                  <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} style={styles.generateIcon} />
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.submitButton,
                (!details.trim() || isSubmitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!details.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit</Text>
                  <Ionicons name="send" size={16} color="white" style={styles.sendIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.charCount}>
            {details.length}/200
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginLeft: 8,
  },
  contentContainer: {
    padding: 16,
  },
  promptText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 16,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  promptLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  promptLoadingText: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 80,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  generateButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: theme.fontWeights.medium,
  },
  generateIcon: {
    marginLeft: 6,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.primary + '80',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: theme.fontWeights.medium,
  },
  sendIcon: {
    marginLeft: 6,
  },
});