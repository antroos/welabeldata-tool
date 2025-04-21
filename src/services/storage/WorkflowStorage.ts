import { StorageModule, StorageOptions } from './StorageModule';
import { 
  Workflow as OldWorkflow,
  WorkflowStep as OldWorkflowStep,
  getWorkflows as getOldWorkflows
} from '../../lib/storageService';

export interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
  imageData?: string;
  purpose?: string;
  expectedOutcome?: string;
  prerequisiteSteps?: string[];
  dependentSteps?: string[];
  category?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Workflow {
  id: string;
  title: string;
  steps: WorkflowStep[];
  createdAt: number;
  updatedAt: number;
}

export class WorkflowStorage extends StorageModule<Workflow[]> {
  constructor(options: StorageOptions = {}) {
    super('workflows', options);
  }

  /**
   * Validates workflow data
   */
  protected validateData(workflows: Workflow[]): boolean {
    if (!Array.isArray(workflows)) return false;
    
    // Basic validation for each workflow
    return workflows.every(workflow => 
      typeof workflow.id === 'string' && 
      typeof workflow.title === 'string' &&
      Array.isArray(workflow.steps) &&
      typeof workflow.createdAt === 'number' &&
      typeof workflow.updatedAt === 'number'
    );
  }

  /**
   * Retrieves all workflows
   */
  getWorkflows(): Workflow[] {
    const workflows = this.get();
    return workflows || [];
  }

  /**
   * Retrieves a workflow by ID
   */
  getWorkflowById(id: string): Workflow | null {
    const workflows = this.getWorkflows();
    return workflows.find(workflow => workflow.id === id) || null;
  }

  /**
   * Saves a workflow
   */
  saveWorkflow(workflow: Workflow): boolean {
    const workflows = this.getWorkflows();
    const index = workflows.findIndex(w => w.id === workflow.id);
    
    if (index >= 0) {
      workflow.updatedAt = Date.now();
      workflows[index] = workflow;
    } else {
      workflow.createdAt = Date.now();
      workflow.updatedAt = Date.now();
      workflows.push(workflow);
    }
    
    return this.set(workflows);
  }

  /**
   * Deletes a workflow by ID
   */
  deleteWorkflow(id: string): boolean {
    const workflows = this.getWorkflows();
    const newWorkflows = workflows.filter(w => w.id !== id);
    
    if (newWorkflows.length < workflows.length) {
      return this.set(newWorkflows);
    }
    
    return false;
  }

  /**
   * Creates a new workflow
   */
  createNewWorkflow(title: string = 'New Workflow'): Workflow {
    const now = Date.now();
    return {
      id: `workflow-${now}`,
      title,
      steps: [],
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Gets a step by ID from a specific workflow
   */
  getStepById(workflowId: string, stepId: string): WorkflowStep | null {
    const workflow = this.getWorkflowById(workflowId);
    if (!workflow) return null;
    
    return workflow.steps.find(step => step.id === stepId) || null;
  }

  /**
   * Migrates data from the old storage format if needed
   */
  migrateFromOldFormat(): boolean {
    try {
      // Check if we have old format data
      const oldWorkflows = getOldWorkflows();
      if (!oldWorkflows || oldWorkflows.length === 0) {
        return false;
      }
      
      console.log(`Migrating ${oldWorkflows.length} workflows from old format`);
      
      // Convert old format to new format (in this case they're the same, but we have the migration hook)
      const workflows: Workflow[] = oldWorkflows.map(oldWorkflow => ({
        id: oldWorkflow.id,
        title: oldWorkflow.title,
        steps: oldWorkflow.steps.map(oldStep => ({
          id: oldStep.id,
          title: oldStep.title,
          description: oldStep.description,
          imageData: oldStep.imageData,
          purpose: oldStep.purpose,
          expectedOutcome: oldStep.expectedOutcome,
          prerequisiteSteps: oldStep.prerequisiteSteps,
          dependentSteps: oldStep.dependentSteps,
          category: oldStep.category,
          createdAt: oldStep.createdAt,
          updatedAt: oldStep.updatedAt
        })),
        createdAt: oldWorkflow.createdAt,
        updatedAt: oldWorkflow.updatedAt
      }));
      
      // Save migrated data
      const result = this.set(workflows);
      
      if (result) {
        console.log('Migration successful');
        // Optionally: clear old data or mark as migrated
        // localStorage.removeItem('wld_workflows');
      }
      
      return result;
    } catch (error) {
      console.error('Error migrating from old format:', error);
      return false;
    }
  }
} 