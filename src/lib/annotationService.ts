/**
 * Service for AI-assisted annotation of workflow steps
 */

export interface AnnotationRequest {
  stepData: any;
  annotationType: 'purpose' | 'outcome' | 'category' | 'relationships';
  image?: File;
}

export interface AnnotationResponse {
  suggestions: any;
  model?: string;
  error?: string;
}

/**
 * Request an AI-generated annotation suggestion
 * @param request The annotation request details
 * @returns Promise with suggestion response
 */
export const requestAnnotation = async (request: AnnotationRequest): Promise<AnnotationResponse> => {
  try {
    const { stepData, annotationType, image } = request;
    
    // Create FormData for request (supports images)
    const formData = new FormData();
    formData.append('stepData', JSON.stringify(stepData));
    formData.append('annotationType', annotationType);
    
    if (image) {
      formData.append('image', image);
    }
    
    // Make API request
    const response = await fetch('/api/annotation', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.details || 'Failed to get annotation suggestion');
    }
    
    const data = await response.json();
    return {
      suggestions: data.suggestions,
      model: data.model
    };
  } catch (error) {
    console.error('Annotation request error:', error);
    return {
      suggestions: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred during annotation'
    };
  }
};

/**
 * Get a purpose suggestion for a workflow step
 * @param stepData The step data
 * @param image Optional screenshot image
 * @returns Promise with purpose suggestion
 */
export const getPurposeSuggestion = async (stepData: any, image?: File): Promise<string | null> => {
  const response = await requestAnnotation({
    stepData,
    annotationType: 'purpose',
    image
  });
  
  return response.error ? null : response.suggestions;
};

/**
 * Get an outcome suggestion for a workflow step
 * @param stepData The step data
 * @param image Optional screenshot image
 * @returns Promise with outcome suggestion
 */
export const getOutcomeSuggestion = async (stepData: any, image?: File): Promise<string | null> => {
  const response = await requestAnnotation({
    stepData,
    annotationType: 'outcome',
    image
  });
  
  return response.error ? null : response.suggestions;
};

/**
 * Get a category suggestion for a workflow step
 * @param stepData The step data
 * @param image Optional screenshot image
 * @returns Promise with category suggestion
 */
export const getCategorySuggestion = async (stepData: any, image?: File): Promise<string | null> => {
  const response = await requestAnnotation({
    stepData,
    annotationType: 'category',
    image
  });
  
  return response.error ? null : response.suggestions;
};

/**
 * Get relationship suggestions for a workflow step
 * @param stepData The step data with allSteps array
 * @returns Promise with relationship suggestions
 */
export const getRelationshipSuggestions = async (stepData: any): Promise<{prerequisites: number[], dependents: number[]} | null> => {
  const response = await requestAnnotation({
    stepData,
    annotationType: 'relationships'
  });
  
  return response.error ? null : response.suggestions;
}; 