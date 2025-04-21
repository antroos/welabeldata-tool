import { useEffect, useState } from 'react';
import { runStorageTests } from '../services/storage/StorageTest';

export default function StorageTestPage() {
  const [testRun, setTestRun] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Capture console logs
  useEffect(() => {
    if (!testRun) return;

    // Original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalGroup = console.group;
    const originalGroupEnd = console.groupEnd;

    // Override console methods
    let groupPrefix = '';
    
    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [...prev, `${groupPrefix}${args.join(' ')}`]);
    };
    
    console.error = (...args) => {
      originalError(...args);
      setLogs(prev => [...prev, `ERROR: ${groupPrefix}${args.join(' ')}`]);
    };
    
    console.group = (label) => {
      originalGroup(label);
      groupPrefix = `${label} > `;
      setLogs(prev => [...prev, `\n--- ${label} ---`]);
    };
    
    console.groupEnd = () => {
      originalGroupEnd();
      groupPrefix = '';
    };

    // Return cleanup function
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.group = originalGroup;
      console.groupEnd = originalGroupEnd;
    };
  }, [testRun]);

  const handleRunTests = () => {
    setLogs([]);
    setTestRun(true);
    setTimeout(() => {
      runStorageTests();
    }, 100);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Storage Module Tests</h1>
      
      <div className="mb-6">
        <button
          onClick={handleRunTests}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Run Storage Tests
        </button>
      </div>
      
      {logs.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Test Results:</h2>
          <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
            {logs.join('\n')}
          </pre>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">About This Test</h2>
        <p className="mb-2">
          This page tests the new storage architecture implementation by:
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>Testing the base StorageModule with primitive data</li>
          <li>Testing the WorkflowStorage module with workflow data</li>
          <li>Testing migration from the old storage format to the new one</li>
        </ul>
        <p>
          Check the console for more detailed logs and results.
        </p>
      </div>
      
      <div className="mt-6 mb-4">
        <a 
          href="/"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
} 