"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Timeline from '../../components/Timeline';
import ImageUploader from '../../components/ImageUploader';
import { useStorage } from '../../contexts/StorageContext';
import { Workflow, WorkflowStep } from '../../services/storage/WorkflowStorage';
import { 
  getPurposeSuggestion,
  getOutcomeSuggestion,
  getCategorySuggestion,
  getRelationshipSuggestions
} from '../../lib/annotationService';

interface Step {
  id: string;
  title: string;
  description?: string;
  imageData?: string;
  purpose?: string;        // Why this action is performed
  expectedOutcome?: string; // What should happen after this action
  prerequisiteSteps?: string[];  // IDs of steps that must be completed before this one
  dependentSteps?: string[];     // IDs of steps that depend on this one
  category?: string;             // Category or type of action (e.g., "input", "navigation", "verification")
  createdAt?: number;      // Creation timestamp
  updatedAt?: number;      // Last update timestamp
  isActive?: boolean;
}

export default function WorkflowEditor() {
  const { workflowStorage, isLoaded } = useStorage();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [aiLoading, setAiLoading] = useState<{
    purpose: boolean;
    outcome: boolean;
    category: boolean;
    relationships: boolean;
  }>({
    purpose: false,
    outcome: false,
    category: false,
    relationships: false
  });
  
  // Initialize with a new workflow on first load
  useEffect(() => {
    // Wait for storage to be loaded
    if (!isLoaded) return;
    
    setIsLoading(true);
    
    try {
      // Create a sample workflow for testing
      const newWorkflow = workflowStorage.createNewWorkflow('UI Annotation Workflow');
      setWorkflow(newWorkflow);
      setSteps([]);
    } catch (error) {
      console.error('Error loading workflow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, workflowStorage]);
  
  // Save workflow changes
  useEffect(() => {
    if (workflow && !isLoading && isLoaded) {
      // Convert steps to WorkflowStep format
      const workflowSteps: WorkflowStep[] = steps.map(step => ({
        id: step.id,
        title: step.title,
        description: step.description,
        imageData: step.imageData,
        purpose: step.purpose,
        expectedOutcome: step.expectedOutcome,
        prerequisiteSteps: step.prerequisiteSteps,
        dependentSteps: step.dependentSteps,
        category: step.category,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));
      
      // Update and save the workflow
      const updatedWorkflow = {
        ...workflow,
        steps: workflowSteps,
        updatedAt: Date.now()
      };
      
      workflowStorage.saveWorkflow(updatedWorkflow);
    }
  }, [workflow, steps, isLoading, isLoaded, workflowStorage]);
  
  const addStep = () => {
    const now = Date.now();
    const newStep = {
      id: `step-${now}`,
      title: `Step ${steps.length + 1}`,
      description: 'Click to edit this step',
      imageData: undefined,
      purpose: '',
      expectedOutcome: '',
      prerequisiteSteps: [],
      dependentSteps: [],
      category: '',
      createdAt: now,
      updatedAt: now
    };
    
    setSteps([...steps, newStep]);
    setActiveStepId(newStep.id);
  };
  
  const handleStepClick = (id: string) => {
    setActiveStepId(id);
  };
  
  const getTimelineSteps = () => {
    return steps.map(step => ({
      ...step,
      isActive: step.id === activeStepId
    }));
  };
  
  const handleImageChange = (imageData: string | null) => {
    if (!activeStepId) return;
    
    // Only update the image for the active step
    setSteps(steps.map(step => 
      step.id === activeStepId 
        ? { ...step, imageData: imageData || undefined }
        : step
    ));
  };
  
  const handleExport = () => {
    if (workflow) {
      const dataStr = JSON.stringify(workflow, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileName = `${workflow.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
    }
  };
  
  // Get the active step
  const activeStep = activeStepId 
    ? steps.find(step => step.id === activeStepId) 
    : null;
  
  // Get the count of steps with purpose defined
  const getStepsWithPurpose = () => {
    return steps.filter(s => s.purpose && s.purpose.trim() !== '').length;
  };
  
  // Get the count of steps with relationships defined
  const getStepsWithRelationships = () => {
    return steps.filter(s => 
      (s.prerequisiteSteps && s.prerequisiteSteps.length > 0) || 
      (s.dependentSteps && s.dependentSteps.length > 0)
    ).length;
  };
  
  // Available step categories
  const stepCategories = [
    { id: 'input', name: 'Input' },
    { id: 'navigation', name: 'Navigation' },
    { id: 'verification', name: 'Verification' },
    { id: 'output', name: 'Output' },
    { id: 'other', name: 'Other' }
  ];
  
  // Request AI suggestion for purpose
  const handleRequestPurposeSuggestion = async () => {
    if (!activeStepId || !activeStep) return;
    
    setAiLoading(prev => ({ ...prev, purpose: true }));
    
    try {
      const imageFile = activeStep.imageData ? 
        dataURLtoFile(activeStep.imageData, `step-${activeStepId}.png`) : 
        undefined;
      
      const suggestion = await getPurposeSuggestion(activeStep, imageFile);
      
      if (suggestion) {
        setSteps(steps.map(step => 
          step.id === activeStepId 
            ? { ...step, purpose: suggestion }
            : step
        ));
      }
    } catch (error) {
      console.error('Error getting purpose suggestion:', error);
    } finally {
      setAiLoading(prev => ({ ...prev, purpose: false }));
    }
  };
  
  // Request AI suggestion for expected outcome
  const handleRequestOutcomeSuggestion = async () => {
    if (!activeStepId || !activeStep) return;
    
    setAiLoading(prev => ({ ...prev, outcome: true }));
    
    try {
      const imageFile = activeStep.imageData ? 
        dataURLtoFile(activeStep.imageData, `step-${activeStepId}.png`) : 
        undefined;
      
      const suggestion = await getOutcomeSuggestion(activeStep, imageFile);
      
      if (suggestion) {
        setSteps(steps.map(step => 
          step.id === activeStepId 
            ? { ...step, expectedOutcome: suggestion }
            : step
        ));
      }
    } catch (error) {
      console.error('Error getting outcome suggestion:', error);
    } finally {
      setAiLoading(prev => ({ ...prev, outcome: false }));
    }
  };
  
  // Request AI suggestion for category
  const handleRequestCategorySuggestion = async () => {
    if (!activeStepId || !activeStep) return;
    
    setAiLoading(prev => ({ ...prev, category: true }));
    
    try {
      const imageFile = activeStep.imageData ? 
        dataURLtoFile(activeStep.imageData, `step-${activeStepId}.png`) : 
        undefined;
      
      const suggestion = await getCategorySuggestion(activeStep, imageFile);
      
      if (suggestion) {
        setSteps(steps.map(step => 
          step.id === activeStepId 
            ? { ...step, category: suggestion }
            : step
        ));
      }
    } catch (error) {
      console.error('Error getting category suggestion:', error);
    } finally {
      setAiLoading(prev => ({ ...prev, category: false }));
    }
  };
  
  // Request AI suggestion for relationships
  const handleRequestRelationshipSuggestions = async () => {
    if (!activeStepId || !activeStep) return;
    
    setAiLoading(prev => ({ ...prev, relationships: true }));
    
    try {
      // Prepare step data with all other steps for context
      const stepDataWithContext = {
        ...activeStep,
        allSteps: steps.map((step, index) => ({
          id: step.id,
          title: step.title,
          description: step.description,
          purpose: step.purpose,
          index
        }))
      };
      
      const suggestions = await getRelationshipSuggestions(stepDataWithContext);
      
      if (suggestions && (suggestions.prerequisites.length > 0 || suggestions.dependents.length > 0)) {
        // Get IDs from indexes
        const prerequisiteIds = suggestions.prerequisites
          .map(index => {
            const step = steps.find((_, i) => i === index - 1);
            return step?.id;
          })
          .filter(id => id !== undefined) as string[];
        
        const dependentIds = suggestions.dependents
          .map(index => {
            const step = steps.find((_, i) => i === index - 1);
            return step?.id;
          })
          .filter(id => id !== undefined) as string[];
        
        // Update the active step
        setSteps(prevSteps => {
          const updatedSteps = [...prevSteps];
          
          // Update active step with suggested relationships
          const activeStepIndex = updatedSteps.findIndex(s => s.id === activeStepId);
          if (activeStepIndex >= 0) {
            updatedSteps[activeStepIndex] = {
              ...updatedSteps[activeStepIndex],
              prerequisiteSteps: prerequisiteIds
            };
          }
          
          // Update dependent steps automatically
          dependentIds.forEach(dependentId => {
            const dependentIndex = updatedSteps.findIndex(s => s.id === dependentId);
            if (dependentIndex >= 0) {
              const currentPrereqs = updatedSteps[dependentIndex].prerequisiteSteps || [];
              if (!currentPrereqs.includes(activeStepId)) {
                updatedSteps[dependentIndex] = {
                  ...updatedSteps[dependentIndex],
                  prerequisiteSteps: [...currentPrereqs, activeStepId]
                };
              }
            }
          });
          
          // Update prerequisite steps automatically
          prerequisiteIds.forEach(prereqId => {
            const prereqIndex = updatedSteps.findIndex(s => s.id === prereqId);
            if (prereqIndex >= 0) {
              const currentDependents = updatedSteps[prereqIndex].dependentSteps || [];
              if (!currentDependents.includes(activeStepId)) {
                updatedSteps[prereqIndex] = {
                  ...updatedSteps[prereqIndex],
                  dependentSteps: [...currentDependents, activeStepId]
                };
              }
            }
          });
          
          return updatedSteps;
        });
      }
    } catch (error) {
      console.error('Error getting relationship suggestions:', error);
    } finally {
      setAiLoading(prev => ({ ...prev, relationships: false }));
    }
  };
  
  // Helper function to convert data URL to File
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  };
  
  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading workflow...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Workflow Editor</h1>
            {workflow && (
              <span className="ml-4 text-gray-500">
                {workflow.title}
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <Link href="/workflow-viewer" className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
              View Workflows
            </Link>
            <button 
              onClick={handleExport}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
            >
              Export Workflow
            </button>
            <Link href="/" className="text-blue-500 hover:text-blue-700">
              Back to Home
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left sidebar - Timeline */}
          <div className="w-full md:w-1/3 bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">Workflow Timeline</h2>
              <button 
                onClick={addStep} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Step
              </button>
            </div>
            
            <Timeline steps={getTimelineSteps()} onStepClick={handleStepClick} />
            
            {steps.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No steps yet. Click "Add Step" to start building your workflow.</p>
              </div>
            )}
            
            {/* Step Information Summary */}
            {steps.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">WORKFLOW SUMMARY</h3>
                <p className="text-sm text-gray-600">
                  {steps.length} step{steps.length !== 1 ? 's' : ''} defined
                </p>
                <p className="text-sm text-gray-600">
                  {steps.filter(s => s.imageData).length} step{steps.filter(s => s.imageData).length !== 1 ? 's' : ''} with screenshots
                </p>
                <p className="text-sm text-gray-600">
                  {getStepsWithPurpose()} step{getStepsWithPurpose() !== 1 ? 's' : ''} with purpose defined
                </p>
                <p className="text-sm text-gray-600">
                  {getStepsWithRelationships()} step{getStepsWithRelationships() !== 1 ? 's' : ''} with relationships
                </p>
              </div>
            )}
          </div>
          
          {/* Right panel - Step editor */}
          <div className="w-full md:w-2/3 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-6">
              {activeStepId 
                ? `Edit Step: ${activeStep?.title}` 
                : 'Select a step to edit'}
            </h2>
            
            {!activeStepId ? (
              <div className="text-center py-12 text-gray-500">
                {steps.length === 0 
                  ? 'Add a step to begin editing' 
                  : 'Select a step from the timeline to edit its details'}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Title
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                      value={activeStep?.title || ''}
                      onChange={(e) => {
                        setSteps(steps.map(step => 
                          step.id === activeStepId 
                            ? { ...step, title: e.target.value }
                            : step
                        ));
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                      rows={3}
                      value={activeStep?.description || ''}
                      onChange={(e) => {
                        setSteps(steps.map(step => 
                          step.id === activeStepId 
                            ? { ...step, description: e.target.value }
                            : step
                        ));
                      }}
                    />
                  </div>
                </div>
                
                {/* Context Information Section */}
                <div className="border-t pt-6">
                  <h3 className="text-md font-medium text-gray-700 mb-4">Context Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Step Category
                      </label>
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                          value={activeStep?.category || ''}
                          onChange={(e) => {
                            setSteps(steps.map(step => 
                              step.id === activeStepId 
                                ? { ...step, category: e.target.value }
                                : step
                            ));
                          }}
                        >
                          <option value="">Select a category</option>
                          {stepCategories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className={`flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-blue-50 hover:bg-blue-100 text-blue-600 ${aiLoading.category ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={handleRequestCategorySuggestion}
                          disabled={aiLoading.category}
                          title="Get AI suggestion for category"
                        >
                          {aiLoading.category ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Categorize this step based on the type of action being performed
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purpose <span className="text-xs text-gray-500">(Why this action is performed)</span>
                      </label>
                      <div className="flex gap-2">
                        <textarea 
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                          rows={2}
                          placeholder="Example: To submit user credentials for authentication"
                          value={activeStep?.purpose || ''}
                          onChange={(e) => {
                            setSteps(steps.map(step => 
                              step.id === activeStepId 
                                ? { ...step, purpose: e.target.value }
                                : step
                            ));
                          }}
                        />
                        <button
                          className={`flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-blue-50 hover:bg-blue-100 text-blue-600 ${aiLoading.purpose ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={handleRequestPurposeSuggestion}
                          disabled={aiLoading.purpose}
                          title="Get AI suggestion for purpose"
                        >
                          {aiLoading.purpose ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Outcome <span className="text-xs text-gray-500">(What should happen after this action)</span>
                      </label>
                      <div className="flex gap-2">
                        <textarea 
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                          rows={2}
                          placeholder="Example: User is logged in and redirected to dashboard page"
                          value={activeStep?.expectedOutcome || ''}
                          onChange={(e) => {
                            setSteps(steps.map(step => 
                              step.id === activeStepId 
                                ? { ...step, expectedOutcome: e.target.value }
                                : step
                            ));
                          }}
                        />
                        <button
                          className={`flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-blue-50 hover:bg-blue-100 text-blue-600 ${aiLoading.outcome ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={handleRequestOutcomeSuggestion}
                          disabled={aiLoading.outcome}
                          title="Get AI suggestion for expected outcome"
                        >
                          {aiLoading.outcome ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Step Relationships Section */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium text-gray-700">Step Relationships</h3>
                    <button
                      className={`flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm bg-blue-50 hover:bg-blue-100 text-blue-600 ${aiLoading.relationships ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={handleRequestRelationshipSuggestions}
                      disabled={aiLoading.relationships}
                      title="Get AI suggestion for relationships"
                    >
                      {aiLoading.relationships ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                      <span>AI Suggest Relationships</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Prerequisites */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prerequisite Steps <span className="text-xs text-gray-500">(Steps that must be completed before this one)</span>
                      </label>
                      <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                        {steps.length <= 1 ? (
                          <p className="text-sm text-gray-500">No other steps available to select as prerequisites</p>
                        ) : (
                          <div className="space-y-2">
                            {steps.filter(s => s.id !== activeStepId).map(step => (
                              <div key={step.id} className="flex items-center">
                                <input 
                                  type="checkbox" 
                                  id={`prereq-${step.id}`}
                                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                  checked={activeStep?.prerequisiteSteps?.includes(step.id) || false}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    
                                    setSteps(steps.map(s => {
                                      if (s.id !== activeStepId) return s;
                                      
                                      // Update prerequisiteSteps based on checkbox
                                      const currentPrereqs = s.prerequisiteSteps || [];
                                      let newPrereqs = [...currentPrereqs];
                                      
                                      if (isChecked && !newPrereqs.includes(step.id)) {
                                        newPrereqs.push(step.id);
                                      } else if (!isChecked) {
                                        newPrereqs = newPrereqs.filter(id => id !== step.id);
                                      }
                                      
                                      // Also update the dependent step automatically
                                      const targetStep = steps.find(ts => ts.id === step.id);
                                      if (targetStep) {
                                        const targetDeps = targetStep.dependentSteps || [];
                                        
                                        if (isChecked && !targetDeps.includes(activeStepId)) {
                                          // Add current step as dependent to the prerequisite step
                                          setSteps(prev => prev.map(ps => 
                                            ps.id === step.id
                                              ? { 
                                                  ...ps, 
                                                  dependentSteps: [...(ps.dependentSteps || []), activeStepId] 
                                                }
                                              : ps
                                          ));
                                        } else if (!isChecked) {
                                          // Remove current step as dependent from the prerequisite step
                                          setSteps(prev => prev.map(ps => 
                                            ps.id === step.id
                                              ? { 
                                                  ...ps, 
                                                  dependentSteps: (ps.dependentSteps || []).filter(id => id !== activeStepId)
                                                }
                                              : ps
                                          ));
                                        }
                                      }
                                      
                                      return { ...s, prerequisiteSteps: newPrereqs };
                                    }));
                                  }}
                                />
                                <label htmlFor={`prereq-${step.id}`} className="ml-2 text-sm text-gray-700">
                                  {step.title}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Select steps that must be completed before this step can be performed
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Screenshot Section */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Screenshot for "{activeStep?.title}"
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ImageUploader
                      key={activeStepId} // Force re-render when step changes
                      initialImage={activeStep?.imageData}
                      onImageChange={handleImageChange}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {activeStep?.imageData 
                        ? "Screenshot will only be associated with this step." 
                        : "Upload a screenshot that represents this specific step."}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t flex justify-between">
                  <button 
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() => {
                      setSteps(steps.filter(s => s.id !== activeStepId));
                      setActiveStepId(null);
                    }}
                  >
                    Delete Step
                  </button>
                  
                  <div className="text-xs text-gray-500 italic self-center">
                    {activeStep?.updatedAt 
                      ? `Last updated: ${new Date(activeStep.updatedAt).toLocaleString()}` 
                      : 'New step'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 