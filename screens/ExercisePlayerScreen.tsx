import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { getExerciseById } from '../data/exercisesData';

const { width: screenWidth } = Dimensions.get('window');

interface ExercisePlayerScreenProps {
  navigation: any;
  route: any;
}

// Define the exercise step interface
interface ExerciseStep {
  title: string;
  instruction: string;
  duration: number; // seconds
}

// Define exercise content for each exercise type
const exerciseContent: Record<string, ExerciseStep[]> = {
  // Meditation exercises
  "1": [ // Calm Mind Meditation
    {
      title: "Find a Comfortable Position",
      instruction: "Sit in a comfortable position with your back straight. You can sit on a chair or cushion, or lie down if that's more comfortable.",
      duration: 30,
    },
    {
      title: "Close Your Eyes",
      instruction: "Gently close your eyes and take a few deep breaths. Allow your body to relax with each exhale.",
      duration: 45,
    },
    {
      title: "Focus on Your Breath",
      instruction: "Bring your attention to your breath. Notice the sensation of air flowing in and out of your nostrils, or the rise and fall of your chest or abdomen.",
      duration: 60,
    },
    {
      title: "Observe Your Thoughts",
      instruction: "As thoughts arise, simply notice them without judgment. Imagine them as clouds passing in the sky, and gently return your focus to your breath.",
      duration: 120,
    },
    {
      title: "Body Scan",
      instruction: "Bring awareness to your body. Notice any areas of tension and consciously relax those muscles, starting from your toes and moving up to your head.",
      duration: 90,
    },
    {
      title: "Return to Awareness",
      instruction: "Slowly bring your awareness back to your surroundings. Wiggle your fingers and toes, and when you're ready, gently open your eyes.",
      duration: 45,
    }
  ],
  "4": [ // Joy Visualization
    {
      title: "Preparation",
      instruction: "Find a comfortable seated position. Close your eyes and take a few deep breaths to center yourself.",
      duration: 30,
    },
    {
      title: "Relaxation",
      instruction: "Scan your body for any tension and consciously release it. Let your shoulders drop, relax your jaw, and soften your forehead.",
      duration: 45,
    },
    {
      title: "Recall a Joyful Memory",
      instruction: "Think of a time when you felt truly happy and joyful. It could be a special moment, achievement, or time spent with loved ones.",
      duration: 60,
    },
    {
      title: "Engage Your Senses",
      instruction: "Immerse yourself in this memory. What do you see? What sounds do you hear? Are there any smells or tastes associated with this memory?",
      duration: 90,
    },
    {
      title: "Feel the Joy",
      instruction: "Notice where in your body you feel this joy. Perhaps it's warmth in your chest, lightness in your shoulders, or a smile on your face. Allow this feeling to expand.",
      duration: 120,
    },
    {
      title: "Anchor the Feeling",
      instruction: "Place your hand on your heart. With each breath, imagine drawing this feeling of joy deeper into your being, knowing you can access it anytime.",
      duration: 60,
    },
    {
      title: "Completion",
      instruction: "Slowly bring your awareness back to the present moment. When you're ready, gently open your eyes, carrying this joy with you.",
      duration: 45,
    }
  ],
  "8": [ // Morning Meditation
    {
      title: "Setting Intention",
      instruction: "Find a comfortable seated position. Take a moment to set an intention for your day. What quality would you like to cultivate today?",
      duration: 30,
    },
    {
      title: "Breath Awareness",
      instruction: "Close your eyes and bring your attention to your breath. Notice the natural rhythm of your breathing without trying to change it.",
      duration: 45,
    },
    {
      title: "Energizing Breath",
      instruction: "Take three deep breaths, inhaling through your nose and exhaling through your mouth. Feel energy flowing into your body with each inhale.",
      duration: 30,
    },
    {
      title: "Body Awakening",
      instruction: "Bring awareness to your body, starting from your toes and moving upward. Notice any sensations without judgment.",
      duration: 60,
    },
    {
      title: "Gratitude Practice",
      instruction: "Think of three things you're grateful for today. They can be simple things like the comfort of your bed or the warmth of the sun.",
      duration: 90,
    },
    {
      title: "Visualize Your Day",
      instruction: "Imagine your day unfolding smoothly and positively. See yourself responding to challenges with calm and clarity.",
      duration: 60,
    },
    {
      title: "Return to Awareness",
      instruction: "Bring your attention back to your breath. Take a deep breath in, and as you exhale, open your eyes, ready to begin your day with intention.",
      duration: 45,
    }
  ],
  "12": [ // Loving Kindness Meditation
    {
      title: "Comfortable Position",
      instruction: "Find a comfortable seated position with your back straight but not rigid. Rest your hands on your thighs or in your lap.",
      duration: 30,
    },
    {
      title: "Center Yourself",
      instruction: "Close your eyes and take a few deep breaths. Feel your body becoming more relaxed with each exhale.",
      duration: 45,
    },
    {
      title: "Self-Compassion",
      instruction: "Bring to mind an image of yourself. Silently repeat: 'May I be happy. May I be healthy. May I be safe. May I live with ease.'",
      duration: 90,
    },
    {
      title: "Loved Ones",
      instruction: "Now bring to mind someone you care deeply about. Repeat: 'May you be happy. May you be healthy. May you be safe. May you live with ease.'",
      duration: 90,
    },
    {
      title: "Neutral Person",
      instruction: "Think of someone you neither like nor dislike - perhaps a neighbor or colleague. Extend the same wishes to them.",
      duration: 60,
    },
    {
      title: "Difficult Person",
      instruction: "If you're ready, bring to mind someone with whom you have difficulty. As best you can, offer them the same wishes for well-being.",
      duration: 60,
    },
    {
      title: "All Beings",
      instruction: "Finally, extend your well-wishes to all beings everywhere: 'May all beings be happy. May all beings be healthy. May all beings be safe. May all beings live with ease.'",
      duration: 60,
    },
    {
      title: "Completion",
      instruction: "Rest in the feeling of loving-kindness you've generated. When you're ready, slowly open your eyes.",
      duration: 45,
    }
  ],
  "13": [ // Body Scan Meditation
    {
      title: "Preparation",
      instruction: "Lie down on your back in a comfortable position. You can place a pillow under your head and knees if that helps you relax.",
      duration: 30,
    },
    {
      title: "Initial Relaxation",
      instruction: "Close your eyes and take several deep breaths. With each exhale, feel your body becoming heavier and more relaxed.",
      duration: 45,
    },
    {
      title: "Feet and Legs",
      instruction: "Bring your awareness to your feet. Notice any sensations - warmth, coolness, tingling, or pressure. Then move your attention up to your calves, knees, and thighs.",
      duration: 90,
    },
    {
      title: "Pelvis and Abdomen",
      instruction: "Move your awareness to your pelvis, lower back, and abdomen. Notice the sensation of your breath causing your abdomen to rise and fall.",
      duration: 60,
    },
    {
      title: "Chest and Upper Back",
      instruction: "Bring attention to your chest and upper back. Feel your breath moving in this area. Notice any tension and allow it to soften.",
      duration: 60,
    },
    {
      title: "Hands and Arms",
      instruction: "Now focus on your hands, wrists, forearms, elbows, and upper arms. Notice any sensations without trying to change them.",
      duration: 60,
    },
    {
      title: "Neck and Head",
      instruction: "Bring awareness to your neck, throat, jaw, face, and scalp. Allow any tension in these areas to melt away.",
      duration: 60,
    },
    {
      title: "Whole Body Awareness",
      instruction: "Now expand your awareness to include your entire body as a whole. Feel the sensations of your body breathing, resting, being.",
      duration: 60,
    },
    {
      title: "Completion",
      instruction: "Slowly begin to deepen your breath. Gently wiggle your fingers and toes. When you're ready, open your eyes and stretch if you'd like.",
      duration: 30,
    }
  ],
  "14": [ // Mindful Awareness Meditation
    {
      title: "Posture",
      instruction: "Sit in a comfortable position with your back straight. Rest your hands on your thighs or in your lap.",
      duration: 30,
    },
    {
      title: "Breath Awareness",
      instruction: "Close your eyes and bring your attention to your breath. Notice the natural flow of your breath without trying to control it.",
      duration: 60,
    },
    {
      title: "Anchor to Present",
      instruction: "Each time you notice your mind wandering, gently bring your attention back to your breath. This is the essence of mindfulness practice.",
      duration: 90,
    },
    {
      title: "Expand Awareness",
      instruction: "Now expand your awareness to include sounds around you. Notice sounds near and far, without labeling them as good or bad.",
      duration: 60,
    },
    {
      title: "Body Sensations",
      instruction: "Bring awareness to physical sensations in your body. Notice areas of comfort or discomfort without trying to change anything.",
      duration: 60,
    },
    {
      title: "Thought Observation",
      instruction: "Now notice your thoughts as they arise. Observe them as if you're watching clouds pass in the sky, without getting caught up in their content.",
      duration: 90,
    },
    {
      title: "Open Awareness",
      instruction: "Allow your awareness to be open to whatever is most prominent in your experience - whether breath, sensations, sounds, or thoughts.",
      duration: 60,
    },
    {
      title: "Completion",
      instruction: "Gradually bring your attention back to your breath. Take a few deep breaths and, when you're ready, gently open your eyes.",
      duration: 30,
    }
  ],
  
  // Breathing exercises
  "2": [ // Energizing Breath Work
    {
      title: "Preparation",
      instruction: "Sit comfortably with your back straight. Place your hands on your knees with palms facing upward.",
      duration: 20,
    },
    {
      title: "Belly Breathing",
      instruction: "Place one hand on your belly. Inhale deeply through your nose, feeling your belly expand. Exhale fully through your mouth.",
      duration: 40,
    },
    {
      title: "Energizing Breath",
      instruction: "Inhale quickly through your nose, then exhale forcefully through your mouth making a 'ha' sound. Repeat at a comfortable pace.",
      duration: 60,
    },
    {
      title: "Alternate Nostril Breathing",
      instruction: "Close your right nostril with your thumb, inhale through your left nostril. Close left nostril, exhale through right. Repeat, alternating sides.",
      duration: 90,
    },
    {
      title: "Breath of Fire",
      instruction: "Take rapid, rhythmic breaths through your nose with equal emphasis on inhale and exhale. Keep your mouth closed and relax your shoulders.",
      duration: 30,
    },
    {
      title: "Cooling Down",
      instruction: "Return to normal breathing. Take three deep breaths, feeling the energy circulating throughout your body.",
      duration: 30,
    }
  ],
  "7": [ // Deep Breathing Technique
    {
      title: "Comfortable Position",
      instruction: "Find a comfortable seated position with your back straight but not rigid. Rest your hands on your thighs.",
      duration: 30,
    },
    {
      title: "Initial Awareness",
      instruction: "Close your eyes and take a moment to notice your natural breathing pattern without changing it.",
      duration: 30,
    },
    {
      title: "Diaphragmatic Breathing",
      instruction: "Place one hand on your chest and the other on your abdomen. Breathe deeply through your nose, feeling your abdomen rise more than your chest.",
      duration: 60,
    },
    {
      title: "Extended Exhale",
      instruction: "Inhale for a count of 4, then exhale slowly for a count of 6. Focus on emptying your lungs completely.",
      duration: 90,
    },
    {
      title: "Box Breathing",
      instruction: "Inhale for 4 counts, hold for 4 counts, exhale for 4 counts, and hold for 4 counts. Repeat this pattern.",
      duration: 90,
    },
    {
      title: "Return to Natural Breath",
      instruction: "Let go of the controlled breathing and allow your breath to return to its natural rhythm. Notice how you feel now compared to when you started.",
      duration: 30,
    }
  ],
  "11": [ // Box Breathing
    {
      title: "Preparation",
      instruction: "Sit comfortably with your back straight. Rest your hands on your thighs and relax your shoulders.",
      duration: 30,
    },
    {
      title: "Initial Relaxation",
      instruction: "Close your eyes and take a few normal breaths to settle in. Notice how you feel right now.",
      duration: 30,
    },
    {
      title: "Box Breathing Introduction",
      instruction: "Box breathing has four equal parts: inhale, hold, exhale, hold. We'll practice this pattern together.",
      duration: 30,
    },
    {
      title: "First Round",
      instruction: "Inhale through your nose for 4 counts... Hold for 4 counts... Exhale through your nose for 4 counts... Hold for 4 counts...",
      duration: 60,
    },
    {
      title: "Continue Practice",
      instruction: "Continue the pattern. Inhale - 2 - 3 - 4... Hold - 2 - 3 - 4... Exhale - 2 - 3 - 4... Hold - 2 - 3 - 4...",
      duration: 120,
    },
    {
      title: "Deepen the Practice",
      instruction: "As you continue, focus on the quality of your breath. Make each part smooth and even. Notice the calming effect on your mind and body.",
      duration: 60,
    },
    {
      title: "Completion",
      instruction: "Begin to return to your natural breathing pattern. Notice how you feel now compared to when you started. When ready, gently open your eyes.",
      duration: 30,
    }
  ],
  "15": [ // 4-7-8 Breathing
    {
      title: "Preparation",
      instruction: "Sit comfortably or lie down. Place the tip of your tongue against the ridge behind your upper front teeth.",
      duration: 30,
    },
    {
      title: "Initial Exhale",
      instruction: "Exhale completely through your mouth, making a whoosh sound.",
      duration: 15,
    },
    {
      title: "4-7-8 Cycle: First Round",
      instruction: "Close your mouth and inhale quietly through your nose for 4 counts... Hold your breath for 7 counts... Exhale completely through your mouth for 8 counts, making a whoosh sound.",
      duration: 60,
    },
    {
      title: "Continue Practice",
      instruction: "Let's repeat the cycle. Inhale through nose for 4... Hold for 7... Exhale through mouth for 8...",
      duration: 60,
    },
    {
      title: "Deepen the Practice",
      instruction: "Continue the pattern. Notice how your body feels more relaxed with each cycle. The exhalation is the most important part of this exercise.",
      duration: 120,
    },
    {
      title: "Final Cycles",
      instruction: "Complete a few more cycles. Inhale for 4... Hold for 7... Exhale for 8...",
      duration: 90,
    },
    {
      title: "Completion",
      instruction: "Return to your natural breathing pattern. Notice the sense of calm and relaxation in your body. When ready, gently open your eyes.",
      duration: 30,
    }
  ],
  "16": [ // Alternate Nostril Breathing
    {
      title: "Preparation",
      instruction: "Sit comfortably with your back straight. Rest your left hand on your left knee.",
      duration: 30,
    },
    {
      title: "Hand Position",
      instruction: "Raise your right hand to your nose. Fold your index and middle fingers toward your palm, keeping your thumb, ring finger, and pinky extended.",
      duration: 30,
    },
    {
      title: "Begin the Practice",
      instruction: "Close your right nostril with your thumb. Inhale slowly through your left nostril.",
      duration: 20,
    },
    {
      title: "Switch Nostrils",
      instruction: "Close your left nostril with your ring finger, release your thumb, and exhale through your right nostril.",
      duration: 20,
    },
    {
      title: "Continue the Pattern",
      instruction: "Inhale through your right nostril. Then close the right nostril, open the left, and exhale through the left nostril.",
      duration: 20,
    },
    {
      title: "Establish Rhythm",
      instruction: "Continue this alternating pattern. Inhale left, exhale right, inhale right, exhale left. Keep your breath smooth and even.",
      duration: 120,
    },
    {
      title: "Deepen the Practice",
      instruction: "As you continue, focus on the quality of your breath. Notice how this breathing pattern balances your energy.",
      duration: 90,
    },
    {
      title: "Completion",
      instruction: "Complete the cycle by exhaling through the left nostril. Lower your hand and return to normal breathing. Notice how you feel.",
      duration: 30,
    }
  ],
  "17": [ // Breath of Fire
    {
      title: "Preparation",
      instruction: "Sit comfortably with your spine straight. Place your hands on your knees with palms facing up.",
      duration: 30,
    },
    {
      title: "Understanding the Technique",
      instruction: "Breath of Fire involves rapid, rhythmic breathing with equal emphasis on inhale and exhale. The exhale is active, pulling the navel in toward the spine.",
      duration: 30,
    },
    {
      title: "Practice the Exhale",
      instruction: "Start by practicing the exhale. Sharply pull your navel in toward your spine, causing air to push out through your nose. Then relax your abdomen to allow a passive inhale.",
      duration: 45,
    },
    {
      title: "Begin Slowly",
      instruction: "Begin the breath at a slow pace - about one breath per second. Keep your mouth closed, breathing only through your nose.",
      duration: 60,
    },
    {
      title: "Increase Tempo",
      instruction: "Gradually increase to a medium pace - about two breaths per second. Keep the breath even and rhythmic.",
      duration: 60,
    },
    {
      title: "Full Practice",
      instruction: "Continue at a comfortable pace. Keep your upper body relaxed. If you feel lightheaded, return to normal breathing.",
      duration: 60,
    },
    {
      title: "Cool Down",
      instruction: "Slow down the pace gradually. Return to normal breathing. Take a deep inhale, and exhale completely.",
      duration: 30,
    },
    {
      title: "Completion",
      instruction: "Sit quietly and observe the effects of the practice. Notice the increased energy and alertness in your body and mind.",
      duration: 30,
    }
  ],
  
  // Mindfulness exercises
  "3": [ // Gratitude Practice
    {
      title: "Center Yourself",
      instruction: "Find a comfortable position and take a few deep breaths to center yourself. Allow your body to relax.",
      duration: 30,
    },
    {
      title: "Reflect on Today",
      instruction: "Think about your day so far. What moments, however small, brought you a sense of joy or peace?",
      duration: 60,
    },
    {
      title: "Identify Three Gratitudes",
      instruction: "Identify three specific things you're grateful for today. They can be simple things like a warm cup of coffee or a kind message from a friend.",
      duration: 90,
    },
    {
      title: "Deepen the Experience",
      instruction: "Choose one of these gratitudes and explore it more deeply. Why are you grateful for it? How does it make you feel?",
      duration: 60,
    },
    {
      title: "Body Awareness",
      instruction: "Notice where in your body you feel gratitude. Perhaps it's warmth in your chest or a lightness in your shoulders.",
      duration: 45,
    },
    {
      title: "Extend Gratitude",
      instruction: "If there are people involved in what you're grateful for, mentally send them your appreciation and good wishes.",
      duration: 45,
    },
    {
      title: "Completion",
      instruction: "Take a deep breath and carry this feeling of gratitude with you as you continue your day.",
      duration: 30,
    }
  ],
  "5": [ // Stress Release Body Scan
    {
      title: "Preparation",
      instruction: "Lie down or sit comfortably. Close your eyes and take a few deep breaths to settle in.",
      duration: 30,
    },
    {
      title: "Feet and Legs",
      instruction: "Bring your awareness to your feet. Notice any sensations. Tense your feet for 5 seconds, then release. Feel the difference. Move to your calves and repeat.",
      duration: 60,
    },
    {
      title: "Hips and Abdomen",
      instruction: "Bring attention to your hips and abdomen. Notice any tension. Gently tense these areas for 5 seconds, then release, feeling the tension melt away.",
      duration: 60,
    },
    {
      title: "Chest and Back",
      instruction: "Focus on your chest and back. Take a deep breath, expanding your chest. Hold briefly, then exhale completely, releasing any tension.",
      duration: 60,
    },
    {
      title: "Arms and Hands",
      instruction: "Move your awareness to your arms and hands. Make fists and tense your arms for 5 seconds, then release, noticing the sensation of relaxation.",
      duration: 60,
    },
    {
      title: "Neck and Shoulders",
      instruction: "Bring attention to your neck and shoulders, where many people hold stress. Gently raise your shoulders to your ears, hold, then release completely.",
      duration: 60,
    },
    {
      title: "Face and Head",
      instruction: "Focus on your face. Scrunch all your facial muscles tightly, hold, then release. Feel the tension melting away from your forehead, eyes, jaw, and mouth.",
      duration: 60,
    },
    {
      title: "Full Body Awareness",
      instruction: "Now bring awareness to your entire body. Notice the feeling of relaxation flowing through you. Enjoy this peaceful state for a moment.",
      duration: 30,
    }
  ],
  "9": [ // Body Awareness Scan
    {
      title: "Preparation",
      instruction: "Find a comfortable position, either sitting or lying down. Close your eyes and take a few deep breaths.",
      duration: 30,
    },
    {
      title: "Grounding",
      instruction: "Feel the points of contact between your body and the surface beneath you. Notice the weight of your body being supported.",
      duration: 45,
    },
    {
      title: "Feet and Legs",
      instruction: "Bring your awareness to your feet. Notice any sensations without judgment - warmth, coolness, tingling, pressure. Then move attention up through your legs.",
      duration: 90,
    },
    {
      title: "Torso",
      instruction: "Move your awareness to your hips, abdomen, and chest. Notice the gentle movement of your breath. Feel your heartbeat if you can.",
      duration: 90,
    },
    {
      title: "Arms and Hands",
      instruction: "Bring attention to your shoulders, arms, and hands. Notice any sensations present. There's no need to change anything, just observe.",
      duration: 60,
    },
    {
      title: "Head and Face",
      instruction: "Focus on your neck, head, and face. Notice any tension in your jaw, around your eyes, or in your forehead. Allow these areas to soften.",
      duration: 60,
    },
    {
      title: "Whole Body",
      instruction: "Expand your awareness to include your entire body as a whole. Feel the life energy flowing through you.",
      duration: 60,
    },
    {
      title: "Completion",
      instruction: "Begin to deepen your breath. Gently wiggle your fingers and toes. When you're ready, slowly open your eyes.",
      duration: 30,
    }
  ],
  "18": [ // Mindful Eating Practice
    {
      title: "Preparation",
      instruction: "For this practice, you'll need a small piece of food - perhaps a raisin, a nut, or a small piece of fruit. If you don't have food available, you can just follow along imaginatively.",
      duration: 30,
    },
    {
      title: "Observing",
      instruction: "Hold the food item in your palm or between your fingers. Look at it closely as if you've never seen it before. Notice its colors, textures, and shape.",
      duration: 45,
    },
    {
      title: "Touching",
      instruction: "Close your eyes and explore the food with your sense of touch. Notice its texture, temperature, and weight.",
      duration: 45,
    },
    {
      title: "Smelling",
      instruction: "Bring the food to your nose and smell it. Notice any aromas and how your body responds. Does your mouth water? Do you feel anticipation?",
      duration: 45,
    },
    {
      title: "Placing",
      instruction: "Now place the food on your tongue, but don't chew yet. Notice the sensations of having it in your mouth. Notice the taste and texture.",
      duration: 45,
    },
    {
      title: "Chewing",
      instruction: "Begin to slowly and deliberately chew the food. Notice the flavors that are released and how they might change. Notice the texture changing.",
      duration: 60,
    },
    {
      title: "Swallowing",
      instruction: "When ready, swallow the food. See if you can feel the food moving down into your stomach. Notice how your body feels after eating.",
      duration: 30,
    },
    {
      title: "Reflecting",
      instruction: "Reflect on this experience. How was it different from your usual way of eating? What did you notice that you typically don't?",
      duration: 30,
    }
  ],
  "19": [ // Mindful Walking
    {
      title: "Preparation",
      instruction: "Find a space where you can walk slowly for about 10-15 steps in one direction. Stand at one end, with your feet hip-width apart.",
      duration: 30,
    },
    {
      title: "Grounding",
      instruction: "Feel your feet making contact with the ground. Notice the weight of your body being supported by the earth.",
      duration: 30,
    },
    {
      title: "Begin Walking",
      instruction: "Start walking very slowly, much slower than your normal pace. Pay attention to the sensations in your feet and legs as you walk.",
      duration: 60,
    },
    {
      title: "Heel to Toe",
      instruction: "Notice the heel of your foot touching the ground, then the ball of your foot, then your toes. Feel the shift of weight from one foot to the other.",
      duration: 90,
    },
    {
      title: "Whole Body Awareness",
      instruction: "Expand your awareness to include your entire body as you walk. Notice your posture, the swing of your arms, and the movement of your hips.",
      duration: 90,
    },
    {
      title: "Environmental Awareness",
      instruction: "While maintaining awareness of your body, also notice your surroundings. What do you see, hear, and smell? Can you be aware of both yourself and your environment?",
      duration: 60,
    },
    {
      title: "Turning Around",
      instruction: "When you reach the end of your walking path, pause. Take a breath. Turn around mindfully, and continue walking in the other direction.",
      duration: 30,
    },
    {
      title: "Completion",
      instruction: "Gradually come to a stop. Stand still and notice how your body feels after this practice. Carry this mindful awareness with you as you resume your day.",
      duration: 30,
    }
  ],
  "20": [ // Thought Observation
    {
      title: "Preparation",
      instruction: "Find a comfortable seated position. Close your eyes and take a few deep breaths to settle in.",
      duration: 30,
    },
    {
      title: "Breath Anchor",
      instruction: "Bring your attention to your breath. Notice the sensation of air flowing in and out of your nostrils, or the rise and fall of your chest or abdomen.",
      duration: 45,
    },
    {
      title: "Noticing Thoughts",
      instruction: "Now, shift your awareness to your mind. Notice thoughts as they arise, without trying to change or control them.",
      duration: 60,
    },
    {
      title: "Labeling Thoughts",
      instruction: "As thoughts arise, try gently labeling them: 'planning,' 'remembering,' 'worrying,' 'judging.' Then return to observing.",
      duration: 90,
    },
    {
      title: "Thoughts as Clouds",
      instruction: "Imagine your thoughts as clouds passing through the sky of your mind. You are the observer watching them drift by, not attached to any particular cloud.",
      duration: 90,
    },
    {
      title: "Noticing Patterns",
      instruction: "Begin to notice any patterns in your thinking. Are certain types of thoughts more frequent? Is there an emotional tone to your thoughts?",
      duration: 60,
    },
    {
      title: "Returning to Breath",
      instruction: "Whenever you get caught up in a thought, gently recognize this and return your attention to your breath for a few moments.",
      duration: 45,
    },
    {
      title: "Completion",
      instruction: "Gradually widen your awareness to include your body and surroundings. When you're ready, gently open your eyes.",
      duration: 30,
    }
  ],
  
  // Physical exercises
  "6": [ // Gentle Movement Flow
    {
      title: "Preparation",
      instruction: "Stand with your feet hip-width apart. Take a few deep breaths, feeling your body becoming more alert and present.",
      duration: 20,
    },
    {
      title: "Neck Rolls",
      instruction: "Gently roll your head in a circular motion, first clockwise for 4 rotations, then counterclockwise. Keep your shoulders relaxed.",
      duration: 40,
    },
    {
      title: "Shoulder Circles",
      instruction: "Roll your shoulders forward 5 times, then backward 5 times. Feel any tension releasing with each rotation.",
      duration: 40,
    },
    {
      title: "Side Stretches",
      instruction: "Raise your right arm overhead and gently lean to the left, feeling the stretch along your right side. Hold for 3 breaths, then switch sides.",
      duration: 60,
    },
    {
      title: "Gentle Twists",
      instruction: "Place your hands on your hips and gently twist your upper body to the right, then to the left. Keep your hips facing forward.",
      duration: 60,
    },
    {
      title: "Forward Fold",
      instruction: "Slowly bend forward from your hips, allowing your arms and head to hang down. Bend your knees if needed. Feel the stretch in your back and hamstrings.",
      duration: 60,
    },
    {
      title: "Gentle Backbend",
      instruction: "Place your hands on your lower back and gently arch backward, looking up slightly. Keep the movement small and comfortable.",
      duration: 40,
    },
    {
      title: "Final Integration",
      instruction: "Return to standing. Close your eyes and notice how your body feels now compared to when you started. Take a few deep breaths before opening your eyes.",
      duration: 20,
    }
  ],
  "10": [ // Yoga Flow
    {
      title: "Mountain Pose",
      instruction: "Stand with feet hip-width apart, arms at your sides. Ground through your feet, lengthen your spine, and relax your shoulders.",
      duration: 30,
    },
    {
      title: "Raised Arms Pose",
      instruction: "Inhale and raise your arms overhead, palms facing each other. Gently arch your back if comfortable.",
      duration: 30,
    },
    {
      title: "Forward Fold",
      instruction: "Exhale and fold forward from your hips. Bend your knees if needed. Let your head and arms hang down.",
      duration: 45,
    },
    {
      title: "Half Lift",
      instruction: "Inhale and lift your torso halfway up, extending your spine forward. Place hands on shins if needed.",
      duration: 30,
    },
    {
      title: "Plank Pose",
      instruction: "Step or jump back to plank position. Align your shoulders over your wrists, engage your core.",
      duration: 45,
    },
    {
      title: "Downward Facing Dog",
      instruction: "Push your hips up and back, forming an inverted V shape. Press your heels toward the floor and relax your neck.",
      duration: 60,
    },
    {
      title: "Child's Pose",
      instruction: "Lower your knees to the floor, sit back on your heels, and extend your arms forward. Rest your forehead on the mat.",
      duration: 45,
    },
    {
      title: "Seated Forward Fold",
      instruction: "Sit with legs extended. Inhale to lengthen your spine, then exhale and fold forward from your hips, reaching toward your feet.",
      duration: 45,
    },
    {
      title: "Final Relaxation",
      instruction: "Lie on your back with arms at your sides, palms up. Close your eyes and allow your body to completely relax.",
      duration: 60,
    }
  ],
  "21": [ // Desk Stretches
    {
      title: "Preparation",
      instruction: "Sit comfortably in your chair with your feet flat on the floor. Take a few deep breaths to center yourself.",
      duration: 20,
    },
    {
      title: "Neck Stretch",
      instruction: "Gently tilt your right ear toward your right shoulder. Hold for 3 breaths, then switch sides. Avoid forcing the stretch.",
      duration: 40,
    },
    {
      title: "Shoulder Rolls",
      instruction: "Roll your shoulders forward 5 times, then backward 5 times. Feel the tension releasing with each rotation.",
      duration: 30,
    },
    {
      title: "Wrist and Finger Stretch",
      instruction: "Extend your right arm forward, palm up. Use your left hand to gently pull the fingers back toward you. Hold, then switch hands.",
      duration: 40,
    },
    {
      title: "Seated Spinal Twist",
      instruction: "Sit tall and place your right hand on your left knee. Gently twist to the left, looking over your left shoulder. Hold, then switch sides.",
      duration: 60,
    },
    {
      title: "Seated Forward Bend",
      instruction: "Sit at the edge of your chair. Extend your legs slightly and fold forward from your hips, letting your arms hang down. Feel the stretch in your back.",
      duration: 40,
    },
    {
      title: "Seated Figure Four",
      instruction: "Place your right ankle on your left thigh. Keeping your back straight, gently lean forward to stretch your hip. Hold, then switch sides.",
      duration: 60,
    },
    {
      title: "Chest Opener",
      instruction: "Clasp your hands behind your back. Gently straighten your arms and lift your chest, drawing your shoulders back and down.",
      duration: 30,
    },
    {
      title: "Final Integration",
      instruction: "Sit tall, close your eyes, and take a few deep breaths. Notice how your body feels now compared to when you started.",
      duration: 20,
    }
  ],
  "22": [ // Mood-Boosting Movement
    {
      title: "Preparation",
      instruction: "Stand with feet hip-width apart. Take a few deep breaths, feeling energy flowing into your body.",
      duration: 20,
    },
    {
      title: "Energizing Breath",
      instruction: "Inhale deeply through your nose, raising your arms overhead. Exhale forcefully through your mouth, bringing arms down. Repeat 5 times.",
      duration: 40,
    },
    {
      title: "Joy Jumps",
      instruction: "Do 10 small, gentle jumps or bounces, allowing your arms to swing naturally. Feel the energy moving through your body.",
      duration: 30,
    },
    {
      title: "Sun Salutation",
      instruction: "Reach arms up, fold forward, half lift, step back to plank, lower down, upward dog, downward dog, step forward, half lift, stand and reach up.",
      duration: 60,
    },
    {
      title: "Dancing Freedom",
      instruction: "Put on some upbeat music if possible. Move your body freely, however feels good. Let go of any self-consciousness.",
      duration: 90,
    },
    {
      title: "Power Pose",
      instruction: "Stand tall with feet apart, hands on hips or arms raised in a V shape. Hold this confident posture, breathing deeply.",
      duration: 30,
    },
    {
      title: "Gratitude Movement",
      instruction: "Place hands over your heart. Think of something you're grateful for. Extend arms outward as if sharing this gratitude with the world.",
      duration: 30,
    },
    {
      title: "Completion",
      instruction: "Stand still, eyes closed. Notice the energy flowing through your body and your improved mood. Take three deep breaths before opening your eyes.",
      duration: 30,
    }
  ],
  "23": [ // Tension Release Exercises
    {
      title: "Preparation",
      instruction: "Stand or sit comfortably. Take a few deep breaths, noticing areas of tension in your body.",
      duration: 20,
    },
    {
      title: "Progressive Muscle Relaxation",
      instruction: "We'll tense and release different muscle groups. Start by making tight fists, hold for 5 seconds, then release completely. Notice the difference.",
      duration: 30,
    },
    {
      title: "Arm and Shoulder Release",
      instruction: "Raise your shoulders to your ears, hold for 5 seconds, then release. Next, extend arms forward, tense, hold, and release.",
      duration: 40,
    },
    {
      title: "Facial Tension Release",
      instruction: "Scrunch your face tightly, hold for 5 seconds, then release. Feel the relaxation spreading across your forehead, eyes, and jaw.",
      duration: 30,
    },
    {
      title: "Torso Twist",
      instruction: "Stand with feet hip-width apart. Gently twist your upper body from side to side, allowing your arms to swing freely. Feel your spine releasing tension.",
      duration: 60,
    },
    {
      title: "Rag Doll Pose",
      instruction: "Stand with feet hip-width apart. Bend your knees slightly and fold forward, letting your upper body hang heavy. Gently shake your head 'no' and nod 'yes'.",
      duration: 45,
    },
    {
      title: "Shoulder Rolls and Circles",
      instruction: "Roll your shoulders forward 5 times, then backward 5 times. Then circle each arm individually, releasing tension in the shoulder joints.",
      duration: 45,
    },
    {
      title: "Gentle Neck Stretches",
      instruction: "Slowly tilt your head to each side, then forward and back. Move gently and avoid any painful movements.",
      duration: 40,
    },
    {
      title: "Final Body Scan",
      instruction: "Stand or sit quietly. Scan your body from head to toe, noticing the difference in how you feel now compared to when you started.",
      duration: 30,
    }
  ],
  "24": [ // Energy Flow Sequence
    {
      title: "Preparation",
      instruction: "Stand with feet hip-width apart. Take several deep breaths, imagining energy flowing into your body with each inhale.",
      duration: 30,
    },
    {
      title: "Sun Breath",
      instruction: "Inhale deeply through your nose while raising your arms overhead. Exhale through your mouth while lowering your arms. Repeat 5 times.",
      duration: 45,
    },
    {
      title: "Dynamic Forward Fold",
      instruction: "Fold forward from your hips. On each inhale, lift halfway up with a flat back. On each exhale, fold deeper. Repeat 5 times.",
      duration: 60,
    },
    {
      title: "Energy Taps",
      instruction: "Using your fingertips, gently tap across your body - arms, legs, torso, and face. This stimulates energy flow and circulation.",
      duration: 45,
    },
    {
      title: "Warrior Pose Sequence",
      instruction: "Step your right foot back into Warrior I. Flow to Warrior II, then Extended Side Angle. Return to center and repeat on the left side.",
      duration: 90,
    },
    {
      title: "Breath of Fire",
      instruction: "Sit or stand comfortably. Practice rapid, rhythmic breathing through your nose with equal emphasis on inhale and exhale. Keep your mouth closed.",
      duration: 45,
    },
    {
      title: "Energy Circles",
      instruction: "Stand with feet wide. Circle your hips 5 times in each direction. Then circle your upper body 5 times in each direction.",
      duration: 60,
    },
    {
      title: "Vitality Visualization",
      instruction: "Stand still with eyes closed. Visualize golden light filling your body with each inhale, energizing every cell. Feel this vibrant energy flowing through you.",
      duration: 45,
    },
    {
      title: "Completion",
      instruction: "Rub your palms together vigorously, creating heat. Place your warm palms over your face and heart, transferring this energy. Take three deep breaths.",
      duration: 30,
    }
  ],
  
  // Default steps for any other exercise
  "default": [
    {
      title: "Preparation",
      instruction: "Find a comfortable position. Take a few deep breaths to center yourself and prepare for the exercise.",
      duration: 30,
    },
    {
      title: "Focus",
      instruction: "Bring your attention to your breath. Notice the natural rhythm of your breathing without trying to change it.",
      duration: 45,
    },
    {
      title: "Deepening",
      instruction: "Deepen your experience by focusing on the sensations in your body. Notice any areas of tension and consciously relax those muscles.",
      duration: 60,
    },
    {
      title: "Exploration",
      instruction: "Explore the present moment with curiosity. What thoughts, feelings, or sensations arise? Observe them without judgment.",
      duration: 90,
    },
    {
      title: "Integration",
      instruction: "Begin to integrate this awareness into your whole being. How can you carry this experience with you throughout your day?",
      duration: 60,
    },
    {
      title: "Completion",
      instruction: "Slowly bring your awareness back to your surroundings. When you're ready, gently open your eyes.",
      duration: 30,
    }
  ]
};

