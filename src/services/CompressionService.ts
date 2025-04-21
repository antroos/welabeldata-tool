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

  /**
   * Creates a new CompressionService instance
   * @param threshold Size threshold in bytes for automatic compression
   */
  constructor(threshold: number = DEFAULT_COMPRESSION_THRESHOLD) {
    this.threshold = threshold;
  }

  /**
   * Set the compression threshold
   * @param threshold Size threshold in bytes
   */
  setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  /**
   * Compresses a string using LZ-string
   * @param data The string data to compress
   * @returns Compressed string with marker prefix
   */
  compress(data: string): string {
    try {
      const compressed = LZString.compressToUTF16(data);
      return `${COMPRESSION_MARKER}${compressed}`;
    } catch (error) {
      console.error('Error compressing data:', error);
      return data; // Return original data on error
    }
  }

  /**
   * Decompresses a string that was compressed with LZ-string
   * @param data The compressed string to decompress
   * @returns The original decompressed string
   */
  decompress(data: string): string {
    if (!this.isCompressed(data)) {
      return data;
    }

    try {
      const compressedData = data.substring(COMPRESSION_MARKER.length);
      return LZString.decompressFromUTF16(compressedData) || data;
    } catch (error) {
      console.error('Error decompressing data:', error);
      return data; // Return original data on error
    }
  }

  /**
   * Checks if a string is compressed (has the compression marker)
   * @param data The string to check
   * @returns True if the string is compressed
   */
  isCompressed(data: string): boolean {
    return typeof data === 'string' && data.startsWith(COMPRESSION_MARKER);
  }

  /**
   * Automatically compresses data if it exceeds the threshold size
   * @param data Data to potentially compress
   * @returns Compressed or original data
   */
  autoCompress(data: string): string {
    // Calculate approximate string size in bytes (2 bytes per char for UTF-16)
    const sizeInBytes = data.length * 2;
    
    if (sizeInBytes >= this.threshold) {
      return this.compress(data);
    }
    
    return data;
  }

  /**
   * Automatically decompresses data if it is compressed
   * @param data Data to potentially decompress
   * @returns Decompressed or original data
   */
  autoDecompress(data: string): string {
    if (this.isCompressed(data)) {
      return this.decompress(data);
    }
    
    return data;
  }

  /**
   * Calculate approximate compression ratio for the given data
   * @param uncompressed Original uncompressed data
   * @returns Compression ratio (lower is better)
   */
  getCompressionRatio(uncompressed: string): number {
    if (!uncompressed || uncompressed.length === 0) {
      return 1;
    }
    
    const compressed = this.compress(uncompressed);
    return compressed.length / uncompressed.length;
  }
} 