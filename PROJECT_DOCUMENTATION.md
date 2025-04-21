# WeLabelData: Project Documentation

## Project Overview

WeLabelData is an AI-powered annotation tool for UI/UX workflows. It helps annotate user interface interactions to train AI models that can automate interactions with software interfaces. The application offers workflow creation, annotation, and export capabilities, with integrated OpenAI assistance.

## Technology Stack

- **Frontend Framework**: Next.js 15.x
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **AI Integration**: OpenAI API (GPT-4o and other models)
- **Data Storage**: Browser localStorage (with enhanced architecture)

## Project Structure

### Root Directory

- `next.config.js` - Next.js configuration
- `postcss.config.js` - PostCSS configuration for TailwindCSS
- `tailwind.config.js` - TailwindCSS configuration
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.env.local` - Environment variables (contains OpenAI API key)

### Source Code (`/src`)

The source code is organized into several main directories:

#### App Directory (`/src/app`)

Contains the Next.js App Router pages and layout:

- `layout.tsx` - Main application layout
- `page.tsx` - Home page with navigation and chat interface
- `globals.css` - Global CSS styles (includes TailwindCSS)

#### App Pages

- `/workflow-editor/page.tsx` - UI for creating and editing workflows
- `/workflow-viewer/page.tsx` - UI for viewing and exporting workflows

#### API Routes (`/src/app/api`)

Backend API routes for various functionalities:

- `/chat` - Handles OpenAI API communication for the chat interface
- `/models` - Retrieves available OpenAI models
- `/annotation` - Provides AI-assisted annotation capabilities
- `/test` - Testing endpoints

#### Components (`/src/components`)

Reusable UI components:

- `Chat.tsx` - Chat interface with OpenAI
- `Timeline.tsx` - Visualization of workflow steps in a timeline
- `ImageUploader.tsx` - Component for uploading and managing screenshots

#### Pages Directory (`/src/pages`)

Contains pages using the Pages Router (in addition to App Router):

- `storage-test.tsx` - Test page for the new storage architecture

#### Libraries (`/src/lib`)

Utility functions and services:

- `storageService.ts` - Original localStorage service (being refactored)
- `annotationService.ts` - Service for AI-assisted annotations

#### Services (`/src/services`)

Modular service implementations:

- `/storage` - New modular storage architecture
  - `StorageModule.ts` - Base module with common storage operations
  - `WorkflowStorage.ts` - Workflow-specific storage implementation
  - `AnnotationStorage.ts` - Step annotation storage implementation
  - `PreferencesStorage.ts` - User preferences storage implementation
  - `StorageTest.ts` - Testing utilities for storage modules

## Key Features

### 1. Workflow Editor

The workflow editor allows users to:
- Create step sequences for UI interactions
- Add screenshots to steps
- Annotate steps with purpose, outcome, and category
- Define relationships between steps

### 2. Chat Interface

The chat component enables:
- Communication with OpenAI models
- AI assistance for annotation tasks
- Selection between different models (GPT-4o, GPT-4, etc.)

### 3. Storage Architecture

The new storage architecture provides:
- Modular approach to data persistence
- Enhanced error handling
- Versioning support for schema changes
- Backup and integrity verification

### 4. Workflow Viewer

The workflow viewer offers:
- Visualization of annotated workflows
- Export capabilities for annotated data
- Validation of workflow completeness and quality

## Data Models

### Workflow

```typescript
interface Workflow {
  id: string;
  title: string;
  steps: WorkflowStep[];
  createdAt: number;
  updatedAt: number;
}
```

### WorkflowStep

```typescript
interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
  imageData?: string;
  purpose?: string;
  expectedOutcome?: string;
  prerequisiteSteps?: string[];
  dependentSteps?: string[];
  category?: string;
  createdAt: number;
  updatedAt: number;
}
```

## Implementation Details

### Storage Module Architecture

The new storage architecture follows these principles:

1. **Base Module**: `StorageModule<T>` provides common functionality:
   - Type-safe get/set operations
   - Error handling
   - Automatic versioning
   - Data validation
   - Data backup and recovery

2. **Specialized Modules** (Completed):
   - `WorkflowStorage` extends the base module for workflow-specific operations
   - `AnnotationStorage` for step annotations with statistics and relationship management
   - `PreferencesStorage` for user settings with theme, editor, and export preferences
   - Migration paths from old storage formats

3. **Future Extensions**:
   - Data compression for large objects (screenshots)
   - Chunking for datasets exceeding localStorage limits
   - Auto-save with conflict resolution
   - Export history tracking

### Testing Strategy

The storage architecture includes a dedicated testing module:
- Tests basic operations (get, set, remove)
- Tests specialized workflow operations
- Tests annotation storage capabilities
- Tests preferences management
- Tests migration paths for backward compatibility
- Provides a visual testing interface at `/storage-test`

## Current Progress

### Completed:
- Phase 1 of Storage Architecture Refactoring: Base Module and Specialized Storage Implementations
  - StorageModule base class with versioning and validation
  - WorkflowStorage with migration from legacy format
  - AnnotationStorage with relationship management and statistics
  - PreferencesStorage with theming and user settings
  - Comprehensive testing suite for all storage modules

### In Progress:
- Phase 2: Storage Optimizations
  - Data compression for large objects
  - Chunking strategy for large datasets
  - Auto-save functionality 