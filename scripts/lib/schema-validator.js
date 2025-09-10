/**
 * JSON-LD Schema Validator and Auto-Fixer Library
 * Can be used during migration or as standalone validation
 */

/**
 * Fix common JSON-LD syntax issues while preserving structure
 */
export function fixJsonLdSyntax(content) {
  let fixed = content;
  let hasChanges = false;
  
  // Fix malformed script tags (like the Google Search Console errors)
  const malformedScriptRegex = /<script\s+type="application\/ld\+json">\s*"<script\s+type=\\"application\/ld\+json\\">/g;
  if (malformedScriptRegex.test(fixed)) {
    fixed = fixed.replace(malformedScriptRegex, '<script type="application/ld+json">');
    hasChanges = true;
  }
  
  // Fix escaped JSON within script tags
  const escapedJsonRegex = /<script\s+type="application\/ld\+json">\s*"([^"]*)"\s*<\/script>/gs;
  const escapedMatches = fixed.match(escapedJsonRegex);
  if (escapedMatches) {
    escapedMatches.forEach(match => {
      const unescaped = match.replace(/<script\s+type="application\/ld\+json">\s*"/, '<script type="application/ld+json">')
                            .replace(/"\s*<\/script>/, '</script>')
                            .replace(/\\"/g, '"')
                            .replace(/\\n/g, '\n')
                            .replace(/\\\\/g, '\\');
      fixed = fixed.replace(match, unescaped);
      hasChanges = true;
    });
  }
  
  // Fix double-escaped quotes
  const doubleEscapedRegex = /\\"/g;
  if (doubleEscapedRegex.test(fixed)) {
    fixed = fixed.replace(doubleEscapedRegex, '"');
    hasChanges = true;
  }
  
  return { content: fixed, hasChanges };
}

/**
 * Validate and fix JSON-LD data types
 */
export function fixJsonLdDataTypes(jsonLdContent) {
  let fixed = jsonLdContent;
  let hasChanges = false;
  
  try {
    // Parse the JSON-LD
    const schema = JSON.parse(jsonLdContent);
    
    // Fix common data type issues
    if (schema.datePublished && typeof schema.datePublished === 'string') {
      const date = new Date(schema.datePublished);
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString();
        if (schema.datePublished !== isoDate) {
          schema.datePublished = isoDate;
          hasChanges = true;
        }
      }
    }
    
    if (schema.dateModified && typeof schema.dateModified === 'string') {
      const date = new Date(schema.dateModified);
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString();
        if (schema.dateModified !== isoDate) {
          schema.dateModified = isoDate;
          hasChanges = true;
        }
      }
    }
    
    // Fix author object structure
    if (schema.author && typeof schema.author === 'object') {
      if (!schema.author['@type']) {
        schema.author['@type'] = 'Person';
        hasChanges = true;
      }
    }
    
    // Fix publisher object structure
    if (schema.publisher && typeof schema.publisher === 'object') {
      if (!schema.publisher['@type']) {
        schema.publisher['@type'] = 'Organization';
        hasChanges = true;
      }
    }
    
    // Fix mainEntityOfPage structure
    if (schema.mainEntityOfPage && typeof schema.mainEntityOfPage === 'object') {
      if (!schema.mainEntityOfPage['@type']) {
        schema.mainEntityOfPage['@type'] = 'WebPage';
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      fixed = JSON.stringify(schema, null, 2);
    }
    
  } catch (error) {
    return { content: jsonLdContent, hasChanges: false, error: error.message };
  }
  
  return { content: fixed, hasChanges };
}

/**
 * Process and fix JSON-LD schema in content
 */
export function processJsonLdSchema(content) {
  let fixedContent = content;
  let hasChanges = false;
  let errors = [];
  
  // Extract and fix JSON-LD schema
  const jsonLdRegex = /<script\s+type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g;
  const matches = [...content.matchAll(jsonLdRegex)];
  
  if (matches.length > 0) {
    matches.forEach((match, index) => {
      const fullMatch = match[0];
      const jsonLdContent = match[1];
      
      // Fix syntax issues first
      const syntaxFix = fixJsonLdSyntax(fullMatch);
      if (syntaxFix.hasChanges) {
        fixedContent = fixedContent.replace(fullMatch, syntaxFix.content);
        hasChanges = true;
      }
      
      // Extract JSON-LD content from fixed script tag
      const fixedJsonLdMatch = fixedContent.match(/<script\s+type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
      if (fixedJsonLdMatch) {
        const fixedJsonLdContent = fixedJsonLdMatch[1];
        
        // Fix data types
        const dataTypeFix = fixJsonLdDataTypes(fixedJsonLdContent);
        if (dataTypeFix.hasChanges) {
          const newScriptTag = `<script type="application/ld+json">\n${dataTypeFix.content}\n</script>`;
          fixedContent = fixedContent.replace(fixedJsonLdMatch[0], newScriptTag);
          hasChanges = true;
        }
        
        if (dataTypeFix.error) {
          errors.push(dataTypeFix.error);
        }
      }
    });
  }
  
  return { content: fixedContent, hasChanges, errors };
}
