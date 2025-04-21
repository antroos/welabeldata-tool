'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStorage, StorageProvider } from '../contexts/StorageContext';
import { CompressionTest } from '../services/storage/CompressionTest';
import { CompressionService } from '../services/CompressionService';

function CompressionTestContent() {
  const { workflowStorage, isLoaded } = useStorage();
  const [testResults, setTestResults] = useState<{
    serviceTests: boolean[];
    storageTests: boolean[];
    imageTests: boolean[];
  } | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    ratio: number;
    savings: number;
  } | null>(null);
  const [status, setStatus] = useState<string>('Idle');
  const [imageStorageSize, setImageStorageSize] = useState<number>(0);
  const [compressedCount, setCompressedCount] = useState<number>(0);

  useEffect(() => {
    if (isLoaded) {
      // Get the current image storage size
      const size = workflowStorage.getTotalImageStorageSize();
      setImageStorageSize(size);
    }
  }, [isLoaded, workflowStorage]);

  const runCompressionTests = () => {
    if (!isLoaded) return;
    
    setStatus('Running tests...');
    
    try {
      const compressionTest = new CompressionTest();
      const results = compressionTest.runAllTests();
      
      setTestResults({
        serviceTests: results.compressionService,
        storageTests: results.storageCompression,
        imageTests: results.workflowImageCompression
      });
      
      setStatus('Tests completed');
    } catch (error) {
      console.error('Error running compression tests:', error);
      setStatus('Error running tests');
    }
  };

  const optimizeImageStorage = () => {
    if (!isLoaded) return;
    
    setStatus('Optimizing image storage...');
    
    try {
      const count = workflowStorage.optimizeImageStorage();
      setCompressedCount(count);
      
      // Refresh image storage size
      const newSize = workflowStorage.getTotalImageStorageSize();
      setImageStorageSize(newSize);
      
      setStatus(`Optimization complete. Compressed ${count} images.`);
    } catch (error) {
      console.error('Error optimizing image storage:', error);
      setStatus('Error optimizing storage');
    }
  };

  const runCompressionDemo = () => {
    if (!isLoaded) return;
    
    setStatus('Running compression demo...');
    
    try {
      // Generate a large repeating string
      const demoData = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(1000);
      
      // Calculate the size of the original data
      const originalSize = demoData.length * 2; // UTF-16 encoding uses 2 bytes per character
      
      // Compress the data
      const compressionService = new CompressionService();
      const compressed = compressionService.compress(demoData);
      
      // Calculate the compressed size
      const compressedSize = compressed.length * 2;
      
      // Calculate compression ratio and savings
      const ratio = compressedSize / originalSize;
      const savings = 100 * (1 - ratio);
      
      setCompressionStats({
        originalSize,
        compressedSize,
        ratio,
        savings
      });
      
      setStatus('Compression demo completed');
    } catch (error) {
      console.error('Error running compression demo:', error);
      setStatus('Error in compression demo');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Storage Compression Test</h1>
        <p>Loading storage modules...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Storage Compression Test</h1>
      
      <div className="my-4">
        <Link 
          href="/"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Back to Home
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Test Controls</h2>
          <div className="flex flex-col gap-2 mb-4">
            <button
              onClick={runCompressionTests}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Run Compression Tests
            </button>
            
            <button
              onClick={optimizeImageStorage}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Optimize Image Storage
            </button>
            
            <button
              onClick={runCompressionDemo}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              Run Compression Demo
            </button>
          </div>
          
          {status && (
            <div className="text-sm font-medium text-blue-600 mt-2">{status}</div>
          )}
        </div>
        
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Storage Stats</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Current Image Storage Size:</span>{' '}
              {formatBytes(imageStorageSize)}
            </div>
            
            {compressedCount > 0 && (
              <div>
                <span className="font-medium">Images Compressed:</span>{' '}
                {compressedCount}
              </div>
            )}
            
            {compressionStats && (
              <>
                <div className="mt-4 font-medium">Compression Demo Results:</div>
                <div className="pl-4 border-l-2 border-purple-200">
                  <div>Original Size: {formatBytes(compressionStats.originalSize)}</div>
                  <div>Compressed Size: {formatBytes(compressionStats.compressedSize)}</div>
                  <div>Compression Ratio: {compressionStats.ratio.toFixed(2)}</div>
                  <div>Space Savings: {compressionStats.savings.toFixed(1)}%</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {testResults && (
        <div className="mt-6 bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Test Results</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">Compression Service Tests</h3>
              <ul className="pl-5 list-disc">
                <li className={testResults.serviceTests[0] ? 'text-green-600' : 'text-red-600'}>
                  Basic compression/decompression: {testResults.serviceTests[0] ? 'PASS' : 'FAIL'}
                </li>
                <li className={(testResults.serviceTests[1] && testResults.serviceTests[2]) ? 'text-green-600' : 'text-red-600'}>
                  Compression markers: {(testResults.serviceTests[1] && testResults.serviceTests[2]) ? 'PASS' : 'FAIL'}
                </li>
                <li className={(testResults.serviceTests[3] && testResults.serviceTests[4]) ? 'text-green-600' : 'text-red-600'}>
                  Auto-compression threshold: {(testResults.serviceTests[3] && testResults.serviceTests[4]) ? 'PASS' : 'FAIL'}
                </li>
                <li className={testResults.serviceTests[5] ? 'text-green-600' : 'text-red-600'}>
                  Size reduction: {testResults.serviceTests[5] ? 'PASS' : 'FAIL'}
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Storage Compression Tests</h3>
              <ul className="pl-5 list-disc">
                <li className={testResults.storageTests[0] ? 'text-green-600' : 'text-red-600'}>
                  Storage set with compression: {testResults.storageTests[0] ? 'PASS' : 'FAIL'}
                </li>
                <li className={testResults.storageTests[1] ? 'text-green-600' : 'text-red-600'}>
                  Compressed data retrieval: {testResults.storageTests[1] ? 'PASS' : 'FAIL'}
                </li>
                <li className={testResults.storageTests[2] ? 'text-green-600' : 'text-red-600'}>
                  Compressed vs. uncompressed size: {testResults.storageTests[2] ? 'PASS' : 'FAIL'}
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Workflow Image Compression Tests</h3>
              <ul className="pl-5 list-disc">
                <li className={testResults.imageTests[0] ? 'text-green-600' : 'text-red-600'}>
                  Save workflow with image: {testResults.imageTests[0] ? 'PASS' : 'FAIL'}
                </li>
                <li className={(testResults.imageTests[1] && testResults.imageTests[2]) ? 'text-green-600' : 'text-red-600'}>
                  Retrieve workflow with decompressed image: {(testResults.imageTests[1] && testResults.imageTests[2]) ? 'PASS' : 'FAIL'}
                </li>
                <li className={testResults.imageTests[3] ? 'text-green-600' : 'text-red-600'}>
                  Storage optimization: {testResults.imageTests[3] ? 'PASS' : 'FAIL'}
                </li>
                <li className={testResults.imageTests[4] ? 'text-green-600' : 'text-red-600'}>
                  Storage size calculation: {testResults.imageTests[4] ? 'PASS' : 'FAIL'}
                </li>
              </ul>
            </div>
            
            <div className="pt-4 border-t">
              <div className="font-medium">
                Overall result:{' '}
                <span 
                  className={
                    testResults.serviceTests.every(r => r) && 
                    testResults.storageTests.every(r => r) && 
                    testResults.imageTests.every(r => r) 
                      ? 'text-green-600 font-bold' 
                      : 'text-red-600 font-bold'
                  }
                >
                  {
                    testResults.serviceTests.every(r => r) && 
                    testResults.storageTests.every(r => r) && 
                    testResults.imageTests.every(r => r) 
                      ? 'ALL TESTS PASSED' 
                      : 'SOME TESTS FAILED'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 bg-white shadow rounded p-4">
        <h2 className="text-xl font-semibold mb-2">About Compression</h2>
        <p className="mb-2">
          This page tests the data compression functionality implemented for the storage system.
          Compression is particularly important for:
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>Reducing the size of large objects like screenshots</li>
          <li>Preventing hitting localStorage size limits</li>
          <li>Improving performance for large datasets</li>
        </ul>
        <p>
          The implementation uses LZ-string compression with automatic threshold detection to
          only compress data when it exceeds a certain size threshold.
        </p>
      </div>
    </div>
  );
}

export default function StorageCompressionTest() {
  return (
    <StorageProvider>
      <CompressionTestContent />
    </StorageProvider>
  );
} 