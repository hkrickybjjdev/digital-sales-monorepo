# Builder Module

The Builder Module provides a Clean Architecture implementation for managing predefined content blocks and page settings definitions using Cloudflare Workers KV for storage.

## Overview

This module enables the creation, retrieval, update, and deletion of:

- **Predefined Content Blocks**: Reusable content templates that can be utilized across pages
- **Page Settings Definitions**: Configuration options that define how pages can be customized

## Architecture

The module follows Clean Architecture principles with distinct layers:

1. **Models Layer**: Defines data structures and validation rules
2. **Repository Layer**: Handles data persistence and retrieval from Cloudflare KV
3. **Service Layer**: Implements business logic and domain rules
4. **Controller Layer**: Handles HTTP requests/responses and input validation
5. **API/Router Layer**: Exposes functionality through REST endpoints
6. **DI (Dependency Injection) Layer**: Manages dependencies between components

## Components

### Models

- `PredefinedContentBlock`: Defines the structure for content blocks with localized display name and description
- `PageSettingsDefinition`: Defines the structure for page settings with various configuration options

### Repositories

- `PredefinedContentBlockRepository`: Handles CRUD operations for content blocks in KV storage
- `PageSettingsDefinitionRepository`: Handles CRUD operations for page settings in KV storage

### Services

- `PredefinedContentBlockService`: Implements business logic for content blocks
- `PageSettingsDefinitionService`: Implements business logic for page settings 

### Controllers

- `contentBlockHandlers.ts`: Contains handler functions for content block HTTP requests
- `pageSettingsHandlers.ts`: Contains handler functions for page settings HTTP requests

### Dependency Injection

- `Container`: Manages singleton instances of repositories and services

## API Endpoints

### Predefined Content Blocks

- `GET /api/v1/builder/content-blocks`: List all content blocks
- `GET /api/v1/builder/content-blocks/:type`: Get a specific content block by type
- `POST /api/v1/builder/content-blocks`: Create a new content block
- `PUT /api/v1/builder/content-blocks/:type`: Update an existing content block
- `DELETE /api/v1/builder/content-blocks/:type`: Delete a content block
- `GET /api/v1/builder/content-blocks/category/:category`: Get content blocks by category

### Page Settings Definitions

- `GET /api/v1/builder/page-settings`: List all page settings definitions
- `GET /api/v1/builder/page-settings/:name`: Get a specific page setting by name
- `POST /api/v1/builder/page-settings`: Create a new page setting definition
- `PUT /api/v1/builder/page-settings/:name`: Update an existing page setting definition
- `DELETE /api/v1/builder/page-settings/:name`: Delete a page setting definition
- `GET /api/v1/builder/page-settings/category/:category`: Get page settings by category
- `GET /api/v1/builder/page-settings/group/:group`: Get page settings by group

## Data Structures

### Predefined Content Block

```json
{
  "type": "string",
  "displayName": { "en": "string", "zh-TW": "string" },
  "name": "string",
  "category": "string",
  "content_structure": {},
  "preview_image_url": "string",
  "isPublic": boolean,
  "version": number,
  "description": { "en": "string", "zh-TW": "string" }
}
```

### Page Settings Definition

```json
{
  "settingName": "string",
  "displayName": { "en": "string", "zh-TW": "string" },
  "fieldType": "string",
  "defaultValue": "string",
  "category": "string",
  "order": number,
  "options": "string",
  "group": "string",
  "description": { "en": "string", "zh-TW": "string" },
  "validationRules": {},
  "conditionalVisibility": {},
  "unit": "string"
}
```

## Implementation Notes

- All data is stored in Cloudflare KV with appropriate key prefixes:
  - `predefinedBlock:` for content blocks
  - `pageSettingDefinition:` for page settings
- Data validation is performed using Zod schemas
- Proper error handling is implemented throughout all layers

## Configuration

The module requires a Cloudflare KV namespace binding named `BUILDER_KV` configured in `wrangler.toml`:

```toml
kv_namespaces = [
  # ... existing namespaces
  { binding = "BUILDER_KV", id = "your-kv-namespace-id-here", preview_id = "your-preview-kv-namespace-id-here" }
]
``` 