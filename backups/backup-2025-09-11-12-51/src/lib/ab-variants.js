// A/B Test Variants Configuration

export const metaDescriptionVariants = {
  // Test 1: Question vs Statement format
  questionVsStatement: {
    name: 'meta_description_format',
    variants: [
      {
        name: 'question',
        generate: (title, description, category) => {
          if (category === 'conversions') {
            return `How to convert ${title.toLowerCase()}? ${description}`;
          }
          return `How to ${title.toLowerCase()}? ${description}`;
        }
      },
      {
        name: 'statement',
        generate: (title, description, category) => {
          return description; // Use original description
        }
      }
    ]
  },

  // Test 2: Benefit-focused vs Feature-focused
  benefitVsFeature: {
    name: 'meta_description_focus',
    variants: [
      {
        name: 'benefit',
        generate: (title, description, category) => {
          const benefits = [
            'Get instant results',
            'Save time and effort',
            'Perfect every time',
            'Easy and accurate',
            'Quick and reliable'
          ];
          const benefit = benefits[Math.floor(Math.random() * benefits.length)];
          return `${benefit} with ${title.toLowerCase()}. ${description}`;
        }
      },
      {
        name: 'feature',
        generate: (title, description, category) => {
          return `Professional ${category} tool: ${description}`;
        }
      }
    ]
  },

  // Test 3: Length optimization
  lengthOptimization: {
    name: 'meta_description_length',
    variants: [
      {
        name: 'short',
        generate: (title, description, category) => {
          return description.substring(0, 120) + '...';
        }
      },
      {
        name: 'medium',
        generate: (title, description, category) => {
          return description.substring(0, 140) + '...';
        }
      },
      {
        name: 'long',
        generate: (title, description, category) => {
          return description; // Full description
        }
      }
    ]
  }
};

export const headlineVariants = {
  // Test 1: Question vs Statement headlines
  questionVsStatement: {
    name: 'headline_format',
    variants: [
      {
        name: 'question',
        generate: (originalTitle) => {
          if (originalTitle.includes('to')) {
            return `How to ${originalTitle.toLowerCase()}?`;
          }
          return `What is ${originalTitle.toLowerCase()}?`;
        }
      },
      {
        name: 'statement',
        generate: (originalTitle) => {
          return originalTitle; // Keep original
        }
      }
    ]
  },

  // Test 2: Emotional vs Rational
  emotionalVsRational: {
    name: 'headline_emotion',
    variants: [
      {
        name: 'emotional',
        generate: (originalTitle) => {
          const emotionalWords = ['Amazing', 'Incredible', 'Perfect', 'Ultimate', 'Essential'];
          const word = emotionalWords[Math.floor(Math.random() * emotionalWords.length)];
          return `${word} ${originalTitle}`;
        }
      },
      {
        name: 'rational',
        generate: (originalTitle) => {
          return `Complete Guide: ${originalTitle}`;
        }
      }
    ]
  }
};

export const ctaVariants = {
  // Test 1: Button text variations
  buttonText: {
    name: 'cta_button_text',
    variants: [
      {
        name: 'action',
        text: 'Get Started Now',
        style: 'background: var(--color-primary); color: white;'
      },
      {
        name: 'benefit',
        text: 'Save Time Today',
        style: 'background: var(--color-primary); color: white;'
      },
      {
        name: 'urgency',
        text: 'Try It Free',
        style: 'background: var(--color-primary); color: white;'
      }
    ]
  },

  // Test 2: Button placement
  buttonPlacement: {
    name: 'cta_button_placement',
    variants: [
      {
        name: 'top',
        position: 'top'
      },
      {
        name: 'bottom',
        position: 'bottom'
      },
      {
        name: 'both',
        position: 'both'
      }
    ]
  }
};

export const layoutVariants = {
  // Test 1: Image placement
  imagePlacement: {
    name: 'image_placement',
    variants: [
      {
        name: 'left',
        layout: 'image-left'
      },
      {
        name: 'right',
        layout: 'image-right'
      },
      {
        name: 'top',
        layout: 'image-top'
      }
    ]
  },

  // Test 2: Content density
  contentDensity: {
    name: 'content_density',
    variants: [
      {
        name: 'sparse',
        spacing: 'large'
      },
      {
        name: 'dense',
        spacing: 'compact'
      }
    ]
  }
};
