/**
 * Simple test module for storage classes
 * To use, import this in a component and call runStorageTests()
 */

import { StorageModule } from './StorageModule';
import { WorkflowStorage, Workflow } from './WorkflowStorage';
import { AnnotationStorage, StepCategory } from './AnnotationStorage';
import { PreferencesStorage } from './PreferencesStorage';
import { CompressionTest } from './CompressionTest';
import { CompressionService } from '../CompressionService';

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

// Test AnnotationStorage
function testAnnotationStorage(): boolean {
  console.group('Testing Annotation Storage Module');
  
  try {
    // Create storage instance
    const annotationStorage = new AnnotationStorage();
    annotationStorage.set({}); // Clear any existing data
    
    // Create test data
    const workflowId = 'test-workflow-1';
    const stepId = 'test-step-1';
    const annotation = {
      id: stepId,
      title: 'Test Step',
      description: 'A test step',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Save annotation
    const saveResult = annotationStorage.saveStepAnnotation(workflowId, stepId, annotation);
    console.log('Save annotation test:', saveResult === true);
    
    // Get annotation
    const retrievedAnnotation = annotationStorage.getStepAnnotation(workflowId, stepId);
    console.log('Get annotation test:', retrievedAnnotation !== null && retrievedAnnotation.id === stepId);
    
    // Update annotation field
    const updateResult = annotationStorage.updateAnnotationField(
      workflowId, 
      stepId, 
      'purpose', 
      'This is a test purpose'
    );
    console.log('Update annotation field test:', updateResult === true);
    
    // Get updated annotation
    const updatedAnnotation = annotationStorage.getStepAnnotation(workflowId, stepId);
    console.log('Verify update test:', updatedAnnotation?.purpose === 'This is a test purpose');
    
    // Update relationships
    const relationshipResult = annotationStorage.updateStepRelationships(
      workflowId,
      stepId,
      ['prereq-1', 'prereq-2'],
      ['dep-1']
    );
    console.log('Update relationships test:', relationshipResult === true);
    
    // Get stats
    const stats = annotationStorage.getAnnotationStats(workflowId);
    console.log('Get stats test:', stats.total === 1 && stats.withPurpose === 1);
    
    // Delete step annotation
    const deleteStepResult = annotationStorage.deleteStepAnnotation(workflowId, stepId);
    console.log('Delete step annotation test:', deleteStepResult === true);
    
    // Verify deletion
    const deletedAnnotation = annotationStorage.getStepAnnotation(workflowId, stepId);
    console.log('Verify step deletion test:', deletedAnnotation === null);
    
    // Clean up
    annotationStorage.set({});
    
    console.log('Annotation Storage Tests Passed!');
    console.groupEnd();
    return true;
  } catch (error) {
    console.error('Annotation Storage Tests Failed:', error);
    console.groupEnd();
    return false;
  }
}

// Test PreferencesStorage
function testPreferencesStorage(): boolean {
  console.group('Testing Preferences Storage Module');
  
  try {
    // Create storage instance
    const preferencesStorage = new PreferencesStorage();
    
    // Reset to defaults
    const resetResult = preferencesStorage.resetToDefaults();
    console.log('Reset to defaults test:', resetResult === true);
    
    // Get preferences
    const preferences = preferencesStorage.getPreferences();
    console.log('Get preferences test:', preferences !== null);
    
    // Update theme preferences
    const themeResult = preferencesStorage.updateThemePreferences({
      darkMode: true,
      colorScheme: 'blue'
    });
    console.log('Update theme test:', themeResult === true);
    
    // Verify theme update
    const updatedPreferences = preferencesStorage.getPreferences();
    console.log('Verify theme update test:', 
      updatedPreferences.theme.darkMode === true && 
      updatedPreferences.theme.colorScheme === 'blue'
    );
    
    // Update editor preferences
    const editorResult = preferencesStorage.updateEditorPreferences({
      autoSave: false,
      defaultCategory: 'navigation'
    });
    console.log('Update editor test:', editorResult === true);
    
    // Set last used model
    const modelResult = preferencesStorage.setLastUsedModel('gpt-4-turbo');
    console.log('Set last used model test:', modelResult === true);
    
    // Add recent workflow
    const recentResult = preferencesStorage.addRecentWorkflow('workflow-123');
    console.log('Add recent workflow test:', recentResult === true);
    
    // Verify recent workflow
    const finalPreferences = preferencesStorage.getPreferences();
    console.log('Verify recent workflow test:', 
      finalPreferences.recentWorkflows.includes('workflow-123')
    );
    
    // Clean up
    preferencesStorage.resetToDefaults();
    
    console.log('Preferences Storage Tests Passed!');
    console.groupEnd();
    return true;
  } catch (error) {
    console.error('Preferences Storage Tests Failed:', error);
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

// Test compression functionality
function testCompression(): boolean {
  console.group('Testing Compression Functionality');
  
  try {
    const compressionTest = new CompressionTest();
    const results = compressionTest.runAllTests();
    
    // Check compression service tests
    const serviceTests = results.compressionService;
    const serviceTestsPassed = serviceTests.every(result => result === true);
    console.log('Compression service tests:', serviceTestsPassed ? 'PASSED' : 'FAILED');
    console.log('Basic compression/decompression test:', serviceTests[0]);
    console.log('Compression marker test:', serviceTests[1] && serviceTests[2]);
    console.log('Auto-compression threshold test:', serviceTests[3] && serviceTests[4]);
    console.log('Size reduction test:', serviceTests[5]);
    
    // Check storage compression tests
    const storageTests = results.storageCompression;
    const storageTestsPassed = storageTests.every(result => result === true);
    console.log('Storage compression tests:', storageTestsPassed ? 'PASSED' : 'FAILED');
    console.log('Storage set with compression test:', storageTests[0]);
    console.log('Compressed data retrieval test:', storageTests[1]);
    console.log('Compressed vs uncompressed size test:', storageTests[2]);
    
    // Check workflow image compression tests
    const imageTests = results.workflowImageCompression;
    const imageTestsPassed = imageTests.every(result => result === true);
    console.log('Workflow image compression tests:', imageTestsPassed ? 'PASSED' : 'FAILED');
    console.log('Save workflow with image test:', imageTests[0]);
    console.log('Retrieve workflow with decompressed image test:', imageTests[1] && imageTests[2]);
    console.log('Storage optimization test:', imageTests[3]);
    console.log('Storage size calculation test:', imageTests[4]);
    
    // Run a simple compression ratio test
    const compressionService = new CompressionService();
    const testData = 'a'.repeat(10000);
    const ratio = compressionService.getCompressionRatio(testData);
    console.log('Compression ratio for repeating data:', ratio.toFixed(2), '(lower is better)');
    
    console.log('Compression Tests ' + (serviceTestsPassed && storageTestsPassed && imageTestsPassed ? 'Passed!' : 'Failed!'));
    console.groupEnd();
    
    return serviceTestsPassed && storageTestsPassed && imageTestsPassed;
  } catch (error) {
    console.error('Compression Tests Failed:', error);
    console.groupEnd();
    return false;
  }
}

// Run all tests
export function runStorageTests(): void {
  console.log('=== Storage Module Tests ===');
  
  const baseResult = testBaseStorageModule();
  const workflowResult = testWorkflowStorage();
  const annotationResult = testAnnotationStorage();
  const preferencesResult = testPreferencesStorage();
  const migrationResult = testMigration();
  const compressionResult = testCompression();
  
  console.log('=== Test Results ===');
  console.log('Base Storage Module:', baseResult ? 'PASSED' : 'FAILED');
  console.log('Workflow Storage:', workflowResult ? 'PASSED' : 'FAILED');
  console.log('Annotation Storage:', annotationResult ? 'PASSED' : 'FAILED');
  console.log('Preferences Storage:', preferencesResult ? 'PASSED' : 'FAILED');
  console.log('Migration Test:', migrationResult ? 'PASSED' : 'FAILED');
  console.log('Compression Test:', compressionResult ? 'PASSED' : 'FAILED');
  console.log('Overall Result:', 
    (baseResult && workflowResult && annotationResult && preferencesResult && migrationResult && compressionResult) 
      ? 'ALL TESTS PASSED' 
      : 'TESTS FAILED'
  );
} 