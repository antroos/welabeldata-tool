import { StorageModule, StorageOptions } from './StorageModule';

/**
 * Interface for theme preferences
 */
export interface ThemePreferences {
  darkMode: boolean;
  colorScheme: 'default' | 'blue' | 'green' | 'purple';
  fontSize: 'small' | 'medium' | 'large';
}

/**
 * Interface for editor preferences
 */
export interface EditorPreferences {
  autoSave: boolean;
  autoSaveInterval: number; // in milliseconds
  showLineNumbers: boolean;
  defaultCategory: string;
}

/**
 * Interface for export preferences
 */
export interface ExportPreferences {
  format: 'json' | 'zip' | 'csv';
  includeScreenshots: boolean;
  includeMetadata: boolean;
  namingTemplate: string;
  exportDirectory: string;
}

/**
 * Interface for application preferences
 */
export interface AppPreferences {
  theme: ThemePreferences;
  editor: EditorPreferences;
  export: ExportPreferences;
  lastUsedModel: string;
  recentWorkflows: string[];
  lastUpdated: number;
}

/**
 * Default preferences values
 */
export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: {
    darkMode: false,
    colorScheme: 'default',
    fontSize: 'medium'
  },
  editor: {
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    showLineNumbers: true,
    defaultCategory: 'input'
  },
  export: {
    format: 'json',
    includeScreenshots: true,
    includeMetadata: true,
    namingTemplate: '{title}_{date}',
    exportDirectory: 'exports'
  },
  lastUsedModel: 'gpt-4o',
  recentWorkflows: [],
  lastUpdated: Date.now()
};

/**
 * Storage module for user preferences
 */
export class PreferencesStorage extends StorageModule<AppPreferences> {
  constructor(options: StorageOptions = {}) {
    super('preferences', options);
  }

  /**
   * Validates preferences data
   */
  protected validateData(data: AppPreferences): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Basic validation for required fields
    return (
      data.theme && typeof data.theme === 'object' &&
      data.editor && typeof data.editor === 'object' &&
      data.export && typeof data.export === 'object' &&
      typeof data.lastUpdated === 'number'
    );
  }

  /**
   * Gets all user preferences, with defaults for missing values
   */
  getPreferences(): AppPreferences {
    const savedPreferences = this.get();
    if (!savedPreferences) {
      return DEFAULT_PREFERENCES;
    }
    
    // Merge with defaults to ensure all fields exist
    return {
      theme: {
        ...DEFAULT_PREFERENCES.theme,
        ...savedPreferences.theme
      },
      editor: {
        ...DEFAULT_PREFERENCES.editor,
        ...savedPreferences.editor
      },
      export: {
        ...DEFAULT_PREFERENCES.export,
        ...savedPreferences.export
      },
      lastUsedModel: savedPreferences.lastUsedModel || DEFAULT_PREFERENCES.lastUsedModel,
      recentWorkflows: savedPreferences.recentWorkflows || DEFAULT_PREFERENCES.recentWorkflows,
      lastUpdated: savedPreferences.lastUpdated || Date.now()
    };
  }

  /**
   * Updates theme preferences
   */
  updateThemePreferences(themePrefs: Partial<ThemePreferences>): boolean {
    try {
      const currentPrefs = this.getPreferences();
      const updatedPrefs = {
        ...currentPrefs,
        theme: {
          ...currentPrefs.theme,
          ...themePrefs
        },
        lastUpdated: Date.now()
      };
      
      return this.set(updatedPrefs);
    } catch (error) {
      console.error('Error updating theme preferences:', error);
      return false;
    }
  }

  /**
   * Updates editor preferences
   */
  updateEditorPreferences(editorPrefs: Partial<EditorPreferences>): boolean {
    try {
      const currentPrefs = this.getPreferences();
      const updatedPrefs = {
        ...currentPrefs,
        editor: {
          ...currentPrefs.editor,
          ...editorPrefs
        },
        lastUpdated: Date.now()
      };
      
      return this.set(updatedPrefs);
    } catch (error) {
      console.error('Error updating editor preferences:', error);
      return false;
    }
  }

  /**
   * Updates export preferences
   */
  updateExportPreferences(exportPrefs: Partial<ExportPreferences>): boolean {
    try {
      const currentPrefs = this.getPreferences();
      const updatedPrefs = {
        ...currentPrefs,
        export: {
          ...currentPrefs.export,
          ...exportPrefs
        },
        lastUpdated: Date.now()
      };
      
      return this.set(updatedPrefs);
    } catch (error) {
      console.error('Error updating export preferences:', error);
      return false;
    }
  }

  /**
   * Sets the last used model
   */
  setLastUsedModel(modelId: string): boolean {
    try {
      const currentPrefs = this.getPreferences();
      const updatedPrefs = {
        ...currentPrefs,
        lastUsedModel: modelId,
        lastUpdated: Date.now()
      };
      
      return this.set(updatedPrefs);
    } catch (error) {
      console.error('Error updating last used model:', error);
      return false;
    }
  }

  /**
   * Adds a workflow to recent workflows list
   */
  addRecentWorkflow(workflowId: string): boolean {
    try {
      const currentPrefs = this.getPreferences();
      let recentWorkflows = currentPrefs.recentWorkflows || [];
      
      // Remove if already exists
      recentWorkflows = recentWorkflows.filter(id => id !== workflowId);
      
      // Add to beginning of array
      recentWorkflows.unshift(workflowId);
      
      // Keep only the last 10
      if (recentWorkflows.length > 10) {
        recentWorkflows = recentWorkflows.slice(0, 10);
      }
      
      const updatedPrefs = {
        ...currentPrefs,
        recentWorkflows,
        lastUpdated: Date.now()
      };
      
      return this.set(updatedPrefs);
    } catch (error) {
      console.error('Error updating recent workflows:', error);
      return false;
    }
  }

  /**
   * Resets preferences to defaults
   */
  resetToDefaults(): boolean {
    try {
      return this.set(DEFAULT_PREFERENCES);
    } catch (error) {
      console.error('Error resetting preferences:', error);
      return false;
    }
  }
} 