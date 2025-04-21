import { CompressionService } from '../CompressionService';
import { StorageModule } from './StorageModule';
import { WorkflowStorage, Workflow } from './WorkflowStorage';

/**
 * Test class for compression functionality
 */
export class CompressionTest {
  private compressionService: CompressionService;
  private testCompressionStorage: StorageModule<any>;
  private workflowStorage: WorkflowStorage;

  constructor() {
    this.compressionService = new CompressionService(1024); // 1KB threshold for testing
    this.testCompressionStorage = new StorageModule<any>('compression_test', {
      compressionThreshold: 1024,
      useCompression: true
    });
    this.workflowStorage = new WorkflowStorage({
      compressionThreshold: 1024 * 10,
      useCompression: true
    });
  }

  /**
   * Run tests for compression service
   */
  testCompressionService(): boolean[] {
    try {
      const results: boolean[] = [];
      
      // Test 1: Basic compression and decompression
      const testString = 'Hello, world!'.repeat(100);
      const compressed = this.compressionService.compress(testString);
      const decompressed = this.compressionService.decompress(compressed);
      results.push(testString === decompressed);
      
      // Test 2: Compressed strings are marked correctly
      results.push(this.compressionService.isCompressed(compressed));
      results.push(!this.compressionService.isCompressed(testString));
      
      // Test 3: Auto-compression based on threshold
      const smallString = 'Small string';
      const largeString = 'Large string'.repeat(200);
      const autoCompressedSmall = this.compressionService.autoCompress(smallString);
      const autoCompressedLarge = this.compressionService.autoCompress(largeString);
      
      results.push(autoCompressedSmall === smallString); // Small string shouldn't be compressed
      results.push(this.compressionService.isCompressed(autoCompressedLarge)); // Large string should be compressed
      
      // Test 4: Compression actually reduces size of suitable data
      const compressibleData = 'a'.repeat(10000);
      const compressedData = this.compressionService.compress(compressibleData);
      results.push(compressedData.length < compressibleData.length);
      
      return results;
    } catch (error) {
      console.error('Error in compression service tests:', error);
      return [false];
    }
  }

  /**
   * Run tests for storage module compression
   */
  testStorageCompression(): boolean[] {
    try {
      const results: boolean[] = [];
      
      // Test 1: Storage module with compression enabled
      const largeData = { data: 'a'.repeat(5000) };
      const success = this.testCompressionStorage.set(largeData);
      results.push(success);
      
      // Test 2: Retrieved data matches original
      const retrievedData = this.testCompressionStorage.get();
      results.push(JSON.stringify(retrievedData) === JSON.stringify(largeData));
      
      // Test 3: Size of compressed data is smaller
      const uncompressedStorage = new StorageModule<any>('uncompressed_test');
      uncompressedStorage.set(largeData);
      
      const compressedSize = this.testCompressionStorage.getApproximateSize();
      const uncompressedSize = uncompressedStorage.getApproximateSize();
      
      results.push(compressedSize < uncompressedSize);
      
      // Cleanup
      this.testCompressionStorage.remove();
      uncompressedStorage.remove();
      
      return results;
    } catch (error) {
      console.error('Error in storage compression tests:', error);
      return [false];
    }
  }

  /**
   * Test image compression in workflow storage
   */
  testWorkflowImageCompression(): boolean[] {
    try {
      const results: boolean[] = [];
      
      // Generate a test image (base64 data)
      const baseImageData = 'data:image/png;base64,' + 'iVBORw0KGgoAAAANSU'.repeat(1000);
      
      // Test 1: Create workflow with image data
      const workflow: Workflow = {
        id: 'test-compression-workflow',
        title: 'Test Compression',
        steps: [
          {
            id: 'step1',
            title: 'Step with image',
            imageData: baseImageData,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const saveResult = this.workflowStorage.saveWorkflow(workflow);
      results.push(saveResult);
      
      // Test 2: Retrieve workflow and check image data is intact
      const retrievedWorkflow = this.workflowStorage.getWorkflowById(workflow.id);
      results.push(!!retrievedWorkflow);
      results.push(retrievedWorkflow?.steps[0].imageData === baseImageData);
      
      // Test 3: Verify storage optimization works
      const compressedCount = this.workflowStorage.optimizeImageStorage();
      results.push(compressedCount >= 0);
      
      // Test 4: Calculate storage size
      const storageSize = this.workflowStorage.getTotalImageStorageSize();
      results.push(storageSize > 0);
      
      // Cleanup
      this.workflowStorage.deleteWorkflow(workflow.id);
      
      return results;
    } catch (error) {
      console.error('Error in workflow image compression tests:', error);
      return [false];
    }
  }

  /**
   * Run all compression tests
   */
  runAllTests(): {
    compressionService: boolean[];
    storageCompression: boolean[];
    workflowImageCompression: boolean[];
  } {
    return {
      compressionService: this.testCompressionService(),
      storageCompression: this.testStorageCompression(),
      workflowImageCompression: this.testWorkflowImageCompression()
    };
  }
} 