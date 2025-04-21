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
    const newStep = {
      id: `step-${Date.now()}`,
      title: `Step ${steps.length + 1}`,
      description: 'Click to edit this step',
      imageData: undefined
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
                
                <div className="pt-4">
                  <button 
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() => {
                      setSteps(steps.filter(s => s.id !== activeStepId));
                      setActiveStepId(null);
                    }}
                  >
                    Delete Step
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 