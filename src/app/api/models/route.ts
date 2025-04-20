import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

// Проверяем наличие API ключа
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

export async function GET() {
  try {
    const response = await openai.models.list();
    
    if (!response.data) {
      throw new Error('No data received from OpenAI API');
    }

    // Фильтруем только модели, которые поддерживают чат
    const chatModels = response.data.filter((model: OpenAIModel) => {
      // Распространенные модели чата
      const isChatModel = model.id.includes('gpt');
      // Исключаем инструктивные модели и старые версии
      const notInstruct = !model.id.includes('instruct');
      const notLegacy = !model.id.includes('-0');
      return isChatModel && notInstruct && notLegacy;
    });
    
    // Сортируем модели по ID
    chatModels.sort((a: OpenAIModel, b: OpenAIModel) => a.id.localeCompare(b.id));
    
    return NextResponse.json(chatModels);
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: 'Failed to fetch available models', details: errorMessage },
      { status: 500 }
    );
  }
} 