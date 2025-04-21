/**
 * Base StorageModule class
 * Provides common functionality for all storage modules
 */

export interface StorageOptions {
  namespace?: string;
  version?: number;
}

export interface StoredData<T> {
  version: number;
  updatedAt: number;
  data: T;
}

export class StorageModule<T> {
  protected namespace: string;
  protected version: number;
  protected storageKey: string;

  constructor(key: string, options: StorageOptions = {}) {
    this.namespace = options.namespace || 'wld';
    this.version = options.version || 1;
    this.storageKey = `${this.namespace}_${key}`;
  }

  /**
   * Wraps data with metadata before storing
   */
  protected wrapData(data: T): StoredData<T> {
    return {
      version: this.version,
      updatedAt: Date.now(),
      data
    };
  }

  /**
   * Unwraps stored data, handling version migrations if needed
   */
  protected unwrapData(storedData: StoredData<T> | null): T | null {
    if (!storedData) return null;
    
    // Handle version migrations if needed
    if (storedData.version < this.version) {
      console.log(`Migrating data from version ${storedData.version} to ${this.version}`);
      // Migration logic would go here
    }
    
    return storedData.data;
  }

  /**
   * Validates data before storing
   * Override in subclasses for specific validation
   */
  protected validateData(data: T): boolean {
    return data !== null && data !== undefined;
  }

  /**
   * Retrieves data from localStorage
   */
  get(): T | null {
    try {
      const rawData = localStorage.getItem(this.storageKey);
      if (!rawData) return null;
      
      const storedData = JSON.parse(rawData) as StoredData<T>;
      return this.unwrapData(storedData);
    } catch (error) {
      console.error(`Error retrieving data from ${this.storageKey}:`, error);
      return null;
    }
  }

  /**
   * Stores data in localStorage
   */
  set(data: T): boolean {
    try {
      if (!this.validateData(data)) {
        console.warn(`Invalid data passed to ${this.storageKey}`);
        return false;
      }
      
      const wrappedData = this.wrapData(data);
      localStorage.setItem(this.storageKey, JSON.stringify(wrappedData));
      return true;
    } catch (error) {
      console.error(`Error setting data for ${this.storageKey}:`, error);
      return false;
    }
  }

  /**
   * Removes data from localStorage
   */
  remove(): boolean {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error(`Error removing ${this.storageKey}:`, error);
      return false;
    }
  }

  /**
   * Checks if data exists in localStorage
   */
  exists(): boolean {
    return localStorage.getItem(this.storageKey) !== null;
  }

  /**
   * Creates a backup of current data
   */
  createBackup(): string | null {
    try {
      const data = this.get();
      if (!data) return null;
      
      const backupKey = `${this.storageKey}_backup_${Date.now()}`;
      const backupData = this.wrapData(data);
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      return backupKey;
    } catch (error) {
      console.error(`Error creating backup for ${this.storageKey}:`, error);
      return null;
    }
  }
} 