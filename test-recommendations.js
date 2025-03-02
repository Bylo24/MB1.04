// Simple test script to verify our recommendation simulation

// Mock the Activity type and allActivities array
const allActivities = [
  {
    id: '1',
    title: '5-Minute Meditation',
    description: 'Take a short break to clear your mind and focus on your breathing.',
    duration: 5,
    category: 'mindfulness',
    moodImpact: 'medium',
    tags: ['stress', 'anxiety', 'calm', 'focus', 'beginner']
  },
  {
    id: '2',
    title: 'Quick Stretching',
    description: 'Loosen up with some simple stretches to release tension.',
    duration: 10,
    category: 'exercise',
    moodImpact: 'medium',
    tags: ['energy', 'tension', 'physical', 'morning', 'beginner']
  },
  {
    id: '3',
    title: 'Gratitude Journaling',
    description: 'Write down three things you are grateful for today.',
    duration: 15,
    category: 'mindfulness',
    moodImpact: 'high',
    tags: ['negative thoughts', 'perspective', 'reflection', 'sadness', 'intermediate']
  },
  {
    id: '4',
    title: 'Call a Friend',
    description: 'Reach out to someone you care about for a quick chat.',
    duration: 20,
    category: 'social',
    moodImpact: 'high',
    tags: ['loneliness', 'connection', 'support', 'isolation', 'beginner']
  },
  {
    id: '5',
    title: 'Nature Walk',
    description: 'Take a walk outside and connect with nature.',
    duration: 30,
    category: 'exercise',
    moodImpact: 'high',
    tags: ['stress', 'fresh air', 'perspective', 'energy', 'beginner']
  }
];

// Simplified simulation function
function simulateRecommendations(moodRating, moodDetails) {
  console.log(`Simulating recommendations for mood ${moodRating} and details: "${moodDetails}"`);
  
  // Convert details to lowercase for easier matching
  const details = moodDetails.toLowerCase();
  
  // Score activities based on mood and details
  const scoredActivities = allActivities.map(activity => {
    let score = 0;
    
    // Score based on mood rating
    if (moodRating <= 2) {
      // For low mood, prioritize mindfulness and social activities
      if (activity.category === 'mindfulness') score += 3;
      if (activity.category === 'social') score += 2;
    } else if (moodRating === 3) {
      // For neutral mood, balanced approach
      if (activity.category === 'exercise') score += 2;
    } else {
      // For good mood, enhance it further
      if (activity.category === 'exercise') score += 3;
      if (activity.category === 'social') score += 3;
    }
    
    // Score based on keywords in the details
    const keywords = {
      'stress': ['meditation', 'breathing', 'nature'],
      'anxiety': ['breathing', 'meditation'],
      'sad': ['friend', 'gratitude'],
      'tired': ['stretching', 'walk'],
      'lonely': ['friend', 'social']
    };
    
    // Check if any keywords from the user's details match our mapping
    for (const [keyword, relatedActivities] of Object.entries(keywords)) {
      if (details.includes(keyword)) {
        // If the activity title or description contains any related activity keyword
        for (const relatedActivity of relatedActivities) {
          if (
            activity.title.toLowerCase().includes(relatedActivity) || 
            activity.description.toLowerCase().includes(relatedActivity) ||
            activity.category.toLowerCase().includes(relatedActivity) ||
            activity.tags?.some(tag => tag.includes(relatedActivity))
          ) {
            score += 3;
          }
        }
      }
    }
    
    return { activity, score };
  });
  
  // Sort by score (highest first) and take the top 3
  const topActivities = scoredActivities
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.activity);
  
  return topActivities;
}

// Test different scenarios
const testCases = [
  { rating: 2, details: "I'm feeling stressed about work" },
  { rating: 4, details: "I'm feeling energetic and happy today" },
  { rating: 3, details: "I'm feeling a bit tired but okay" },
  { rating: 1, details: "I'm feeling very sad and lonely" },
  { rating: 5, details: "I'm excited about my upcoming vacation" }
];

// Run tests
testCases.forEach(test => {
  const recommendations = simulateRecommendations(test.rating, test.details);
  console.log(`For mood ${test.rating} and details "${test.details}":`);
  console.log('Recommended activities:');
  recommendations.forEach(activity => {
    console.log(`- ${activity.title} (${activity.category})`);
  });
  console.log('---');
});
