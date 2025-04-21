"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Workflow, WorkflowStep, getWorkflows, deleteWorkflow } from '../../lib/storageService';

export default function WorkflowViewer() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Load workflows on mount
  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = () => {
    const loadedWorkflows = getWorkflows();
    setWorkflows(loadedWorkflows);
    
    // Select the first workflow if available
    if (loadedWorkflows.length > 0 && !selectedWorkflow) {
      setSelectedWorkflow(loadedWorkflows[0]);
      setCurrentStepIndex(0);
    }
  };

  const handleDeleteWorkflow = (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflow(id);
      
      // Update the UI
      const updatedWorkflows = workflows.filter(w => w.id !== id);
      setWorkflows(updatedWorkflows);
      
      // Reset selection if necessary
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(updatedWorkflows.length > 0 ? updatedWorkflows[0] : null);
        setCurrentStepIndex(0);
      }
    }
  };

  const handleWorkflowSelect = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setCurrentStepIndex(0);
  };

  const handleNextStep = () => {
    if (selectedWorkflow && currentStepIndex < selectedWorkflow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const currentStep = selectedWorkflow?.steps[currentStepIndex];
  
  // Get the count of steps with screenshots
  const getScreenshotCount = (workflow: Workflow) => {
    return workflow.steps.filter(step => step.imageData).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold">Workflow Viewer</h1>
          <div className="flex space-x-3">
            <Link href="/workflow-editor" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Create New Workflow
            </Link>
            <Link href="/" className="text-blue-500 hover:text-blue-700">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {workflows.length === 0 ? (
          <div className="text-center py-12 bg-white shadow rounded-lg">
            <h2 className="text-xl font-medium mb-4">No Workflows Found</h2>
            <p className="text-gray-500 mb-8">You haven't created any workflows yet.</p>
            <Link 
              href="/workflow-editor" 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Your First Workflow
            </Link>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Workflow List */}
            <div className="w-full md:w-1/3 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Your Workflows</h2>
              <div className="space-y-3">
                {workflows.map(workflow => {
                  const screenshotCount = getScreenshotCount(workflow);
                  
                  return (
                    <div 
                      key={workflow.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedWorkflow?.id === workflow.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleWorkflowSelect(workflow)}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{workflow.title}</h3>
                        <button 
                          className="text-gray-400 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorkflow(workflow.id);
                          }}
                          aria-label="Delete workflow"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center space-x-2">
                        <span>{workflow.steps.length} steps</span>
                        <span>•</span> 
                        <span className={`${screenshotCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {screenshotCount} screenshots
                        </span>
                        <span>•</span>
                        <span>Updated {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workflow Viewer */}
            <div className="w-full md:w-2/3 bg-white shadow rounded-lg p-6">
              {selectedWorkflow ? (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-lg font-medium">{selectedWorkflow.title}</h2>
                    <div className="text-sm text-gray-500">
                      Step {currentStepIndex + 1} of {selectedWorkflow.steps.length}
                    </div>
                  </div>

                  {selectedWorkflow.steps.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      This workflow has no steps.
                    </div>
                  ) : (
                    <div>
                      {/* Step indicators */}
                      <div className="flex mb-4 overflow-x-auto">
                        {selectedWorkflow.steps.map((step, index) => (
                          <button
                            key={step.id}
                            className={`flex-shrink-0 px-3 py-1 mr-2 rounded-full text-xs ${
                              index === currentStepIndex
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } ${
                              step.imageData ? 'ring-1 ring-green-500' : ''
                            }`}
                            onClick={() => setCurrentStepIndex(index)}
                          >
                            {step.imageData && (
                              <span className="mr-1">📷</span>
                            )}
                            {step.title || `Step ${index + 1}`}
                          </button>
                        ))}
                      </div>
                      
                      <div className="mb-6">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-medium">{currentStep?.title}</h3>
                        </div>
                        
                        {currentStep?.description && (
                          <p className="text-gray-600 mb-4">{currentStep.description}</p>
                        )}
                        
                        {currentStep?.imageData ? (
                          <div className="relative border rounded-lg overflow-hidden bg-gray-100" style={{ height: '300px' }}>
                            <Image 
                              src={currentStep.imageData} 
                              alt={currentStep.title}
                              fill
                              style={{ objectFit: 'contain' }}
                            />
                          </div>
                        ) : (
                          <div className="border rounded-lg bg-gray-100 p-6 text-center text-gray-500" style={{ height: '300px' }}>
                            No screenshot available for this step
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between mt-6">
                        <button 
                          onClick={handlePrevStep}
                          disabled={currentStepIndex === 0}
                          className={`px-4 py-2 rounded ${
                            currentStepIndex === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          Previous Step
                        </button>
                        <button 
                          onClick={handleNextStep}
                          disabled={currentStepIndex === selectedWorkflow.steps.length - 1}
                          className={`px-4 py-2 rounded ${
                            currentStepIndex === selectedWorkflow.steps.length - 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          Next Step
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Select a workflow to view its details.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 