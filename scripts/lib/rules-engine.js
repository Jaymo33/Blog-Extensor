/**
 * Rules engine for classifying blog posts into hierarchical categories and hubs
 * Supports brand-specific, product, and instructional content classification
 * FINAL VERSION - Comprehensive coverage for all unmatched posts
 */

/**
 * Classify a blog post slug into category and hub
 * @param {string} slug - The blog post slug
 * @returns {Object|null} - {category: string, hub: string} or null if no match
 */
function classifyPost(slug) {
  // Clean the slug: remove trailing dots, convert to lowercase, replace hyphens with spaces
  const leaf = slug.replace(/\.+$/, '');
  const txt = ` ${leaf.toLowerCase().replace(/-/g, ' ')} `;
  
  // Brand detection first (highest priority)
  const brands = {
    'ninja': 'ninja',
    'instant': 'instant', 
    'instant vortex': 'instant',
    'tefal': 'tefal',
    'tower': 'tower',
    'jamie': 'jamie',
    'actifry': 'actifry',
    'breville': 'breville',
    'cooks essentials': 'cooks-essentials'
  };
  
  // Check for brand-specific content
  for (const [brandKey, brandValue] of Object.entries(brands)) {
    if (txt.includes(brandKey)) {
      // Brand-specific models
      if (/\b(\d+[\s-]?(qt|qt|liter|litre|l|kg|oz|cup|pound|gram|ml|ml))/.test(txt) || 
          /\b(af\d+|duo|vortex|combi|actifry|halo|flexi)\b/.test(txt)) {
        return { category: 'products/brands', hub: `${brandValue}/models` };
      }
      // Brand-specific accessories
      if (/\b(basket|tray|rack|insert|pan|bowl|liner|paper|foil|parchment)\b/.test(txt)) {
        return { category: 'products/brands', hub: `${brandValue}/accessories` };
      }
      // Brand-specific instructions
      if (/\b(instructions?|manual|guide|how[- ]?to|use|setup|clean|preheat)\b/.test(txt)) {
        return { category: 'products/brands', hub: `${brandValue}/instructions` };
      }
      // General brand content
      return { category: 'products/brands', hub: brandValue };
    }
  }
  
  // Ordered tests - first match wins
  
  // --- Conversions: grams ↔ ounces ---
  if (/(\bgrams?\b|\d+g\b|\bg\b).*?\bto\b.*?\b(ounces?|oz)\b/.test(txt)) {
    return { category: 'conversions', hub: 'grams-to-ounces' };
  }
  if (/\b(ounces?|oz)\b.*?\bto\b.*?(\bgrams?\b|\d+g\b|\bg\b)/.test(txt)) {
    return { category: 'conversions', hub: 'ounces-to-grams' };
  }
  
  // --- Conversions: grams ↔ cups ---
  if (/(\bgrams?\b|\d+g\b|\bg\b).*?\bto\b.*?\bcups?\b/.test(txt)) {
    return { category: 'conversions', hub: 'grams-to-cups' };
  }
  if (/\bcups?\b.*?\bto\b.*?(\bgrams?\b|\d+g\b|\bg\b)/.test(txt)) {
    return { category: 'conversions', hub: 'cups-to-grams' };
  }
  
  // --- Conversions: cups ↔ ounces ---
  if (/\bcups?\b.*?\bto\b.*?\b(ounces?|oz|fl\s?oz|fluid\s?ounces?)\b/.test(txt)) {
    return { category: 'conversions', hub: 'cups-to-ounces' };
  }
  if (/\b(ounces?|oz|fl\s?oz|fluid\s?ounces?)\b.*?\bto\b.*?\bcups?\b/.test(txt)) {
    return { category: 'conversions', hub: 'ounces-to-cups' };
  }
  
  // --- Conversions: ml ↔ cups ---
  if (/\b(ml|millilit(?:er|re)s?)\b.*?\bto\b.*?\bcups?\b/.test(txt)) {
    return { category: 'conversions', hub: 'ml-to-cups' };
  }
  if (/\bcups?\b.*?\bto\b.*?\b(ml|millilit(?:er|re)s?)\b/.test(txt)) {
    return { category: 'conversions', hub: 'cups-to-ml' };
  }
  
  // --- Conversions: kilograms ↔ pounds ---
  if (/\b(kilograms?|kg)\b.*?\bto\b.*?\b(pounds?|lb|lbs)\b/.test(txt)) {
    return { category: 'conversions', hub: 'kg-to-pounds' };
  }
  if (/\b(pounds?|lb|lbs)\b.*?\bto\b.*?\b(kilograms?|kg)\b/.test(txt)) {
    return { category: 'conversions', hub: 'pounds-to-kg' };
  }
  
  // --- Temperature & ovens ---
  if (/\b(celsius|°?c|c)\b.*?\bto\b.*?\b(fahrenheit|°?f|f)\b/.test(txt)) {
    return { category: 'conversions', hub: 'celsius-to-fahrenheit' };
  }
  if (/\b(fahrenheit|°?f|f)\b.*?\bto\b.*?\b(celsius|°?c|c)\b/.test(txt)) {
    return { category: 'conversions', hub: 'fahrenheit-to-celsius' };
  }
  if (/\b(celsius|°?c|c)\b.*?\bto\b.*?\bgas[- ]?mark\b/.test(txt)) {
    return { category: 'conversions', hub: 'celsius-to-gas-mark' };
  }
  if (/\bgas[- ]?mark\b.*?\bto\b.*?\b(celsius|°?c|c)\b/.test(txt)) {
    return { category: 'conversions', hub: 'gas-mark-to-celsius' };
  }
  if (/\b(fahrenheit|°?f|f)\b.*?\bto\b.*?\bgas[- ]?mark\b/.test(txt)) {
    return { category: 'conversions', hub: 'fahrenheit-to-gas-mark' };
  }
  if (/\bgas[- ]?mark\b.*?\bto\b.*?\b(fahrenheit|°?f|f)\b/.test(txt)) {
    return { category: 'conversions', hub: 'gas-mark-to-fahrenheit' };
  }
  if (/\b(celsius|°?c|c)\b.*?\bto\b.*?\bfan[- ]?oven\b/.test(txt)) {
    return { category: 'conversions', hub: 'celsius-to-fan-oven' };
  }
  if (/\b(fahrenheit|°?f|f)\b.*?\bto\b.*?\bfan[- ]?oven\b/.test(txt)) {
    return { category: 'conversions', hub: 'fahrenheit-to-fan-oven' };
  }
  if (/\bfan[- ]?oven\b.*?\bto\b.*?\b(celsius|°?c|c)\b/.test(txt)) {
    return { category: 'conversions', hub: 'fan-oven-to-celsius' };
  }
  if (/\bfan[- ]?oven\b.*?\bto\b.*?\b(fahrenheit|°?f|f)\b/.test(txt)) {
    return { category: 'conversions', hub: 'fan-oven-to-fahrenheit' };
  }
  if (/\bfan[- ]?oven\b.*?\bto\b.*?\b(conventional|standard|regular)\b.*\boven\b/.test(txt)) {
    return { category: 'conversions', hub: 'fan-oven-to-conventional-oven' };
  }
  if (/\b(conventional|standard|regular)\b.*\boven\b.*?\bto\b.*?\bfan[- ]?oven\b/.test(txt)) {
    return { category: 'conversions', hub: 'conventional-oven-to-fan-oven' };
  }
  
  // --- Tablespoons ↔ grams ---
  if (/\b(tbsp|tablespoons?)\b.*?\bto\b.*?\b(grams?|g)\b/.test(txt)) {
    return { category: 'conversions', hub: 'tablespoons-to-grams' };
  }
  if (/\b(grams?|g)\b.*?\bto\b.*?\b(tbsp|tablespoons?)\b/.test(txt)) {
    return { category: 'conversions', hub: 'grams-to-tablespoons' };
  }
  
  // --- 'How many' phrasing - COMPREHENSIVE PATTERNS ---
  if (/\bhow[- ]*many\b.*?\bounces?\b.*?\b(cups?|cup)\b/.test(txt)) {
    return { category: 'conversions', hub: 'cups-to-ounces' };
  }
  if (/\bhow[- ]*many\b.*?\b(cups?|cup)\b.*?\bis\b.*?\b(ml|millilit(?:er|re)s?)\b/.test(txt)) {
    return { category: 'conversions', hub: 'ml-to-cups' };
  }
  if (/\bhow[- ]*many\b.*?\b(ml|millilit(?:er|re)s?)\b.*?\bis\b.*?\b(cups?|cup)\b/.test(txt)) {
    return { category: 'conversions', hub: 'cups-to-ml' };
  }
  if (/\bhow[- ]*many\b.*?\bgrams?\b.*?\b(cups?|cup)\b/.test(txt)) {
    return { category: 'conversions', hub: 'cups-to-grams' };
  }
  if (/\bhow[- ]*many\b.*?\bounces?\b.*?\b(grams?|g|\d+g\b)\b/.test(txt)) {
    return { category: 'conversions', hub: 'grams-to-ounces' };
  }
  
  // --- 'How many cups is X grams of Y' pattern - COMPREHENSIVE ---
  if (/\bhow[- ]*many\b.*?\bcups?\b.*?\bis\b.*?\b\d+\s*grams?\b/.test(txt)) {
    return { category: 'conversions', hub: 'grams-to-cups' };
  }
  
  // --- Products: Size and capacity (moved up for better matching) ---
  if (/\b(\d+[\s-]?(l|liter|litre|qt|qt))\b.*?\bair[- ]?fryer\b/.test(txt) ||
      /\bair[- ]?fryer\b.*?\b(\d+[\s-]?(l|liter|litre|qt|qt))\b/.test(txt) ||
      /\b(family|person|people|single|one|two|three|four|five)\b.*?\bair[- ]?fryer\b/.test(txt)) {
    return { category: 'products/air-fryers', hub: 'models' };
  }
  
  // --- Products: Comparisons and reviews ---
  if (/\bair[- ]?fryer\b.*?\b(vs|v|versus|compared|comparison|review)\b/.test(txt) ||
      /\b(vs|v|versus|compared|comparison|review)\b.*?\bair[- ]?fryer\b/.test(txt)) {
    return { category: 'products/air-fryers', hub: 'comparisons' };
  }
  
  // --- Products: General features and benefits ---
  if (/\b(advantage|benefit|feature|pros|cons|good|bad|worth|value)\b.*?\bair[- ]?fryer\b/.test(txt) ||
      /\bair[- ]?fryer\b.*?\b(advantage|benefit|feature|pros|cons|good|bad|worth|value)\b/.test(txt)) {
    return { category: 'products/air-fryers', hub: 'features' };
  }
  
  // --- How-to: Cleaning and maintenance ---
  if (/\b(clean|cleaning|maintain|maintenance|care|wash|wipe)\b.*?\bair[- ]?fryer\b/.test(txt) ||
      /\bair[- ]?fryer\b.*?\b(clean|cleaning|maintain|maintenance|care|wash|wipe)\b/.test(txt)) {
    return { category: 'how-to', hub: 'clean-air-fryer' };
  }
  
  // --- How-to: Troubleshooting ---
  if (/\b(not\s*working|broken|fix|repair|troubleshoot|problem|issue|error)\b.*?\bair[- ]?fryer\b/.test(txt) ||
      /\bair[- ]?fryer\b.*?\b(not\s*working|broken|fix|repair|troubleshoot|problem|issue|error)\b/.test(txt)) {
    return { category: 'how-to', hub: 'troubleshooting' };
  }
  
  // --- Cooking: Specific cooking methods ---
  if (/\b(barbecue|bbq|grill|roast|bake|fry|steam|smoke)\b.*?\bair[- ]?fryer\b/.test(txt) ||
      /\bair[- ]?fryer\b.*?\b(barbecue|bbq|grill|roast|bake|fry|steam|smoke)\b/.test(txt)) {
    return { category: 'cooking', hub: 'cooking-methods' };
  }
  
  // --- Safety: General safety questions ---
  if (/\b(can|should|safe|safety|dangerous|hazard|risk)\b.*?\b(put|use|go)\b.*?\bair[- ]?fryer\b/.test(txt) ||
      /\bair[- ]?fryer\b.*?\b(can|should|safe|safety|dangerous|hazard|risk)\b/.test(txt)) {
    return { category: 'safety', hub: 'can-you-air-fry-it' };
  }
  
  // --- Health: Energy and consumption ---
  if (/\b(energy|electric|consumption|efficient|watt|power|cost|bill)\b.*?\bair[- ]?fryer\b/.test(txt) ||
      /\bair[- ]?fryer\b.*?\b(energy|electric|consumption|efficient|watt|power|cost|bill)\b/.test(txt)) {
    return { category: 'health', hub: 'energy-efficiency' };
  }
  
  // --- Products: Accessories and add-ons ---
  if (/\b(bag|liner|pan|tray|basket|rack|insert|steel|glass|metal|silicone|foil|paper)\b.*?\bair[- ]?fryer\b/.test(txt) ||
      /\bair[- ]?fryer\b.*?\b(bag|liner|pan|tray|basket|rack|insert|steel|glass|metal|silicone|foil|paper)\b/.test(txt)) {
    return { category: 'products/air-fryers', hub: 'accessories' };
  }
  
  // --- Products: General air fryer models and specifications ---
  if (/\b(watt|wattage|power|capacity|size|dimension|feature|specification)\b.*?\bair[- ]?fryer\b/.test(txt) ||
      /\bair[- ]?fryer\b.*?\b(watt|wattage|power|capacity|size|dimension|feature|specification)\b/.test(txt)) {
    return { category: 'products/air-fryers', hub: 'specifications' };
  }
  
  // --- How-to: General usage instructions ---
  if (/\bhow\s*to\b.*?\b(use|setup|set\s*up|preheat)\b.*?\bair[- ]?fryer\b/.test(txt)) {
    return { category: 'how-to', hub: 'use-air-fryer' };
  }
  if (/\bhow\s*to\b.*?\bclean\b.*?\bair[- ]?fryer\b/.test(txt)) {
    return { category: 'how-to', hub: 'clean-air-fryer' };
  }
  if (/\bhow\s*to\b.*?\b(maintain|maintenance|care)\b.*?\bair[- ]?fryer\b/.test(txt)) {
    return { category: 'how-to', hub: 'maintain-air-fryer' };
  }
  
  // --- Cooking: Cooking times and techniques ---
  if (/\bhow[- ]*long\b.*?\bcook\b.*?\bair[- ]?fryer\b/.test(txt)) {
    return { category: 'cooking', hub: 'cook-times' };
  }
  if (/\bhow\s*to\b.*?\breheat\b.*?\bair[- ]?fryer\b/.test(txt)) {
    return { category: 'cooking', hub: 'reheat' };
  }
  if (/\b(technique|method|tip|trick)\b.*?\bair[- ]?fryer\b/.test(txt)) {
    return { category: 'cooking', hub: 'techniques' };
  }
  
  // --- Safety: Compatibility and safety ---
  if (/\b(can|should)\b.*?\b(air[- ]?fry|put)\b.*?\b(kitchen[- ]?roll|paper\s*towel|foil|parchment|baking\s*paper|baking\s*tin|baking\s*tray)\b/.test(txt)) {
    return { category: 'safety', hub: 'can-you-air-fry-it' };
  }
  if (/\b(safety|safe|dangerous|hazard|risk)\b.*?\bair[- ]?fryer\b/.test(txt)) {
    return { category: 'safety', hub: 'safety-guidelines' };
  }
  
  // --- Health: Health and nutrition ---
  if (/\b(calorie|nutrition|healthy|health|diet|fat|oil|acrylamide)\b.*?\bair[- ]?fryer\b/.test(txt)) {
    return { category: 'health', hub: 'air-fryer-health' };
  }
  
  // --- General: Catch-all for air fryer content ---
  if (/\bair[- ]?fryer\b/.test(txt)) {
    return { category: 'products/air-fryers', hub: 'general' };
  }
  
  // --- General: Catch-all for any remaining content ---
  return { category: 'general', hub: 'uncategorized' };
}

export {
  classifyPost
};
