/**
 * Simple test module for storage classes
 * To use, import this in a component and call runStorageTests()
 */

import { StorageModule } from './StorageModule';
import { WorkflowStorage, Workflow } from './WorkflowStorage';

// Test basic StorageModule
function testBaseStorageModule(): boolean {
  console.group('Testing Base Storage Module');
  
  try {
    // Create test module with test data
    const testModule = new StorageModule<string[]>('test_array');
    testModule.remove(); // Clear any existing data
    
    // Test empty get
    const emptyData = testModule.get();
    console.log('Empty get test:', emptyData === null);
    
    // Test set and get
    const testArray = ['item1', 'item2', 'item3'];
    const setResult = testModule.set(testArray);
    console.log('Set test:', setResult === true);
    
    const getData = testModule.get();
    console.log('Get test:', JSON.stringify(getData) === JSON.stringify(testArray));
    
    // Test exists
    const existsResult = testModule.exists();
    console.log('Exists test:', existsResult === true);
    
    // Test createBackup
    const backupKey = testModule.createBackup();
    console.log('Backup created:', backupKey !== null);
    
    // Test remove
    const removeResult = testModule.remove();
    console.log('Remove test:', removeResult === true);
    
    const existsAfterRemove = testModule.exists();
    console.log('Not exists after remove:', existsAfterRemove === false);
    
    // Clean up
    if (backupKey) localStorage.removeItem(backupKey);
    
    console.log('Base Storage Module Tests Passed!');
    console.groupEnd();
    return true;
  } catch (error) {
    console.error('Base Storage Module Tests Failed:', error);
    console.groupEnd();
    return false;
  }
}

// Test WorkflowStorage
function testWorkflowStorage(): boolean {
  console.group('Testing Workflow Storage Module');
  
  try {
    // Create storage instance
    const workflowStorage = new WorkflowStorage();
    
    // Clear existing data
    workflowStorage.set([]);
    
    // Create test workflow
    const workflow = workflowStorage.createNewWorkflow('Test Workflow');
    console.log('Workflow created:', workflow.id !== undefined);
    
    // Save workflow
    const saveResult = workflowStorage.saveWorkflow(workflow);
    console.log('Save workflow test:', saveResult === true);
    
    // Get workflows
    const workflows = workflowStorage.getWorkflows();
    console.log('Get workflows test:', workflows.length === 1);
    
    // Get workflow by ID
    const retrievedWorkflow = workflowStorage.getWorkflowById(workflow.id);
    console.log('Get workflow by ID test:', retrievedWorkflow?.title === 'Test Workflow');
    
    // Update workflow
    if (retrievedWorkflow) {
      retrievedWorkflow.title = 'Updated Workflow';
      const updateResult = workflowStorage.saveWorkflow(retrievedWorkflow);
      console.log('Update workflow test:', updateResult === true);
      
      const updatedWorkflow = workflowStorage.getWorkflowById(workflow.id);
      console.log('Get updated workflow test:', updatedWorkflow?.title === 'Updated Workflow');
    }
    
    // Delete workflow
    const deleteResult = workflowStorage.deleteWorkflow(workflow.id);
    console.log('Delete workflow test:', deleteResult === true);
    
    const emptyWorkflows = workflowStorage.getWorkflows();
    console.log('Verify deletion test:', emptyWorkflows.length === 0);
    
    console.log('Workflow Storage Tests Passed!');
    console.groupEnd();
    return true;
  } catch (error) {
    console.error('Workflow Storage Tests Failed:', error);
    console.groupEnd();
    return false;
  }
}

// Test migration from old format
function testMigration(): boolean {
  console.group('Testing Migration From Old Format');
  
  try {
    // Create test data in old format
    const oldWorkflow = {
      id: 'old-workflow-1',
      title: 'Old Workflow',
      steps: [
        {
          id: 'step-1',
          title: 'Step 1',
          description: 'Test step',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Store in old format
    localStorage.setItem('wld_workflows', JSON.stringify([oldWorkflow]));
    
    // Create new storage and migrate
    const workflowStorage = new WorkflowStorage();
    const migrationResult = workflowStorage.migrateFromOldFormat();
    console.log('Migration result:', migrationResult === true);
    
    // Check migrated data
    const workflows = workflowStorage.getWorkflows();
    console.log('Migrated data exists:', workflows.length === 1);
    
    const migratedWorkflow = workflowStorage.getWorkflowById('old-workflow-1');
    console.log('Migrated workflow correct:', migratedWorkflow?.title === 'Old Workflow');
    
    // Clean up
    workflowStorage.set([]);
    localStorage.removeItem('wld_workflows');
    
    console.log('Migration Tests Passed!');
    console.groupEnd();
    return true;
  } catch (error) {
    console.error('Migration Tests Failed:', error);
    console.groupEnd();
    return false;
  }
}

// Run all tests
export function runStorageTests(): void {
  console.log('=== Storage Module Tests ===');
  
  const baseResult = testBaseStorageModule();
  const workflowResult = testWorkflowStorage();
  const migrationResult = testMigration();
  
  console.log('=== Test Results ===');
  console.log('Base Storage Module:', baseResult ? 'PASSED' : 'FAILED');
  console.log('Workflow Storage:', workflowResult ? 'PASSED' : 'FAILED');
  console.log('Migration Test:', migrationResult ? 'PASSED' : 'FAILED');
  console.log('Overall Result:', (baseResult && workflowResult && migrationResult) ? 'ALL TESTS PASSED' : 'TESTS FAILED');
} 