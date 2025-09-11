import fs from 'fs';

console.log('🔍 Exporting ALL blog data from Webflow CMS to extract FAQ schemas...');
console.log('📁 Output will be saved to: webflow-faq-schemas.json');
console.log('');

// Webflow API configuration (from your automation scripts)
const WEBFLOW_API_TOKEN = "1d30d972619d3b3456c4aafbc5a9d804e9b96db0b6267d173baa370fed70ab60";
const WEBFLOW_COLLECTION_ID = "6866f05a70a7d76d018911f4";

async function exportAllWebflowBlogData() {
  try {
    console.log('🔄 Connecting to Webflow CMS...');
    console.log(`📊 Collection ID: ${WEBFLOW_COLLECTION_ID}`);
    console.log('');
    
    let allItems = [];
    let offset = 0;
    const limit = 100; // Webflow API limit per request
    let hasMore = true;
    
    // Fetch all pages of data
    while (hasMore) {
      console.log(`📥 Fetching page ${Math.floor(offset/limit) + 1} (items ${offset + 1}-${offset + limit})...`);
      
      const response = await fetch(`https://api.webflow.com/v2/collections/${WEBFLOW_COLLECTION_ID}/items?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
          'accept-version': '1.0.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Webflow API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      allItems = allItems.concat(data.items);
      
      console.log(`   ✅ Fetched ${data.items.length} items (total so far: ${allItems.length})`);
      
      // Check if there are more items
      hasMore = data.items.length === limit;
      offset += limit;
      
      // Add a small delay to avoid rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('');
    console.log(`📊 Found ${allItems.length} total blog posts in Webflow`);
    console.log('');
    
    // Extract schema data
    const schemaData = {};
    let processedCount = 0;
    let schemaFoundCount = 0;
    let errorCount = 0;
    let noSchemaCount = 0;
    
    console.log('🔄 Processing all blog posts...');
    console.log('📈 Progress will be shown every 500 posts:');
    console.log('');
    
    for (const item of allItems) {
      processedCount++;
      
      // Show progress every 500 posts
      if (processedCount % 500 === 0) {
        console.log(`📈 Progress: ${processedCount}/${allItems.length} - Found ${schemaFoundCount} FAQ schemas so far`);
      }
      
      try {
        // Get the slug from the item
        const slug = item.fieldData?.slug || item.slug;
        
        if (!slug) {
          console.log(`⚠️  Post ${processedCount}: No slug found`);
          continue;
        }
        
        if (item.fieldData?.schema) {
          // Extract FAQ schema from the schema field
          const schemaContent = item.fieldData.schema;
          
          // Look for FAQ schema in the content
          const faqMatch = schemaContent.match(/<script type="application\/ld\+json">\s*{\s*"@context":\s*"https:\/\/schema\.org",\s*"@type":\s*"FAQPage",\s*"mainEntity":\s*\[([\s\S]*?)\]\s*}\s*<\/script>/);
          
          if (faqMatch) {
            try {
              const mainEntityContent = faqMatch[1];
              const faqJson = JSON.parse(`{"mainEntity": [${mainEntityContent}]}`);
              schemaData[slug] = faqJson.mainEntity;
              schemaFoundCount++;
              
              // Show when we find schemas
              if (schemaFoundCount % 100 === 0) {
                console.log(`✅ Found ${schemaFoundCount} FAQ schemas so far (latest: ${slug})`);
              }
            } catch (parseError) {
              console.log(`⚠️  Could not parse FAQ schema for ${slug}: ${parseError.message}`);
              errorCount++;
            }
          } else {
            noSchemaCount++;
          }
        } else {
          noSchemaCount++;
        }
      } catch (error) {
        console.log(`❌ Error processing post ${processedCount}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Save extracted schema data
    const outputFile = 'webflow-faq-schemas.json';
    console.log('');
    console.log('💾 Saving extracted FAQ schemas...');
    fs.writeFileSync(outputFile, JSON.stringify(schemaData, null, 2));
    
    console.log('');
    console.log('✅ Webflow export complete!');
    console.log(`📊 Final Results:`);
    console.log(`   📁 Total posts processed: ${processedCount}`);
    console.log(`   🔍 FAQ schemas extracted: ${schemaFoundCount}`);
    console.log(`   📝 Posts without FAQ schema: ${noSchemaCount}`);
    console.log(`   ❌ Errors encountered: ${errorCount}`);
    console.log(`   📄 Output file: ${outputFile}`);
    console.log(`   📁 File location: ${process.cwd()}/${outputFile}`);
    
    if (schemaFoundCount > 0) {
      console.log('');
      console.log('🎉 SUCCESS! FAQ schemas extracted from Webflow!');
      console.log('📋 Next steps:');
      console.log('   1. Update BlogPost.astro to use extracted FAQ schemas');
      console.log('   2. Test the updated schema generation');
      console.log('   3. Verify all 6 schema types appear in validator');
      return true;
    } else {
      console.log('');
      console.log('⚠️  No FAQ schemas found in Webflow data');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Webflow export failed:', error.message);
    console.log('');
    console.log('📋 Troubleshooting:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify Webflow API token is still valid');
    console.log('   3. Ensure collection ID is correct');
    console.log('   4. Check if Webflow API has rate limits');
    return false;
  }
}

// Run export
console.log('🚀 Starting full export process...');
const success = await exportAllWebflowBlogData();

if (success) {
  console.log('');
  console.log('✅ Ready to update BlogPost.astro with ALL FAQ schemas!');
  process.exit(0);
} else {
  console.log('');
  console.log('❌ Export failed - please review errors above');
  process.exit(1);
}
