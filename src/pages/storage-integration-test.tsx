'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStorage, StorageProvider } from '../contexts/StorageContext';
import { Workflow } from '../services/storage/WorkflowStorage';

function StorageIntegrationTestContent() {
  const { workflowStorage, annotationStorage, preferencesStorage, isLoaded } = useStorage();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [testWorkflow, setTestWorkflow] = useState<Workflow | null>(null);
  const [testMessage, setTestMessage] = useState<string>('');
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    result: boolean;
    message: string;
  }>>([]);

  // Load workflows when the component mounts
  useEffect(() => {
    if (!isLoaded) return;
    
    loadWorkflows();
  }, [isLoaded]);

  const loadWorkflows = () => {
    try {
      const loadedWorkflows = workflowStorage.getWorkflows();
      setWorkflows(loadedWorkflows);
      setTestMessage('Loaded ' + loadedWorkflows.length + ' workflows');
    } catch (error) {
      console.error('Error loading workflows:', error);
      setTestMessage('Error loading workflows');
    }
  };

  const runIntegrationTests = () => {
    const results: Array<{
      test: string;
      result: boolean;
      message: string;
    }> = [];
    
    // Test 1: Create a new workflow
    try {
      const testTitle = 'Test Workflow ' + Date.now();
      const newWorkflow = workflowStorage.createNewWorkflow(testTitle);
      setTestWorkflow(newWorkflow);
      
      results.push({
        test: 'Create Workflow',
        result: true,
        message: `Created workflow with ID ${newWorkflow.id}`
      });
      
      // Test 2: Save the workflow
      const saveResult = workflowStorage.saveWorkflow(newWorkflow);
      results.push({
        test: 'Save Workflow',
        result: saveResult,
        message: saveResult ? 'Workflow saved successfully' : 'Failed to save workflow'
      });
      
      // Test 3: Retrieve the workflow
      const retrievedWorkflow = workflowStorage.getWorkflowById(newWorkflow.id);
      const retrieveSuccess = retrievedWorkflow !== null;
      results.push({
        test: 'Retrieve Workflow',
        result: retrieveSuccess,
        message: retrieveSuccess 
          ? `Retrieved workflow with title: ${retrievedWorkflow?.title}` 
          : 'Failed to retrieve workflow'
      });
      
      // Test 4: Update the workflow
      if (retrievedWorkflow) {
        const updatedWorkflow = {
          ...retrievedWorkflow,
          title: `${retrievedWorkflow.title} (Updated)`
        };
        
        const updateResult = workflowStorage.saveWorkflow(updatedWorkflow);
        results.push({
          test: 'Update Workflow',
          result: updateResult,
          message: updateResult ? 'Workflow updated successfully' : 'Failed to update workflow'
        });
      }
      
      // Test 5: Set user preference
      const preferenceResult = preferencesStorage.updateThemePreferences({
        darkMode: true,
        colorScheme: 'blue'
      });
      
      results.push({
        test: 'Set Preferences',
        result: preferenceResult,
        message: preferenceResult ? 'Preferences set successfully' : 'Failed to set preferences'
      });
      
      // Test 6: Retrieve user preference
      const preferences = preferencesStorage.getPreferences();
      results.push({
        test: 'Get Preferences',
        result: preferences.theme.darkMode === true,
        message: `Retrieved preferences: Dark mode is ${preferences.theme.darkMode ? 'enabled' : 'disabled'}`
      });
      
    } catch (error) {
      results.push({
        test: 'Integration Tests',
        result: false,
        message: 'Error running tests: ' + (error instanceof Error ? error.message : String(error))
      });
    }
    
    setTestResults(results);
    loadWorkflows(); // Refresh the workflow list
  };

  const deleteTestWorkflow = () => {
    if (testWorkflow) {
      const deleted = workflowStorage.deleteWorkflow(testWorkflow.id);
      
      setTestMessage(deleted 
        ? `Deleted test workflow ${testWorkflow.id}` 
        : `Failed to delete test workflow ${testWorkflow.id}`
      );
      
      if (deleted) {
        setTestWorkflow(null);
        loadWorkflows(); // Refresh the workflow list
      }
    }
  };

  const resetPreferences = () => {
    const reset = preferencesStorage.resetToDefaults();
    setTestMessage(reset ? 'Preferences reset to defaults' : 'Failed to reset preferences');
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Storage Integration Test</h1>
        <p>Loading storage modules...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Storage Integration Test</h1>
      
      <div className="my-4">
        <Link 
          href="/"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Back to Home
        </Link>
      </div>
      
      <div className="bg-white shadow rounded p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Controls</h2>
        <div className="flex gap-2 mb-4">
          <button
            onClick={runIntegrationTests}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Run Integration Tests
          </button>
          
          <button
            onClick={deleteTestWorkflow}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            disabled={!testWorkflow}
          >
            Delete Test Workflow
          </button>
          
          <button
            onClick={resetPreferences}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Reset Preferences
          </button>
        </div>
        
        {testMessage && (
          <div className="text-sm font-medium text-blue-600 mt-2">{testMessage}</div>
        )}
      </div>
      
      {testResults.length > 0 && (
        <div className="bg-white shadow rounded p-4 mb-6">
          <h2 className="text-xl font-semibold mb-2">Test Results</h2>
          <div className="bg-gray-50 p-3 rounded">
            <ul className="divide-y divide-gray-200">
              {testResults.map((result, index) => (
                <li key={index} className="py-2">
                  <div className="flex items-start">
                    <div className={`px-2 py-1 rounded text-white mr-3 ${result.result ? 'bg-green-500' : 'bg-red-500'}`}>
                      {result.result ? 'PASS' : 'FAIL'}
                    </div>
                    <div>
                      <div className="font-medium">{result.test}</div>
                      <div className="text-sm text-gray-600">{result.message}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-semibold mb-2">Current Workflows</h2>
        {workflows.length === 0 ? (
          <p className="text-gray-500">No workflows found.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {workflows.map(workflow => (
              <li key={workflow.id} className="py-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{workflow.title}</p>
                    <p className="text-sm text-gray-500">ID: {workflow.id}</p>
                    <p className="text-sm text-gray-500">
                      {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''} | Created: {new Date(workflow.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {testWorkflow?.id === workflow.id && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                      Test Workflow
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function StorageIntegrationTest() {
  return (
    <StorageProvider>
      <StorageIntegrationTestContent />
    </StorageProvider>
  );
} 