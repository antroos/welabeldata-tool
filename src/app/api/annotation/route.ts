import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// Check for API key
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
if (!apiKey) {
  console.error('NEXT_PUBLIC_OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

// Maximum image size in bytes (10 MB)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
// Supported image types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(req: Request) {
  try {
    // Check request type
    const contentType = req.headers.get('content-type') || '';
    
    let formData;
    let stepData;
    let imageData: string | null = null;
    let annotationType: string = 'purpose'; // default annotation type
    
    // Handle FormData (for requests with images)
    if (contentType.includes('multipart/form-data')) {
      formData = await req.formData();
      
      // Extract step data
      const stepDataJson = formData.get('stepData');
      if (stepDataJson && typeof stepDataJson === 'string') {
        stepData = JSON.parse(stepDataJson);
      }
      
      // Get annotation type
      annotationType = (formData.get('annotationType') as string) || 'purpose';
      
      // Get image if it exists
      const imageFile = formData.get('image') as File | null;
      
      if (imageFile) {
        // Check file type
        if (!SUPPORTED_IMAGE_TYPES.includes(imageFile.type)) {
          return NextResponse.json(
            { error: 'Unsupported image type. Supported types: JPEG, PNG, WebP, GIF' },
            { status: 400 }
          );
        }
        
        // Check file size
        if (imageFile.size > MAX_IMAGE_SIZE) {
          return NextResponse.json(
            { error: 'Image size exceeds the maximum allowed (10MB)' },
            { status: 400 }
          );
        }
        
        // Convert to base64
        const imageBuffer = await imageFile.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        const mime = imageFile.type;
        imageData = `data:${mime};base64,${imageBase64}`;
      }
    } else {
      // Handle regular JSON request
      const jsonData = await req.json();
      stepData = jsonData.stepData || {};
      annotationType = jsonData.annotationType || 'purpose';
    }
    
    // Validate request data
    if (!stepData) {
      return NextResponse.json(
        { error: 'Step data is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    console.log(`Making OpenAI API call for annotation type: ${annotationType}`);
    
    // Create messages array based on annotation type
    const messages = createPromptMessages(stepData, annotationType, imageData);
    
    try {
      // Make API call to OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      if (!response.choices || response.choices.length === 0) {
        return NextResponse.json(
          { error: 'No response choices returned from OpenAI API' },
          { status: 500 }
        );
      }

      // Process the response based on annotation type
      const result = processResponse(response.choices[0].message.content, annotationType);

      // Return the suggestions
      return NextResponse.json({
        suggestions: result,
        model: response.model
      });
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      
      return NextResponse.json(
        {
          error: 'OpenAI API Error',
          details: error.message || 'Unknown OpenAI API error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API request error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'There was an error processing your request.',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Function to create appropriate prompt messages based on annotation type
function createPromptMessages(stepData: any, annotationType: string, imageData: string | null): any[] {
  const messages = [];
  
  // System message with general instructions
  const systemMessage = {
    role: 'system',
    content: 'You are an AI assistant specializing in UI/UX workflow annotation. Your task is to analyze workflow steps and provide valuable annotations to improve workflow documentation.'
  };
  
  messages.push(systemMessage);
  
  // Create specific user message based on annotation type
  let userMessage: any = {
    role: 'user',
    content: ''
  };
  
  switch (annotationType) {
    case 'purpose':
      userMessage.content = `Analyze this workflow step and suggest a clear, concise purpose statement that explains WHY this action is being performed:
      
Step Title: ${stepData.title || 'Untitled Step'}
Step Description: ${stepData.description || 'No description provided'}

The purpose statement should be 1-2 sentences that clearly explain the objective of this step in the larger workflow.`;
      break;
      
    case 'outcome':
      userMessage.content = `Analyze this workflow step and suggest a clear expected outcome that explains WHAT should happen after this action is performed:
      
Step Title: ${stepData.title || 'Untitled Step'}
Step Description: ${stepData.description || 'No description provided'}
Step Purpose: ${stepData.purpose || 'No purpose provided'}

The expected outcome should be 1-2 sentences that clearly describe what changes or results should occur after this step is completed.`;
      break;
      
    case 'category':
      userMessage.content = `Analyze this workflow step and suggest the most appropriate category from the following options:
      
Step Title: ${stepData.title || 'Untitled Step'}
Step Description: ${stepData.description || 'No description provided'}
Step Purpose: ${stepData.purpose || 'No purpose provided'}

Available categories:
- input: User enters data or makes selections
- navigation: User navigates between pages or screens
- verification: User checks or confirms information
- output: System displays or outputs information to the user
- other: Any other type of action

Respond with ONLY ONE of these category names that best matches this step.`;
      break;
      
    case 'relationships':
      // For relationships, we need context about other steps in the workflow
      if (stepData.allSteps && Array.isArray(stepData.allSteps)) {
        const otherSteps = stepData.allSteps
          .filter((step: any) => step.id !== stepData.id)
          .map((step: any, index: number) => `Step ${index + 1}: ${step.title} - ${step.description || 'No description'} ${step.purpose ? `(Purpose: ${step.purpose})` : ''}`)
          .join('\n');
        
        userMessage.content = `Analyze this workflow step in relation to other steps in the workflow and suggest which steps should be prerequisites (must be completed before this step) and which steps might depend on this step.
        
Current Step:
Title: ${stepData.title || 'Untitled Step'}
Description: ${stepData.description || 'No description provided'}
Purpose: ${stepData.purpose || 'No purpose provided'}

Other Steps in Workflow:
${otherSteps || 'No other steps in workflow'}

Respond with a JSON object with two arrays: "prerequisites" and "dependents". Each array should contain the step numbers (as listed above) that likely are prerequisites or dependent steps. For example:
{
  "prerequisites": [1, 3],
  "dependents": [5]
}`;
      } else {
        userMessage.content = `I need information about other steps in the workflow to suggest relationships. Please provide the complete workflow context.`;
      }
      break;
      
    default:
      userMessage.content = `Please analyze the workflow step and provide general improvement suggestions:
      
Step Title: ${stepData.title || 'Untitled Step'}
Step Description: ${stepData.description || 'No description provided'}`;
  }
  
  // If there's an image, include it in the message
  if (imageData && ['purpose', 'outcome', 'category'].includes(annotationType)) {
    userMessage.content = [
      { type: 'text', text: userMessage.content },
      {
        type: 'image_url',
        image_url: {
          url: imageData,
          detail: 'auto'
        }
      }
    ];
  }
  
  messages.push(userMessage);
  
  return messages;
}

// Function to process and clean up AI response based on annotation type
function processResponse(responseContent: string | null, annotationType: string): any {
  if (!responseContent) return null;
  
  switch (annotationType) {
    case 'purpose':
      // Extract clear purpose statement, removing any preamble
      return responseContent.replace(/^(I suggest|Suggested|Here's a|The purpose is|Purpose:|Purpose statement:|etc.)/i, '').trim();
      
    case 'outcome':
      // Extract expected outcome, removing any preamble
      return responseContent.replace(/^(I suggest|Suggested|Here's a|The expected outcome is|Expected outcome:|Outcome:|etc.)/i, '').trim();
      
    case 'category':
      // Extract just the category name, looking for one of the valid categories
      const categoryMatch = responseContent.match(/\b(input|navigation|verification|output|other)\b/i);
      return categoryMatch ? categoryMatch[0].toLowerCase() : 'other';
      
    case 'relationships':
      // Try to parse JSON response or extract the relationship information
      try {
        // First check if there's a proper JSON object in the response
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        // If no JSON found, try to extract prerequisite and dependent information
        const prerequisites: number[] = [];
        const dependents: number[] = [];
        
        // Look for prerequisites
        const prereqMatch = responseContent.match(/prerequisites?:?\s*\[([^\]]*)\]/i);
        if (prereqMatch && prereqMatch[1]) {
          prereqMatch[1].split(',').forEach(num => {
            const parsedNum = parseInt(num.trim(), 10);
            if (!isNaN(parsedNum)) {
              prerequisites.push(parsedNum);
            }
          });
        }
        
        // Look for dependents
        const depMatch = responseContent.match(/dependents?:?\s*\[([^\]]*)\]/i);
        if (depMatch && depMatch[1]) {
          depMatch[1].split(',').forEach(num => {
            const parsedNum = parseInt(num.trim(), 10);
            if (!isNaN(parsedNum)) {
              dependents.push(parsedNum);
            }
          });
        }
        
        return { prerequisites, dependents };
      } catch (error) {
        console.error('Error parsing relationship JSON:', error);
        return { prerequisites: [], dependents: [] };
      }
      
    default:
      // Return the full response for general suggestions
      return responseContent.trim();
  }
} 