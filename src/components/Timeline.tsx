import React from 'react';

interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  isActive?: boolean;
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

  return (
    <div className="py-4">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-9 top-0 bottom-0 w-1 bg-gray-200" />
        
        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => (
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
              <div className="ml-4">
                <h3 className={`text-md font-medium ${step.isActive ? 'text-blue-500' : 'text-gray-700'}`}>
                  {step.title}
                </h3>
                {step.description && (
                  <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timeline; 