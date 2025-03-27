import { useState, useEffect } from "react";

type Step = {
  id: string;
  title: string;
};

type ProgressStepsProps = {
  steps: Step[];
  currentStep: string;
};

const ProgressSteps = ({ steps, currentStep }: ProgressStepsProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const index = steps.findIndex(step => step.id === currentStep);
    setCurrentStepIndex(index !== -1 ? index : 0);
  }, [currentStep, steps]);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <li key={step.id} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              {/* Line connecting steps */}
              {index !== steps.length - 1 && (
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div 
                    className={`h-0.5 w-full ${isComplete ? 'bg-primary' : 'bg-gray-200'}`}
                  ></div>
                </div>
              )}

              {/* Step indicator */}
              {isComplete ? (
                // Completed step
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="sr-only">{step.title}</span>
                </div>
              ) : isCurrent ? (
                // Current step
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white" aria-current="step">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true"></span>
                  <span className="sr-only">{step.title}</span>
                </div>
              ) : (
                // Upcoming step
                <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-transparent" aria-hidden="true"></span>
                  <span className="sr-only">{step.title}</span>
                </div>
              )}

              {/* Step label */}
              <span className={`absolute top-10 text-xs font-medium ${
                isCurrent ? 'text-primary' : isComplete ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default ProgressSteps;
