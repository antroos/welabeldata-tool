"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Timeline from '../../components/Timeline';
import ImageUploader from '../../components/ImageUploader';
import { 
  Workflow, 
  WorkflowStep, 
  saveWorkflow, 
  getWorkflowById, 
  createNewWorkflow, 
  exportWorkflow 
} from '../../lib/storageService';

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
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Initialize with a new workflow on first load
  useEffect(() => {
    // In a real app, we'd get the workflow ID from the URL
    // For MVP we'll create a new workflow if none exists
    setIsLoading(true);
    
    try {
      // Create a sample workflow for testing
      const newWorkflow = createNewWorkflow('UI Annotation Workflow');
      setWorkflow(newWorkflow);
      setSteps([]);
    } catch (error) {
      console.error('Error loading workflow:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Save workflow changes
  useEffect(() => {
    if (workflow && !isLoading) {
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
      
      saveWorkflow(updatedWorkflow);
    }
  }, [workflow, steps, isLoading]);
  
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
      exportWorkflow(workflow.id);
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
  
  if (isLoading) {
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
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
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
                      <p className="text-xs text-gray-500 mt-1">
                        Categorize this step based on the type of action being performed
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purpose <span className="text-xs text-gray-500">(Why this action is performed)</span>
                      </label>
                      <textarea 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
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
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Outcome <span className="text-xs text-gray-500">(What should happen after this action)</span>
                      </label>
                      <textarea 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
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
                    </div>
                  </div>
                </div>
                
                {/* Step Relationships Section */}
                <div className="border-t pt-6">
                  <h3 className="text-md font-medium text-gray-700 mb-4">Step Relationships</h3>
                  
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