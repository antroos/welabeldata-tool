import React from 'react';

interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  category?: string;
  prerequisiteSteps?: string[];
  dependentSteps?: string[];
  isActive?: boolean;
  imageData?: string;
}

interface TimelineProps {
  steps: TimelineStep[];
  onStepClick?: (id: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ steps, onStepClick }) => {
  if (steps.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No steps available</p>
      </div>
    );
  }

  // Helper function to get the category color
  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-200';
    switch (category.toLowerCase()) {
      case 'input': return 'bg-green-100 border-green-400';
      case 'navigation': return 'bg-blue-100 border-blue-400';
      case 'verification': return 'bg-purple-100 border-purple-400';
      case 'output': return 'bg-yellow-100 border-yellow-400';
      default: return 'bg-gray-100 border-gray-400';
    }
  };

  return (
    <div className="py-4">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-9 top-0 bottom-0 w-1 bg-gray-200" />
        
        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => {
            const hasPrerequisites = step.prerequisiteSteps && step.prerequisiteSteps.length > 0;
            const hasDependents = step.dependentSteps && step.dependentSteps.length > 0;
            const hasImage = !!step.imageData;
            const categoryColor = getCategoryColor(step.category);
            
            return (
              <div 
                key={step.id} 
                className={`relative flex items-start cursor-pointer ${
                  step.isActive ? 'opacity-100' : 'opacity-70 hover:opacity-90'
                }`}
                onClick={() => onStepClick && onStepClick(step.id)}
              >
                {/* Step circle */}
                <div 
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 z-10 ${
                    step.isActive 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                
                {/* Step content */}
                <div className="ml-4 flex-1">
                  <div className={`rounded px-3 py-2 border ${categoryColor}`}>
                    <div className="flex justify-between">
                      <h3 className={`text-md font-medium ${step.isActive ? 'text-blue-500' : 'text-gray-700'}`}>
                        {step.title}
                      </h3>
                      <div className="flex space-x-1">
                        {hasImage && (
                          <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                            📷
                          </span>
                        )}
                        {step.category && (
                          <span className="text-xs text-gray-500 px-1.5 py-0.5 rounded-full border">
                            {step.category}
                          </span>
                        )}
                      </div>
                    </div>
                    {step.description && (
                      <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                    )}
                    
                    {/* Relationships */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {hasPrerequisites && step.prerequisiteSteps && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded-sm">
                            Requires:
                          </span>
                          {step.prerequisiteSteps.map(prereqId => {
                            const prereqStep = steps.find(s => s.id === prereqId);
                            const prereqIndex = steps.findIndex(s => s.id === prereqId);
                            return (
                              <span key={prereqId} className="text-xs px-1 py-0.5 bg-gray-100 text-gray-700 rounded-sm">
                                {prereqIndex + 1}: {prereqStep?.title || 'Unknown'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      
                      {hasDependents && step.dependentSteps && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-xs px-1 py-0.5 bg-green-100 text-green-700 rounded-sm">
                            Leads to:
                          </span>
                          {step.dependentSteps.map(depId => {
                            const depStep = steps.find(s => s.id === depId);
                            const depIndex = steps.findIndex(s => s.id === depId);
                            return (
                              <span key={depId} className="text-xs px-1 py-0.5 bg-gray-100 text-gray-700 rounded-sm">
                                {depIndex + 1}: {depStep?.title || 'Unknown'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline; 