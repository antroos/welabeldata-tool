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

// Список поддерживаемых моделей
const supportedModels = ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'];

export async function POST(req: Request) {
  try {
    const { messages, model, stream = false } = await req.json();
    
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

    // Проверяем, поддерживается ли модель
    if (!supportedModels.includes(model)) {
      console.warn(`Warning: Model ${model} may not be supported. Continuing anyway.`);
    }

    console.log(`Making OpenAI API call to model: ${model} with ${messages.length} messages`);
    
    try {
      // Если запрошен потоковый режим, возвращаем поток данных
      if (stream) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const response = await openai.chat.completions.create({
          model: model,
          messages: messages,
          stream: true,
        });

        const stream = new ReadableStream({
          async start(controller) {
            let fullResponse = '';
            
            // Отправляем начальное сообщение со служебной информацией
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'start', modelName: model }) + '\n'));
            
            try {
              for await (const chunk of response) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                  // Отправляем фрагмент текста через поток
                  controller.enqueue(encoder.encode(JSON.stringify({ 
                    type: 'chunk', 
                    content: content,
                    model: model
                  }) + '\n'));
                }
              }
              
              // Отправляем завершающее сообщение
              controller.enqueue(encoder.encode(JSON.stringify({ 
                type: 'end', 
                content: fullResponse,
                model: model
              }) + '\n'));
              
              controller.close();
            } catch (error) {
              controller.enqueue(encoder.encode(JSON.stringify({ 
                type: 'error', 
                error: (error as Error).message 
              }) + '\n'));
              controller.close();
            }
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
      
      // Обычный режим без потоковой передачи
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

      // Возвращаем сообщение вместе с информацией о модели
      return NextResponse.json({
        ...response.choices[0].message,
        model: response.model // Добавляем информацию о модели, которая фактически использовалась
      });
    } catch (openaiError: any) {
      // Обработка ошибок API OpenAI
      console.error('OpenAI API Error details:', openaiError);
      
      // Извлекаем детали ошибки из объекта ошибки OpenAI
      const statusCode = openaiError.status || 500;
      const errorMessage = openaiError.message || 'Unknown OpenAI API error';
      let errorDetails = 'No additional details';
      
      if (openaiError.error) {
        errorDetails = openaiError.error.message || JSON.stringify(openaiError.error);
      }
      
      return NextResponse.json(
        {
          error: 'OpenAI API Error',
          details: errorMessage,
          additionalInfo: errorDetails,
          code: openaiError.code || 'unknown_error'
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error('API request error:', error);
    
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