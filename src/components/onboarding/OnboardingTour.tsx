'use client';

import * as React from 'react';
import { Button } from '@/components/ui';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TourStep_t {
  target: string; // CSS selector for the target element
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep_t[] = [
  {
    target: '[data-tour="connect-button"]',
    title: '1. Connect to a Database',
    description: 'Start by connecting to your database. Try the demo database for a quick start!',
    position: 'bottom',
  },
  {
    target: '[data-tour="query-input"]',
    title: '2. Ask a Question',
    description: 'Type your question in plain English. No SQL knowledge required!',
    position: 'bottom',
  },
  {
    target: '[data-tour="sql-editor"]',
    title: '3. Review & Edit SQL',
    description: 'The AI generates SQL for you. You can edit it if needed.',
    position: 'top',
  },
  {
    target: '[data-tour="execute-button"]',
    title: '4. Execute Query',
    description: 'Run your query and see the results instantly.',
    position: 'top',
  },
  {
    target: '[data-tour="schema-explorer"]',
    title: '5. Explore Your Schema',
    description: 'View all tables, columns, and data types. Click column names to copy!',
    position: 'right',
  },
];

const STORAGE_KEY = 'talktodata-onboarding-completed';

interface OnboardingTourProps {
  onComplete?: () => void;
  forceOpen?: boolean;
  onForceOpenChange?: (open: boolean) => void;
}

export function OnboardingTour({ onComplete, forceOpen, onForceOpenChange }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);

  // Check if user has completed onboarding (only on initial load)
  React.useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay to let the page render
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle forceOpen prop
  React.useEffect(() => {
    if (forceOpen) {
      setCurrentStep(0);
      setIsOpen(true);
    }
  }, [forceOpen]);

  // Get available steps (only those with visible target elements)
  const getAvailableSteps = React.useCallback(() => {
    return TOUR_STEPS.filter((step) => {
      const element = document.querySelector(step.target);
      return element !== null;
    });
  }, []);

  const [availableSteps, setAvailableSteps] = React.useState<TourStep_t[]>([]);

  // Update available steps when tour opens or DOM changes
  React.useEffect(() => {
    if (!isOpen) return;

    const updateAvailableSteps = () => {
      const steps = getAvailableSteps();
      setAvailableSteps(steps);

      // If current step is beyond available steps, reset to 0
      if (currentStep >= steps.length) {
        setCurrentStep(0);
      }
    };

    updateAvailableSteps();

    // Also update on DOM changes (e.g., when SQL editor appears)
    const observer = new MutationObserver(updateAvailableSteps);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [isOpen, getAvailableSteps, currentStep]);

  // Update target element position
  React.useEffect(() => {
    if (!isOpen || availableSteps.length === 0) return;

    const updatePosition = () => {
      const step = availableSteps[currentStep];
      if (!step) return;

      const element = document.querySelector(step.target);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, currentStep, availableSteps]);

  const handleNext = () => {
    if (currentStep < availableSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    onForceOpenChange?.(false);
    onComplete?.();
  };

  if (!isOpen || availableSteps.length === 0) return null;

  const step = availableSteps[currentStep];
  const isLastStep = currentStep === availableSteps.length - 1;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { opacity: 0 };

    const padding = 12;
    const tooltipWidth = 320;
    const tooltipHeight = 180;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        break;
    }

    // Keep tooltip within viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

    return { top, left, width: tooltipWidth };
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/50" onClick={handleSkip} />

      {/* Spotlight cutout */}
      {targetRect && (
        <div
          className="fixed z-[9999] rounded-lg ring-4 ring-amber-400 ring-offset-4 ring-offset-transparent pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[10000] rounded-lg border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        style={getTooltipStyle()}
      >
        <button
          onClick={handleSkip}
          className="absolute right-2 top-2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">
            {step.title}
          </h3>
        </div>

        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          {step.description}
        </p>

        {/* Progress dots */}
        <div className="mb-4 flex justify-center gap-1.5">
          {availableSteps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                index === currentStep
                  ? 'bg-amber-500'
                  : index < currentStep
                    ? 'bg-amber-300 dark:bg-amber-700'
                    : 'bg-neutral-200 dark:bg-neutral-700'
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-neutral-500"
          >
            Skip tour
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function useOnboardingTour() {
  const restartTour = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };
  return { restartTour };
}

