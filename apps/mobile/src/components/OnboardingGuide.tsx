import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useOnboardingStore } from '../stores/onboardingStore';

interface OnboardingGuideProps {
  visible: boolean;
  onDismiss: () => void;
}

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to PixelBead Studio!',
    description:
      'Your pixel art design tool is ready. Create beautiful pixel art designs with ease.',
    icon: 'palette',
  },
  {
    title: 'Canvas Basics',
    description: 'Tap to place pixels, pinch to zoom, and drag to pan around your canvas.',
    icon: 'grid-on',
  },
  {
    title: 'Drawing Tools',
    description:
      'Use the tool drawer to switch between brush, eraser, fill, and shape tools.',
    icon: 'brush',
  },
  {
    title: 'Colors',
    description:
      'Select colors from the palette or use the HSL picker for precise color selection.',
    icon: 'color-lens',
  },
  {
    title: 'Save & Export',
    description:
      'Save your projects and export as PNG images for sharing and printing.',
    icon: 'save',
  },
];

/**
 * Onboarding guide component
 * Multi-step guide shown on first app launch with persistent dismissal
 */
export function OnboardingGuide({ visible, onDismiss }: OnboardingGuideProps) {
  const { completeOnboarding, nextStep, previousStep } = useOnboardingStore();
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;

  // Animate slide on step change
  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: currentStep * -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep, width, slideAnim]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      nextStep();
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      previousStep();
    }
  };

  const handleComplete = () => {
    completeOnboarding();
    onDismiss();
  };

  const handleSkip = () => {
    completeOnboarding();
    onDismiss();
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, isLandscape && styles.containerLandscape]}>
        {/* Step indicators */}
        <View style={styles.dotsContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
                index < currentStep && styles.dotCompleted,
              ]}
              accessible={true}
              accessibilityLabel={`Onboarding step ${index + 1}`}
            />
          ))}
        </View>

        {/* Content area */}
        <View style={styles.contentArea}>
          <Animated.View
            style={[
              styles.slidesContainer,
              { width: ONBOARDING_STEPS.length * width },
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            {ONBOARDING_STEPS.map((item, index) => (
              <View key={index} style={[styles.slide, { width }]}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name={item.icon as any} size={80} color="#2196F3" />
                </View>
                <Text style={styles.slideTitle}>{item.title}</Text>
                <Text style={styles.slideDescription}>{item.description}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Navigation buttons */}
        <View style={styles.actions}>
          {/* Skip button (always visible) */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            accessible={true}
            accessibilityLabel="Skip onboarding"
            accessibilityRole="button"
            accessibilityHint="Skip this guide and go directly to app"
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          {/* Previous button (only on steps 1-4) */}
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonSecondary]}
              onPress={handlePrevious}
              accessible={true}
              accessibilityLabel="Previous step"
              accessibilityRole="button"
              accessibilityHint="Go to previous onboarding step"
            >
              <Text style={styles.navButtonTextSecondary}>Previous</Text>
            </TouchableOpacity>
          )}

          {/* Next/Get Started button */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNext}
            accessible={true}
            accessibilityLabel={currentStep === ONBOARDING_STEPS.length - 1 ? 'Get started' : 'Next'}
            accessibilityRole="button"
            accessibilityHint={currentStep === ONBOARDING_STEPS.length - 1 ? 'Finish onboarding' : 'Go to next step'}
          >
            <Text style={styles.navButtonText}>
              {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    width: '90%',
    maxWidth: 600,
    height: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
  },
  containerLandscape: {
    width: '60%',
    flexDirection: 'row',
    padding: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 6,
  },
  dotActive: {
    backgroundColor: '#2196F3',
    width: 24,
  },
  dotCompleted: {
    backgroundColor: '#2196F3',
  },
  contentArea: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  slidesContainer: {
    flexDirection: 'row',
    height: '100%',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDescription: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonSecondary: {
    backgroundColor: '#F5F5F5',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navButtonTextSecondary: {
    color: '#757575',
  },
});
