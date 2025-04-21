"use client";

import { useState } from 'react';
import Link from 'next/link';
import Timeline from '../../components/Timeline';

interface Step {
  id: string;
  title: string;
  description?: string;
  isActive?: boolean;
}

export default function WorkflowEditor() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  
  const addStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      title: `Step ${steps.length + 1}`,
      description: 'Click to edit this step'
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
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold">Workflow Editor</h1>
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            Back to Home
          </Link>
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
          </div>
          
          {/* Right panel - Step editor */}
          <div className="w-full md:w-2/3 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-6">
              {activeStepId 
                ? `Edit Step: ${steps.find(s => s.id === activeStepId)?.title}` 
                : 'Select a step to edit'}
            </h2>
            
            {!activeStepId ? (
              <div className="text-center py-12 text-gray-500">
                {steps.length === 0 
                  ? 'Add a step to begin editing' 
                  : 'Select a step from the timeline to edit its details'}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Step Title
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    value={steps.find(s => s.id === activeStepId)?.title || ''}
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
                    value={steps.find(s => s.id === activeStepId)?.description || ''}
                    onChange={(e) => {
                      setSteps(steps.map(step => 
                        step.id === activeStepId 
                          ? { ...step, description: e.target.value }
                          : step
                      ));
                    }}
                  />
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