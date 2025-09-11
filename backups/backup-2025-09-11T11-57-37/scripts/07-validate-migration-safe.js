import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';

console.log('🔍 Validating migration results (safe version - no schema changes)...');

function getAllMarkdownFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function validateMigration() {
  try {
    // Check if migration state exists
    if (!fs.existsSync('out/migration-state.json')) {
      console.log('❌ No migration state found');
      return false;
    }
    
    const migrationState = JSON.parse(fs.readFileSync('out/migration-state.json', 'utf8'));
    console.log(`📊 Migration state loaded: ${migrationState.moved.length} posts moved`);
    
    // Check if redirects file exists
    if (!fs.existsSync('src/data/redirects.json')) {
      console.log('❌ No redirects file found');
      return false;
    }
    
    const redirects = JSON.parse(fs.readFileSync('src/data/redirects.json', 'utf8'));
    console.log(`🔄 Redirects loaded: ${Object.keys(redirects).length} redirects`);
    
    // Validate moved posts
    let validPosts = 0;
    let invalidPosts = 0;
    const issues = [];
    
    for (const post of migrationState.moved) {
      try {
        // Check if file exists at new location
        if (!fs.existsSync(post.newPath)) {
          issues.push(`Missing file: ${post.newPath}`);
          invalidPosts++;
          continue;
        }
        
        // Read file content
        const content = fs.readFileSync(post.newPath, 'utf8');
        
        // Check if new URL is in content
        if (!content.includes(post.newUrl)) {
          issues.push(`New URL not found in content: ${post.slug}`);
          invalidPosts++;
          continue;
        }
        
        // Check if old URL is NOT in content (should be replaced)
        if (content.includes(post.oldUrl)) {
          issues.push(`Old URL still present in content: ${post.slug}`);
          invalidPosts++;
          continue;
        }
        
        // Check if redirect exists
        const redirectKey = post.slug;
        if (!redirects[redirectKey]) {
          issues.push(`Missing redirect for: ${post.slug}`);
          invalidPosts++;
          continue;
        }
        
        validPosts++;
        
      } catch (error) {
        issues.push(`Error validating ${post.slug}: ${error.message}`);
        invalidPosts++;
      }
    }
    
    console.log('\n✅ Migration validation complete!');
    console.log(`📊 Total moved posts: ${migrationState.moved.length}`);
    console.log(`✅ Valid posts: ${validPosts}`);
    console.log(`❌ Invalid posts: ${invalidPosts}`);
    
    if (invalidPosts > 0) {
      console.log('\n⚠️  Issues found:');
      issues.slice(0, 10).forEach(issue => console.log(`   - ${issue}`));
      if (issues.length > 10) {
        console.log(`   ... and ${issues.length - 10} more issues`);
      }
      return false;
    } else {
      console.log('\n🎉 SUCCESS! All migrated posts are valid!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

// Run validation
const success = validateMigration();

if (success) {
  console.log('\n✅ Migration validation passed!');
  process.exit(0);
} else {
  console.log('\n❌ Migration validation failed!');
  process.exit(1);
}
