import fs from 'fs';
import path from 'path';

const files = [
  'src/content/blog/safety/can-you-air-fry-it/can-you-put-baking-tin-in-an-air-fryer.md',
  'src/content/blog/safety/can-you-air-fry-it/can-you-put-baking-tin-in-air-fryer.md',
  'src/content/blog/products/brands/tower/air-fryer-accessories-for-tower.md',
  'src/content/blog/health/air-fryer-health/acrylamide-air-fryer.md',
  'src/content/blog/products/brands/actifry/models/actifry-air-fryer.md',
  'src/content/blog/products/air-fryers/models/2-qt-air-fryer.md'
];

console.log('🔧 Fixing remaining files...');

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Simple fix: replace 2-space indented JSON with 4-space
    content = content.replace(/^  ("@context":)/gm, '        "$1');
    content = content.replace(/^  ("@type":)/gm, '        "$1');
    content = content.replace(/^  ("url":)/gm, '        "$1');
    content = content.replace(/^  ("mainEntityOfPage":)/gm, '        "$1');
    content = content.replace(/^  ("headline":)/gm, '        "$1');
    content = content.replace(/^  ("description":)/gm, '        "$1');
    content = content.replace(/^  ("author":)/gm, '        "$1');
    content = content.replace(/^  ("publisher":)/gm, '        "$1');
    content = content.replace(/^  ("datePublished":)/gm, '        "$1');
    content = content.replace(/^  ("dateModified":)/gm, '        "$1');
    content = content.replace(/^  ("image":)/gm, '        "$1');
    content = content.replace(/^  ("about":)/gm, '        "$1');
    content = content.replace(/^  ("articleSection":)/gm, '        "$1');
    content = content.replace(/^  ("inLanguage":)/gm, '        "$1');
    
    // Fix nested objects
    content = content.replace(/^    ("@type":)/gm, '            "$1');
    content = content.replace(/^    ("@id":)/gm, '            "$1');
    content = content.replace(/^    ("name":)/gm, '            "$1');
    content = content.replace(/^    ("url":)/gm, '            "$1');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
    
  } catch (error) {
    console.log(`❌ Error: ${filePath} - ${error.message}`);
  }
});

console.log('✅ Done!');
