/**
 * Service for storing and retrieving data in the browser's localStorage
 */

export interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
  imageData?: string;
  purpose?: string;        // Why this action is performed
  expectedOutcome?: string; // What should happen after this action
  prerequisiteSteps?: string[];  // IDs of steps that must be completed before this one
  dependentSteps?: string[];     // IDs of steps that depend on this one
  category?: string;             // Category or type of action (e.g., "input", "navigation", "verification")
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

const STORAGE_KEYS = {
  WORKFLOWS: 'wld_workflows'
};

/**
 * Save workflow data to localStorage
 */
export const saveWorkflow = (workflow: Workflow): void => {
  try {
    // Get existing workflows
    const workflows = getWorkflows();
    
    // Update or add the workflow
    const index = workflows.findIndex(w => w.id === workflow.id);
    
    if (index >= 0) {
      workflow.updatedAt = Date.now();
      workflows[index] = workflow;
    } else {
      workflow.createdAt = Date.now();
      workflow.updatedAt = Date.now();
      workflows.push(workflow);
    }
    
    // Save updated workflows
    localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
  } catch (error) {
    console.error('Error saving workflow:', error);
  }
};

/**
 * Get all workflows from localStorage
 */
export const getWorkflows = (): Workflow[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WORKFLOWS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving workflows:', error);
    return [];
  }
};

/**
 * Get a specific workflow by ID
 */
export const getWorkflowById = (id: string): Workflow | null => {
  try {
    const workflows = getWorkflows();
    return workflows.find(w => w.id === id) || null;
  } catch (error) {
    console.error(`Error retrieving workflow ${id}:`, error);
    return null;
  }
};

/**
 * Delete a workflow by ID
 */
export const deleteWorkflow = (id: string): boolean => {
  try {
    const workflows = getWorkflows();
    const newWorkflows = workflows.filter(w => w.id !== id);
    
    if (newWorkflows.length < workflows.length) {
      localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(newWorkflows));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error deleting workflow ${id}:`, error);
    return false;
  }
};

/**
 * Get step by ID from a specific workflow
 */
export const getStepById = (workflowId: string, stepId: string): WorkflowStep | null => {
  try {
    const workflow = getWorkflowById(workflowId);
    if (!workflow) return null;
    
    return workflow.steps.find(step => step.id === stepId) || null;
  } catch (error) {
    console.error(`Error retrieving step ${stepId}:`, error);
    return null;
  }
};

/**
 * Create a default, new workflow with no steps
 */
export const createNewWorkflow = (title: string = 'New Workflow'): Workflow => {
  const now = Date.now();
  return {
    id: `workflow-${now}`,
    title,
    steps: [],
    createdAt: now,
    updatedAt: now
  };
};

/**
 * Export workflow data to a JSON file
 */
export const exportWorkflow = (workflowId: string): void => {
  const workflow = getWorkflowById(workflowId);
  
  if (!workflow) {
    console.error(`Workflow ${workflowId} not found for export`);
    return;
  }
  
  const dataStr = JSON.stringify(workflow, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
  
  const exportFileName = `${workflow.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileName);
  linkElement.click();
};

/**
 * Import workflow from a JSON file
 */
export const importWorkflow = async (file: File): Promise<Workflow | null> => {
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          const workflow = JSON.parse(result) as Workflow;
          
          // Validate the imported data
          if (!workflow.id || !workflow.title || !Array.isArray(workflow.steps)) {
            reject(new Error('Invalid workflow data format'));
            return;
          }
          
          // Update timestamps to avoid conflicts
          workflow.id = `workflow-${Date.now()}`;
          workflow.updatedAt = Date.now();
          
          // Save the imported workflow
          saveWorkflow(workflow);
          resolve(workflow);
        } catch (parseError) {
          reject(new Error('Failed to parse workflow data'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  } catch (error) {
    console.error('Error importing workflow:', error);
    return null;
  }
}; 