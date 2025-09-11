// A/B Testing Framework
export class ABTesting {
  constructor() {
    this.tests = new Map();
    this.results = new Map();
    this.userId = this.getOrCreateUserId();
    this.init();
  }

  // Get or create a unique user ID for consistent testing
  getOrCreateUserId() {
    let userId = localStorage.getItem('ab_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('ab_user_id', userId);
    }
    return userId;
  }

  // Initialize A/B testing
  init() {
    // Track page load for all tests
    this.trackEvent('page_load', {
      user_id: this.userId,
      page_url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }

  // Register a new A/B test
  registerTest(testName, variants, options = {}) {
    const test = {
      name: testName,
      variants: variants,
      trafficSplit: options.trafficSplit || 0.5, // 50/50 split by default
      duration: options.duration || 30, // 30 days default
      startDate: options.startDate || new Date(),
      endDate: new Date(Date.now() + (options.duration || 30) * 24 * 60 * 60 * 1000),
      active: true
    };

    this.tests.set(testName, test);
    return this.getVariant(testName);
  }

  // Get variant for a user (consistent across sessions)
  getVariant(testName) {
    const test = this.tests.get(testName);
    if (!test || !test.active) return null;

    // Check if test has expired
    if (new Date() > test.endDate) {
      test.active = false;
      return null;
    }

    // Generate consistent variant based on user ID and test name
    const hash = this.hashString(this.userId + testName);
    const variantIndex = Math.abs(hash) % test.variants.length;
    const variant = test.variants[variantIndex];

    // Track variant assignment
    this.trackEvent('ab_test_assignment', {
      test_name: testName,
      variant: variant.name,
      user_id: this.userId,
      timestamp: new Date().toISOString()
    });

    return variant;
  }

  // Track A/B test events
  trackEvent(eventName, data) {
    // Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        ...data,
        custom_parameter_1: 'ab_testing',
        custom_parameter_2: eventName
      });
    }

    // Store locally for debugging
    const events = JSON.parse(localStorage.getItem('ab_events') || '[]');
    events.push({ event: eventName, data, timestamp: new Date().toISOString() });
    localStorage.setItem('ab_events', JSON.stringify(events.slice(-100))); // Keep last 100 events
  }

  // Track conversion for a specific test
  trackConversion(testName, conversionType, value = 1) {
    const test = this.tests.get(testName);
    if (!test) return;

    const variant = this.getVariant(testName);
    if (!variant) return;

    this.trackEvent('ab_test_conversion', {
      test_name: testName,
      variant: variant.name,
      conversion_type: conversionType,
      conversion_value: value,
      user_id: this.userId,
      timestamp: new Date().toISOString()
    });
  }

  // Simple hash function for consistent variant assignment
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  // Get test results (for debugging)
  getResults() {
    return {
      userId: this.userId,
      tests: Array.from(this.tests.entries()),
      events: JSON.parse(localStorage.getItem('ab_events') || '[]')
    };
  }
}

// Global instance
export const abTesting = new ABTesting();
