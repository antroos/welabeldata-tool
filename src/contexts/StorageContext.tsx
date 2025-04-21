"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { WorkflowStorage } from '../services/storage/WorkflowStorage';
import { AnnotationStorage } from '../services/storage/AnnotationStorage';
import { PreferencesStorage } from '../services/storage/PreferencesStorage';

interface StorageContextType {
  workflowStorage: WorkflowStorage;
  annotationStorage: AnnotationStorage;
  preferencesStorage: PreferencesStorage;
  isLoaded: boolean;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

interface StorageProviderProps {
  children: ReactNode;
}

export const StorageProvider: React.FC<StorageProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageModules, setStorageModules] = useState<{
    workflowStorage: WorkflowStorage;
    annotationStorage: AnnotationStorage;
    preferencesStorage: PreferencesStorage;
  }>({
    workflowStorage: new WorkflowStorage(),
    annotationStorage: new AnnotationStorage(),
    preferencesStorage: new PreferencesStorage()
  });

  // Initialize storage and perform migrations if needed
  useEffect(() => {
    const initStorage = async () => {
      try {
        // Check for and migrate from old format if needed
        const migrationResult = storageModules.workflowStorage.migrateFromOldFormat();
        if (migrationResult) {
          console.log('Successfully migrated workflows from old format');
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error initializing storage:', error);
        setIsLoaded(true); // Still set as loaded so the app can function
      }
    };

    initStorage();
  }, []);

  return (
    <StorageContext.Provider 
      value={{ 
        ...storageModules,
        isLoaded 
      }}
    >
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = (): StorageContextType => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}; 