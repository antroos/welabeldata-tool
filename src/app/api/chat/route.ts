import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// Проверяем наличие API ключа
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
if (!apiKey) {
  console.error('NEXT_PUBLIC_OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model parameter is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    console.log(`Making OpenAI API call to model: ${model} with ${messages.length} messages`);
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
    });

    if (!response.choices || response.choices.length === 0) {
      return NextResponse.json(
        { error: 'No response choices returned from OpenAI API' },
        { status: 500 }
      );
    }

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Извлекаем подробности ошибки
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'There was an error processing your request.',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
} 