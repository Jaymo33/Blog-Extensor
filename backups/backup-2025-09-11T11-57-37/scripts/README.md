# Blog Migration System

This system migrates blog posts from a flat structure (`src/content/blog/slug.md`) to a nested structure (`src/content/blog/category/hub/slug.md`) while maintaining SEO through 301 redirects.

## Overview

The migration system:
1. **Exports** all blog URLs from the current flat structure
2. **Classifies** posts into categories and hubs using regex rules
3. **Creates** nested folder structure
4. **Moves** posts to new locations
5. **Updates** content with new URLs
6. **Generates** redirects for Astro
7. **Validates** the migration results

## Quick Start

### Run Full Migration
```bash
node scripts/migrate.js
```

### Run Individual Steps
```bash
# 1. Export all URLs
node scripts/01-export-urls.js

# 2. Classify posts
node scripts/02-classify-posts.js

# 3. Create folders
node scripts/03-create-folders.js

# 4. Move posts (first 10)
node scripts/04-move-posts.js

# 5. Update content
node scripts/05-update-content.js

# 6. Generate redirects
node scripts/06-generate-redirects.js

# 7. Validate results
node scripts/07-validate-migration.js
```

### Rollback Changes
```bash
node scripts/08-rollback.js
```

## Scripts Overview

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `00-backup-content.js` | Backup blog content | `src/content/blog/` | `backup/blog-YYYY-MM-DD/` |
| `01-export-urls.js` | Export all blog URLs | `src/content/blog/` | `out/exported-urls.csv` |
| `02-classify-posts.js` | Classify posts by rules | `out/exported-urls.csv` | `out/classified-posts.csv` |
| `03-create-folders.js` | Create nested folders | `out/classified-posts.csv` | Nested folder structure |
| `04-move-posts.js` | Move posts to new locations | `out/classified-posts.csv` | `out/migration-state.json` |
| `05-update-content.js` | Update post content | `out/migration-state.json` | Updated markdown files |
| `06-generate-redirects.js` | Generate redirects | `out/migration-state.json` | `src/data/redirects.json` |
| `07-validate-migration.js` | Validate results | `out/migration-state.json` | Validation report |
| `08-rollback.js` | Rollback changes | `out/migration-state.json` | Restored files |

## Classification Rules

The system uses regex patterns to classify posts into categories and hubs:

### Categories
- **conversions**: Unit conversion posts
- **food-system**: Air fryer usage and instructions
- **how-to**: Instructional content
- **product-fit**: Product compatibility

### Hubs (examples)
- `kg-to-pounds`, `pounds-to-kg`
- `grams-to-ounces`, `ounces-to-grams`
- `cups-to-grams`, `grams-to-cups`
- `celsius-to-fahrenheit`, `fahrenheit-to-celsius`
- `reheat-in-air-fryer`, `cook-times-in-air-fryer`
- `can-you-air-fry-it`, `brand-instructions`

## File Structure

### Before Migration
```
src/content/blog/
├── 0-5-kg-chicken-wings-to-pounds.md
├── 1-5-kg-fish-fingers-to-pounds.md
└── ...
```

### After Migration
```
src/content/blog/
├── conversions/
│   ├── kg-to-pounds/
│   │   ├── 0-5-kg-chicken-wings-to-pounds.md
│   │   └── 1-5-kg-fish-fingers-to-pounds.md
│   └── grams-to-ounces/
│       └── ...
├── food-system/
│   ├── reheat-in-air-fryer/
│   └── cook-times-in-air-fryer/
└── ...
```

## URL Changes

### Before
- `https://www.airfryerrecipe.co.uk/blog/0-5-kg-chicken-wings-to-pounds`

### After
- `https://www.airfryerrecipe.co.uk/blog/conversions/kg-to-pounds/0-5-kg-chicken-wings-to-pounds`

## Redirects

The system generates `src/data/redirects.json` with mappings like:
```json
{
  "0-5-kg-chicken-wings-to-pounds": "conversions/kg-to-pounds/0-5-kg-chicken-wings-to-pounds"
}
```

These are imported by `astro.config.mjs` to create 301 redirects.

## Safety Features

- **Backup**: Creates timestamped backups before migration
- **Batch Processing**: Processes 10 posts at a time for testing
- **State Tracking**: Maintains migration state for resumability
- **Validation**: Validates all changes before completion
- **Rollback**: Can restore all changes if needed
- **Dry Run**: Can be run in dry-run mode for testing

## Migration State

The system maintains state in `out/migration-state.json`:
```json
{
  "moved": [
    {
      "slug": "0-5-kg-chicken-wings-to-pounds",
      "oldUrl": "https://www.airfryerrecipe.co.uk/blog/0-5-kg-chicken-wings-to-pounds",
      "newUrl": "https://www.airfryerrecipe.co.uk/blog/conversions/kg-to-pounds/0-5-kg-chicken-wings-to-pounds",
      "category": "conversions",
      "hub": "kg-to-pounds",
      "newPath": "src/content/blog/conversions/kg-to-pounds/0-5-kg-chicken-wings-to-pounds.md",
      "timestamp": "2025-01-02T10:30:00.000Z"
    }
  ],
  "failed": [],
  "currentBatch": 1
}
```

## Error Handling

- **Strict Mode**: Fails on any unmatched posts or collisions
- **Resumable**: Can continue from where it left off
- **Detailed Logging**: Shows exactly what happened at each step
- **Validation**: Checks all changes before completion

## Testing

1. **Local Testing**: Run `npm run dev` and test redirects
2. **Production Testing**: Deploy and verify redirects work
3. **Monitoring**: Check for 404s or broken links

## Troubleshooting

### Common Issues

1. **Migration state exists**: Delete `out/migration-state.json` or run rollback
2. **Files not found**: Check if posts were moved correctly
3. **Redirects not working**: Verify `astro.config.mjs` imports redirects
4. **Content not updated**: Check if frontmatter and JSON-LD were updated

### Recovery

- **Partial migration**: Check migration state and continue from last step
- **Failed migration**: Run rollback script to restore original state
- **Broken redirects**: Regenerate redirects file

## Configuration

The system uses the rules engine in `lib/rules-engine.js` for classification. To modify rules:

1. Edit the regex patterns in `classifyPost()` function
2. Test with a small batch first
3. Run full migration when satisfied

## Performance

- **Batch Size**: Processes 10 posts at a time (configurable)
- **Memory**: Uses streaming for large files
- **Speed**: Optimized for 10,000+ posts
- **Resumable**: Can handle interruptions gracefully
