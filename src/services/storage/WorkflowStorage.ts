import { StorageModule, StorageOptions } from './StorageModule';
import { CompressionService } from '../CompressionService';
import { 
  Workflow as OldWorkflow,
  WorkflowStep as OldWorkflowStep,
  getWorkflows as getOldWorkflows
} from '../../lib/storageService';

// Higher compression threshold for image data (100KB)
const IMAGE_COMPRESSION_THRESHOLD = 100 * 1024;

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
  private imageCompressionService: CompressionService;

  constructor(options: StorageOptions = {}) {
    super('workflows', options);
    // Special compression service just for images with a higher threshold
    this.imageCompressionService = new CompressionService(IMAGE_COMPRESSION_THRESHOLD);
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
   * Process workflow steps to handle image compression
   * @param steps Workflow steps to process
   * @param compressImages Whether to compress images or decompress them
   * @returns Processed workflow steps
   */
  private processStepImages(steps: WorkflowStep[], compressImages: boolean): WorkflowStep[] {
    return steps.map(step => {
      // Skip steps without image data
      if (!step.imageData) return step;

      const processedStep = { ...step };
      
      if (compressImages) {
        // Compress image data if it's large
        processedStep.imageData = this.imageCompressionService.autoCompress(step.imageData);
      } else {
        // Decompress image data if it's compressed
        processedStep.imageData = this.imageCompressionService.autoDecompress(step.imageData);
      }
      
      return processedStep;
    });
  }

  /**
   * Retrieves all workflows with decompressed images
   */
  getWorkflows(): Workflow[] {
    const workflows = this.get();
    if (!workflows) return [];
    
    // Process each workflow to decompress images
    return workflows.map(workflow => ({
      ...workflow,
      steps: this.processStepImages(workflow.steps, false)
    }));
  }

  /**
   * Retrieves a workflow by ID with decompressed images
   */
  getWorkflowById(id: string): Workflow | null {
    const workflows = this.getWorkflows();
    return workflows.find(workflow => workflow.id === id) || null;
  }

  /**
   * Saves a workflow with image compression
   */
  saveWorkflow(workflow: Workflow): boolean {
    const workflows = this.getWorkflows();
    const index = workflows.findIndex(w => w.id === workflow.id);
    
    // Create a copy with compressed images
    const workflowWithCompressedImages = {
      ...workflow,
      steps: this.processStepImages(workflow.steps, true)
    };
    
    if (index >= 0) {
      workflowWithCompressedImages.updatedAt = Date.now();
      workflows[index] = workflowWithCompressedImages;
    } else {
      workflowWithCompressedImages.createdAt = Date.now();
      workflowWithCompressedImages.updatedAt = Date.now();
      workflows.push(workflowWithCompressedImages);
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
   * Calculate total storage used by images in workflows
   * @returns Size in bytes
   */
  getTotalImageStorageSize(): number {
    const workflows = this.get() || [];
    let totalSize = 0;
    
    for (const workflow of workflows) {
      for (const step of workflow.steps) {
        if (step.imageData) {
          // Each character is 2 bytes in UTF-16
          totalSize += step.imageData.length * 2;
        }
      }
    }
    
    return totalSize;
  }

  /**
   * Optimize storage by compressing all images that exceed the threshold
   * @returns Number of images compressed
   */
  optimizeImageStorage(): number {
    const workflows = this.get() || [];
    let compressedCount = 0;
    
    const optimizedWorkflows = workflows.map(workflow => {
      const optimizedSteps = workflow.steps.map(step => {
        if (!step.imageData) return step;
        
        const originalSize = step.imageData.length;
        const compressedImageData = this.imageCompressionService.autoCompress(step.imageData);
        
        if (compressedImageData !== step.imageData) {
          compressedCount++;
          return {
            ...step,
            imageData: compressedImageData
          };
        }
        
        return step;
      });
      
      return {
        ...workflow,
        steps: optimizedSteps
      };
    });
    
    if (compressedCount > 0) {
      this.set(optimizedWorkflows);
    }
    
    return compressedCount;
  }

  /**
   * Migrates data from the old storage format if needed
   */
  migrateFromOldFormat(): boolean {
    try {
      // Check if we have old format data
      const oldWorkflows = getOldWorkflows();
      if (!oldWorkflows || !Array.isArray(oldWorkflows) || oldWorkflows.length === 0) {
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
      
      // Apply compression to image data during migration
      const workflowsWithCompressedImages = workflows.map(workflow => ({
        ...workflow,
        steps: this.processStepImages(workflow.steps, true)
      }));
      
      // Save migrated data
      const result = this.set(workflowsWithCompressedImages);
      
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