import { StorageModule, StorageOptions } from './StorageModule';
import { WorkflowStep } from './WorkflowStorage';

/**
 * Interface for annotation statistics
 */
export interface AnnotationStats {
  total: number;
  withPurpose: number;
  withOutcome: number;
  withCategory: number;
  withRelationships: number;
  completeness: number;
}

/**
 * Enum for step categories
 */
export enum StepCategory {
  INPUT = 'input',
  NAVIGATION = 'navigation',
  VERIFICATION = 'verification',
  OUTPUT = 'output'
}

/**
 * Interface for annotation suggestions
 */
export interface AnnotationSuggestion {
  type: 'purpose' | 'outcome' | 'category' | 'relationship';
  value: string | StepCategory | string[];
  confidence: number;
  reason?: string;
}

/**
 * Storage module for step annotations
 */
export class AnnotationStorage extends StorageModule<Record<string, Record<string, WorkflowStep>>> {
  constructor(options: StorageOptions = {}) {
    super('annotations', options);
  }

  /**
   * Validates annotation data
   */
  protected validateData(data: Record<string, Record<string, WorkflowStep>>): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Basic validation of the structure
    return Object.values(data).every(workflowSteps => {
      return typeof workflowSteps === 'object' && 
        Object.values(workflowSteps).every(step => {
          return typeof step === 'object' &&
            typeof step.id === 'string' &&
            typeof step.title === 'string';
        });
    });
  }

  /**
   * Gets all annotations for a workflow
   */
  getWorkflowAnnotations(workflowId: string): Record<string, WorkflowStep> | null {
    const allAnnotations = this.get() || {};
    return allAnnotations[workflowId] || null;
  }

  /**
   * Gets annotation for a specific step
   */
  getStepAnnotation(workflowId: string, stepId: string): WorkflowStep | null {
    const workflowAnnotations = this.getWorkflowAnnotations(workflowId);
    if (!workflowAnnotations) return null;
    
    return workflowAnnotations[stepId] || null;
  }

  /**
   * Saves annotation for a step
   */
  saveStepAnnotation(workflowId: string, stepId: string, annotation: WorkflowStep): boolean {
    try {
      const allAnnotations = this.get() || {};
      const workflowAnnotations = allAnnotations[workflowId] || {};
      
      // Update the annotation
      workflowAnnotations[stepId] = {
        ...annotation,
        updatedAt: Date.now()
      };
      
      // Update the parent objects
      allAnnotations[workflowId] = workflowAnnotations;
      
      return this.set(allAnnotations);
    } catch (error) {
      console.error(`Error saving step annotation for ${workflowId}/${stepId}:`, error);
      return false;
    }
  }

  /**
   * Updates a specific annotation field
   */
  updateAnnotationField(
    workflowId: string, 
    stepId: string, 
    field: 'purpose' | 'expectedOutcome' | 'category', 
    value: string
  ): boolean {
    try {
      const annotation = this.getStepAnnotation(workflowId, stepId);
      if (!annotation) {
        console.error(`Annotation not found for ${workflowId}/${stepId}`);
        return false;
      }
      
      const updatedAnnotation = {
        ...annotation,
        [field]: value,
        updatedAt: Date.now()
      };
      
      return this.saveStepAnnotation(workflowId, stepId, updatedAnnotation);
    } catch (error) {
      console.error(`Error updating annotation field for ${workflowId}/${stepId}:`, error);
      return false;
    }
  }

  /**
   * Updates step relationships
   */
  updateStepRelationships(
    workflowId: string,
    stepId: string,
    prerequisites: string[] = [],
    dependents: string[] = []
  ): boolean {
    try {
      const annotation = this.getStepAnnotation(workflowId, stepId);
      if (!annotation) {
        console.error(`Annotation not found for ${workflowId}/${stepId}`);
        return false;
      }
      
      const updatedAnnotation = {
        ...annotation,
        prerequisiteSteps: prerequisites,
        dependentSteps: dependents,
        updatedAt: Date.now()
      };
      
      return this.saveStepAnnotation(workflowId, stepId, updatedAnnotation);
    } catch (error) {
      console.error(`Error updating relationships for ${workflowId}/${stepId}:`, error);
      return false;
    }
  }

  /**
   * Calculates annotation statistics for a workflow
   */
  getAnnotationStats(workflowId: string): AnnotationStats {
    try {
      const workflowAnnotations = this.getWorkflowAnnotations(workflowId);
      if (!workflowAnnotations) {
        return {
          total: 0,
          withPurpose: 0,
          withOutcome: 0,
          withCategory: 0,
          withRelationships: 0,
          completeness: 0
        };
      }
      
      const steps = Object.values(workflowAnnotations);
      const total = steps.length;
      
      if (total === 0) {
        return {
          total: 0,
          withPurpose: 0,
          withOutcome: 0,
          withCategory: 0,
          withRelationships: 0,
          completeness: 0
        };
      }
      
      const withPurpose = steps.filter(step => !!step.purpose).length;
      const withOutcome = steps.filter(step => !!step.expectedOutcome).length;
      const withCategory = steps.filter(step => !!step.category).length;
      const withRelationships = steps.filter(step => 
        (step.prerequisiteSteps && step.prerequisiteSteps.length > 0) || 
        (step.dependentSteps && step.dependentSteps.length > 0)
      ).length;
      
      // Calculate completeness as a percentage of filled fields
      const maxFields = total * 4; // purpose, outcome, category, relationships
      const filledFields = withPurpose + withOutcome + withCategory + withRelationships;
      const completeness = (filledFields / maxFields) * 100;
      
      return {
        total,
        withPurpose,
        withOutcome,
        withCategory,
        withRelationships,
        completeness
      };
    } catch (error) {
      console.error(`Error calculating annotation stats for ${workflowId}:`, error);
      return {
        total: 0,
        withPurpose: 0,
        withOutcome: 0,
        withCategory: 0,
        withRelationships: 0,
        completeness: 0
      };
    }
  }

  /**
   * Deletes annotations for a workflow
   */
  deleteWorkflowAnnotations(workflowId: string): boolean {
    try {
      const allAnnotations = this.get() || {};
      if (!(workflowId in allAnnotations)) {
        return false;
      }
      
      delete allAnnotations[workflowId];
      return this.set(allAnnotations);
    } catch (error) {
      console.error(`Error deleting annotations for workflow ${workflowId}:`, error);
      return false;
    }
  }

  /**
   * Deletes a specific step annotation
   */
  deleteStepAnnotation(workflowId: string, stepId: string): boolean {
    try {
      const allAnnotations = this.get() || {};
      const workflowAnnotations = allAnnotations[workflowId];
      
      if (!workflowAnnotations || !(stepId in workflowAnnotations)) {
        return false;
      }
      
      delete workflowAnnotations[stepId];
      allAnnotations[workflowId] = workflowAnnotations;
      
      return this.set(allAnnotations);
    } catch (error) {
      console.error(`Error deleting annotation for ${workflowId}/${stepId}:`, error);
      return false;
    }
  }
} 