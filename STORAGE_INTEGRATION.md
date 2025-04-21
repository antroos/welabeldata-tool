# Storage Integration Testing

This document covers the implementation and usage of the storage integration testing in the WeLabelData annotation tool.

## Overview

The storage integration tests verify that the storage modules work correctly together as a system. This complements the individual module tests by ensuring proper interaction between different storage components.

## Implementation Details

### Storage Provider Context

The storage modules are made available to components through the `StorageContext` and `StorageProvider`. This enables components throughout the application to access the storage functionality using the `useStorage` hook.

The implementation includes:

1. A React context (`StorageContext`) that provides access to all storage modules
2. A provider component (`StorageProvider`) that initializes all storage modules
3. A hook (`useStorage`) that provides typed access to the storage context

### Test Pages

Two test pages are available:

1. **Storage Module Tests** (`/storage-test`)
   - Tests each storage module independently
   - Verifies basic operations (set, get, remove)
   - Tests module-specific functionality

2. **Storage Integration Tests** (`/storage-integration-test`)
   - Tests interactions between modules
   - Creates and manages workflows end-to-end
   - Verifies preferences are properly saved and retrieved
   - Tests cross-module dependencies

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

### StorageIntegrationTest.tsx

The integration test page component:

```tsx
// src/pages/storage-integration-test.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStorage, StorageProvider } from '../contexts/StorageContext';
import { Workflow } from '../services/storage/WorkflowStorage';

function StorageIntegrationTestContent() {
  const { workflowStorage, annotationStorage, preferencesStorage, isLoaded } = useStorage();
  // Test implementation
  // ...
}

export default function StorageIntegrationTest() {
  return (
    <StorageProvider>
      <StorageIntegrationTestContent />
    </StorageProvider>
  );
}
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
Overall Result: ALL TESTS PASSED

=== Storage Integration Test ===
Create Workflow: PASSED
Save Workflow: PASSED
Retrieve Workflow: PASSED
Update Workflow: PASSED
Set Preferences: PASSED
Get Preferences: PASSED
```

## Usage Notes

1. **Context Provider Requirements**: Components that use the `useStorage` hook must be wrapped with the `StorageProvider` component. For the app router, this is done in `src/app/layout.tsx`. For pages router components, this needs to be done explicitly as demonstrated in the integration test.

2. **Testing Approach**: The storage integration tests demonstrate the proper usage pattern for consuming storage modules in application components.

## Common Issues

1. **"useStorage must be used within a StorageProvider" error**: This indicates that a component is trying to use the `useStorage` hook without being wrapped in a `StorageProvider`. Ensure all components using storage are wrapped appropriately.

2. **Data persistence issues**: If data is not persisting between page refreshes, check that the storage modules are initialized properly and that localStorage is available in the browser. 