export default function ExercisePlayerScreen({ navigation, route }: ExercisePlayerScreenProps) {
  const { exerciseId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [exercise, setExercise] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [exerciseSteps, setExerciseSteps] = useState<ExerciseStep[]>([]);
  const [currentStepTimeRemaining, setCurrentStepTimeRemaining] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadExercise = async () => {
      setIsLoading(true);
      try {
        const exerciseData = getExerciseById(exerciseId);
        if (exerciseData) {
          setExercise(exerciseData);
          
          // Get the specific steps for this exercise or use default
          const steps = exerciseContent[exerciseId] || exerciseContent.default;
          setExerciseSteps(steps);
          
          // Calculate total duration
          const total = steps.reduce((sum, step) => sum + step.duration, 0);
          setTotalDuration(total);
          setTimeRemaining(total);
          
          // Set initial step time remaining
          setCurrentStepTimeRemaining(steps[0].duration);
        }
      } catch (error) {
        console.error('Error loading exercise:', error);
        Alert.alert('Error', 'Failed to load exercise content. Please try again.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    loadExercise();
    
    return () => {
      // Clean up timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [exerciseId]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          
          // Update elapsed time
          setElapsedTime(totalDuration - newTime);
          
          // Calculate overall progress
          setProgress((totalDuration - newTime) / totalDuration);
          
          // Update current step time remaining
          setCurrentStepTimeRemaining(prevStepTime => {
            const newStepTime = Math.max(0, prevStepTime - 1);
            
            // If current step is complete, move to next step
            if (newStepTime === 0 && currentStep < exerciseSteps.length - 1) {
              setCurrentStep(prevStep => {
                const nextStep = prevStep + 1;
                // Set the time remaining for the new step
                setCurrentStepTimeRemaining(exerciseSteps[nextStep].duration);
                return nextStep;
              });
            }
            
            return newStepTime;
          });
          
          // If overall exercise is complete
          if (newTime === 0) {
            setIsPlaying(false);
            clearInterval(timerRef.current!);
            
            // Show completion alert
            setTimeout(() => {
              Alert.alert(
                'Exercise Complete',
                'Great job! You have completed this exercise.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            }, 500);
          }
          
          return newTime;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, currentStep, exerciseSteps, totalDuration]);

  // Handle manual step change
  const handleStepChange = (newStep: number) => {
    if (newStep < 0 || newStep >= exerciseSteps.length) return;
    
    // Calculate time adjustment
    let timeToAdjust = 0;
    
    if (newStep > currentStep) {
      // Moving forward - subtract time for skipped steps
      for (let i = currentStep; i < newStep; i++) {
        timeToAdjust += currentStepTimeRemaining;
        if (i + 1 < exerciseSteps.length) {
          timeToAdjust += exerciseSteps[i + 1].duration;
        }
      }
      setTimeRemaining(prev => Math.max(0, prev - timeToAdjust));
    } else {
      // Moving backward - add time for previous steps
      for (let i = currentStep - 1; i >= newStep; i--) {
        timeToAdjust += exerciseSteps[i].duration;
      }
      setTimeRemaining(prev => Math.min(totalDuration, prev + timeToAdjust));
    }
    
    // Update current step
    setCurrentStep(newStep);
    setCurrentStepTimeRemaining(exerciseSteps[newStep].duration);
    
    // Update elapsed time and progress
    const newElapsedTime = totalDuration - (timeRemaining + timeToAdjust);
    setElapsedTime(newElapsedTime);
    setProgress(newElapsedTime / totalDuration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleClose = () => {
    if (isPlaying) {
      Alert.alert(
        'Exit Exercise',
        'Are you sure you want to exit? Your progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meditation':
        return 'flower-outline';
      case 'breathing':
        return 'water-outline';
      case 'mindfulness':
        return 'leaf-outline';
      case 'physical':
        return 'body-outline';
      default:
        return 'flower-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meditation':
        return theme.colors.primary;
      case 'breathing':
        return '#4FC3F7';
      case 'mindfulness':
        return '#66BB6A';
      case 'physical':
        return '#FF7043';
      default:
        return theme.colors.primary;
    }
  };

  if (isLoading || !exercise) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading exercise...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleClose}
        >
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{exercise.title}</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.exerciseInfoCard}>
          <View style={styles.exerciseInfoHeader}>
            <View style={[styles.exerciseIconContainer, { backgroundColor: getTypeColor(exercise.type) }]}>
              <Ionicons name={getTypeIcon(exercise.type)} size={28} color="#fff" />
            </View>
            <View style={styles.exerciseInfoContent}>
              <Text style={styles.exerciseTitle}>{exercise.title}</Text>
              <Text style={styles.exerciseType}>
                {exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1)} • {exercise.duration}
              </Text>
            </View>
          </View>
          <Text style={styles.exerciseDescription}>{exercise.description}</Text>
        </View>
        
        <View style={styles.instructionCard}>
          <View style={styles.stepProgress}>
            <Text style={styles.stepCounter}>
              Step {currentStep + 1} of {exerciseSteps.length}
            </Text>
            <Text style={styles.stepTimer}>
              {formatTime(currentStepTimeRemaining)}
            </Text>
          </View>
          <Text style={styles.stepTitle}>{exerciseSteps[currentStep].title}</Text>
          <Text style={styles.instruction}>{exerciseSteps[currentStep].instruction}</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress * 100}%`, backgroundColor: getTypeColor(exercise.type) }
              ]} 
            />
          </View>
          <View style={styles.timeDisplay}>
            <Text style={styles.timeElapsed}>{formatTime(elapsedTime)}</Text>
            <Text style={styles.timeRemaining}>{formatTime(timeRemaining)}</Text>
          </View>
        </View>
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={() => handleStepChange(currentStep - 1)}
            disabled={currentStep === 0}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={currentStep === 0 ? theme.colors.subtext : theme.colors.text} 
            />
            <Text 
              style={[
                styles.controlButtonText, 
                currentStep === 0 && { color: theme.colors.subtext }
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.primaryButton, { backgroundColor: getTypeColor(exercise.type) }]}
            onPress={handlePlayPause}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={24} 
              color="#fff" 
            />
            <Text style={[styles.controlButtonText, { color: "#fff" }]}>
              {isPlaying ? "Pause" : "Play"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={() => handleStepChange(currentStep + 1)}
            disabled={currentStep === exerciseSteps.length - 1}
          >
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={currentStep === exerciseSteps.length - 1 ? theme.colors.subtext : theme.colors.text} 
            />
            <Text 
              style={[
                styles.controlButtonText, 
                currentStep === exerciseSteps.length - 1 && { color: theme.colors.subtext }
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Exercise Steps</Text>
          {exerciseSteps.map((step, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.stepItem,
                currentStep === index && styles.activeStepItem
              ]}
              onPress={() => handleStepChange(index)}
            >
              <View style={[
                styles.stepNumberContainer,
                currentStep === index && { backgroundColor: getTypeColor(exercise.type) + '40' }
              ]}>
                <Text style={[
                  styles.stepNumber,
                  currentStep === index && { color: getTypeColor(exercise.type) }
                ]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[
                  styles.stepItemTitle,
                  currentStep === index && { color: getTypeColor(exercise.type), fontWeight: theme.fontWeights.bold }
                ]}>
                  {step.title}
                </Text>
                <Text style={styles.stepDuration}>{formatTime(step.duration)}</Text>
              </View>
              {currentStep === index && (
                <Ionicons name="play-circle" size={20} color={getTypeColor(exercise.type)} />
              )}
              {index < currentStep && (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.subtext,
  },
  exerciseInfoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.medium,
  },
  exerciseInfoHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  exerciseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  exerciseInfoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  exerciseType: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  exerciseDescription: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 22,
  },
  instructionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.medium,
  },
  stepProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepCounter: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  stepTimer: {
    fontSize: 14,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 18,
    color: theme.colors.text,
    lineHeight: 26,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeElapsed: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  timeRemaining: {
    fontSize: 14,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  primaryButton: {
    ...theme.shadows.small,
  },
  secondaryButton: {
    backgroundColor: theme.colors.card,
    ...theme.shadows.small,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginLeft: 4,
  },
  stepsContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.medium,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activeStepItem: {
    backgroundColor: theme.colors.background + '80',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  stepContent: {
    flex: 1,
  },
  stepItemTitle: {
    fontSize: 16,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  stepDuration: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
});