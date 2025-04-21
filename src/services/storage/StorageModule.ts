/**
 * Base StorageModule class
 * Provides common functionality for all storage modules
 */

import { CompressionService } from '../CompressionService';

export interface StorageOptions {
  namespace?: string;
  version?: number;
  compressionThreshold?: number;
  useCompression?: boolean;
}

export interface StoredData<T> {
  version: number;
  updatedAt: number;
  data: T;
  compressed?: boolean;
}

export class StorageModule<T> {
  protected namespace: string;
  protected version: number;
  protected storageKey: string;
  protected compressionService: CompressionService;
  protected useCompression: boolean;

  constructor(key: string, options: StorageOptions = {}) {
    this.namespace = options.namespace || 'wld';
    this.version = options.version || 1;
    this.storageKey = `${this.namespace}_${key}`;
    this.compressionService = new CompressionService(options.compressionThreshold);
    this.useCompression = options.useCompression !== undefined ? options.useCompression : true;
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
   * Retrieves data from localStorage with automatic decompression if needed
   */
  get(): T | null {
    try {
      const rawData = localStorage.getItem(this.storageKey);
      if (!rawData) return null;
      
      // Handle compressed data
      const decompressedRawData = this.compressionService.autoDecompress(rawData);
      const storedData = JSON.parse(decompressedRawData) as StoredData<T>;
      return this.unwrapData(storedData);
    } catch (error) {
      console.error(`Error retrieving data from ${this.storageKey}:`, error);
      return null;
    }
  }

  /**
   * Stores data in localStorage with automatic compression for large data
   */
  set(data: T): boolean {
    try {
      if (!this.validateData(data)) {
        console.warn(`Invalid data passed to ${this.storageKey}`);
        return false;
      }
      
      const wrappedData = this.wrapData(data);
      const serializedData = JSON.stringify(wrappedData);
      
      // Apply compression if enabled and data is large
      let finalData = serializedData;
      if (this.useCompression) {
        finalData = this.compressionService.autoCompress(serializedData);
      }
      
      localStorage.setItem(this.storageKey, finalData);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error(`Storage quota exceeded for ${this.storageKey}. Try enabling compression.`);
      } else {
        console.error(`Error setting data for ${this.storageKey}:`, error);
      }
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
      
      let serializedData = JSON.stringify(backupData);
      if (this.useCompression) {
        serializedData = this.compressionService.autoCompress(serializedData);
      }
      
      localStorage.setItem(backupKey, serializedData);
      return backupKey;
    } catch (error) {
      console.error(`Error creating backup for ${this.storageKey}:`, error);
      return null;
    }
  }

  /**
   * Enables or disables compression for this storage module
   */
  setCompression(enabled: boolean): void {
    this.useCompression = enabled;
  }

  /**
   * Sets the compression threshold in bytes
   */
  setCompressionThreshold(thresholdBytes: number): void {
    this.compressionService.setThreshold(thresholdBytes);
  }

  /**
   * Estimates the size of the current data in storage
   * @returns The approximate size in bytes
   */
  getApproximateSize(): number {
    try {
      const rawData = localStorage.getItem(this.storageKey);
      if (!rawData) return 0;
      
      // Each character is 2 bytes in UTF-16 encoding used by localStorage
      return rawData.length * 2;
    } catch (error) {
      console.error(`Error calculating size for ${this.storageKey}:`, error);
      return 0;
    }
  }
} 