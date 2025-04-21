# Storage Integration Testing

This document covers the implementation and usage of the storage integration testing in the WeLabelData annotation tool.

## Overview

The storage modules work together as a system to provide efficient, type-safe data persistence. This document explains how the modules interact and how to test their functionality both individually and as an integrated system.

## Implementation Details

### Storage Provider Context

The storage modules are made available to components through the `StorageContext` and `StorageProvider`. This enables components throughout the application to access the storage functionality using the `useStorage` hook.

The implementation includes:

1. A React context (`StorageContext`) that provides access to all storage modules
2. A provider component (`StorageProvider`) that initializes all storage modules
3. A hook (`useStorage`) that provides typed access to the storage context

### Test Pages

Several test pages are available for verifying storage functionality:

1. **Storage Module Tests** (`/storage-test`)
   - Tests each storage module independently
   - Verifies basic operations (set, get, remove)
   - Tests module-specific functionality

2. **Storage Integration Tests** (`/storage-integration-test`)
   - Tests interactions between modules
   - Creates and manages workflows end-to-end
   - Verifies preferences are properly saved and retrieved
   - Tests cross-module dependencies

3. **Storage Compression Tests** (`/storage-compression-test`)
   - Tests the LZ-string compression functionality
   - Demonstrates compression efficiency
   - Tests automatic threshold detection
   - Provides tools to optimize existing storage

## Storage Architecture

### Base Module

The `StorageModule<T>` is the foundation of the storage system, providing:

- Type-safe get/set operations
- Error handling with graceful fallbacks
- Automatic versioning for future compatibility
- Data integrity verification

### Data Compression

To optimize storage usage, especially for large data like image screenshots, the system includes:

- **CompressionService**: Provides LZ-string compression with:
  - Transparent compression/decompression
  - Automatic threshold detection
  - Compression markers to identify compressed data
  - Configurable threshold settings

- **Integrated Workflow Image Compression**:
  - Automatically compresses images when they exceed the threshold
  - Transparently decompresses images when retrieved
  - Provides optimization utilities to reduce storage usage

## Key Components

### StorageContext.tsx

The context provider that makes storage modules available throughout the application:

```tsx
// src/contexts/StorageContext.tsx
"use client";
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { WorkflowStorage } from '../services/storage/WorkflowStorage';
import { AnnotationStorage } from '../services/storage/AnnotationStorage';
import { PreferencesStorage } from '../services/storage/PreferencesStorage';

// Context type definition
interface StorageContextType {
  workflowStorage: WorkflowStorage;
  annotationStorage: AnnotationStorage;
  preferencesStorage: PreferencesStorage;
  isLoaded: boolean;
}

// Create the context
const StorageContext = createContext<StorageContextType | undefined>(undefined);

// Provider component
export const StorageProvider = ({ children }: { children: ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [storage, setStorage] = useState<StorageContextType | null>(null);

  useEffect(() => {
    // Initialize storage modules
    const workflowStorage = new WorkflowStorage();
    const annotationStorage = new AnnotationStorage();
    const preferencesStorage = new PreferencesStorage();

    setStorage({
      workflowStorage,
      annotationStorage,
      preferencesStorage,
      isLoaded: true
    });
    setIsLoaded(true);
  }, []);

  if (!storage) {
    return <div>Loading storage modules...</div>;
  }

  return (
    <StorageContext.Provider value={storage}>
      {children}
    </StorageContext.Provider>
  );
};

// Custom hook for using the storage context
export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
```

### CompressionService.ts

The service that handles data compression and decompression:

```tsx
// src/services/CompressionService.ts
import LZString from 'lz-string';

// Marker prefix to identify compressed strings
const COMPRESSION_MARKER = '__COMPRESSED__:';

// Default threshold in bytes for automatic compression
const DEFAULT_COMPRESSION_THRESHOLD = 10 * 1024; // 10KB

/**
 * Service for handling data compression and decompression
 */
export class CompressionService {
  private threshold: number;

  constructor(threshold: number = DEFAULT_COMPRESSION_THRESHOLD) {
    this.threshold = threshold;
  }

  // Methods for compression, decompression, and threshold detection
  // ...
}
```

## Using Compression in Your Components

To leverage the compression functionality in your components:

1. Use the standard `useStorage()` hook to access storage modules that automatically handle compression

2. For manual compression control:
```tsx
import { CompressionService } from '../services/CompressionService';

// In your component
const compressionService = new CompressionService();

// Compress large data
const largeData = "..."; // Some large string
const compressed = compressionService.autoCompress(largeData);

// Decompress when needed
const originalData = compressionService.autoDecompress(compressed);
```

## Test Results

When all tests pass successfully, you should see:

```
=== Storage Module Tests ===
Base Storage Module: PASSED
Workflow Storage: PASSED
Annotation Storage: PASSED
Preferences Storage: PASSED
Migration Test: PASSED
Compression Test: PASSED
Overall Result: ALL TESTS PASSED
```

## Usage Notes

1. **Context Provider Requirements**: Components that use the `useStorage` hook must be wrapped with the `StorageProvider` component. For the app router, this is done in `src/app/layout.tsx`. For pages router components, this needs to be done explicitly as demonstrated in the integration test.

2. **Testing Approach**: The storage integration tests demonstrate the proper usage pattern for consuming storage modules in application components.

3. **Compression Configuration**: You can adjust compression thresholds based on your specific needs:

```tsx
const workflowStorage = new WorkflowStorage({
  useCompression: true,
  compressionThreshold: 5 * 1024 // 5KB threshold
});
```

## Common Issues

1. **"useStorage must be used within a StorageProvider" error**: This indicates that a component is trying to use the `useStorage` hook without being wrapped in a `StorageProvider`. Ensure all components using storage are wrapped appropriately.

2. **Data persistence issues**: If data is not persisting between page refreshes, check that the storage modules are initialized properly and that localStorage is available in the browser.

3. **Storage Quota Exceeded Errors**: When storing large data, you might hit browser localStorage limits. Enable compression and optimize storage using the methods provided by the storage modules to mitigate this issue. 