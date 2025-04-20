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

// Максимальный размер изображения в байтах (10 МБ)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
// Поддерживаемые типы изображений
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(req: Request) {
  try {
    // Проверяем тип запроса
    const contentType = req.headers.get('content-type') || '';
    
    let messages: any[] = [];
    let model: string = '';
    let stream: boolean = false;
    let imageData: string | null = null;
    let hasSystemMessage: boolean = false;
    
    // Обработка FormData (для запросов с изображениями)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      
      // Извлекаем текстовые данные
      model = formData.get('model') as string;
      stream = formData.get('stream') === 'true';
      
      // Получаем сообщения
      const messagesJson = formData.get('messages');
      if (messagesJson && typeof messagesJson === 'string') {
        messages = JSON.parse(messagesJson);
        
        // Проверяем, есть ли системное сообщение
        hasSystemMessage = messages.some(msg => msg.role === 'system');
      }
      
      // Получаем изображение, если оно есть
      const imageFile = formData.get('image') as File | null;
      
      if (imageFile) {
        // Проверяем тип файла
        if (!SUPPORTED_IMAGE_TYPES.includes(imageFile.type)) {
          return NextResponse.json(
            { error: 'Unsupported image type. Supported types: JPEG, PNG, WebP, GIF' },
            { status: 400 }
          );
        }
        
        // Проверяем размер файла
        if (imageFile.size > MAX_IMAGE_SIZE) {
          return NextResponse.json(
            { error: 'Image size exceeds the maximum allowed (10MB)' },
            { status: 400 }
          );
        }
        
        // Конвертируем в base64
        const imageBuffer = await imageFile.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        const mime = imageFile.type;
        imageData = `data:${mime};base64,${imageBase64}`;
        
        // Добавляем изображение в последнее сообщение пользователя, если оно есть
        if (messages && messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.role === 'user') {
            // Используем формат содержимого с изображением для GPT-4 Vision API
            lastMessage.content = [
              { type: 'text', text: lastMessage.content },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                  detail: 'auto'  // low, high, auto
                }
              }
            ];
          }
        }
      }
    } else {
      // Обработка обычного JSON запроса
      const jsonData = await req.json();
      messages = jsonData.messages || [];
      model = jsonData.model || '';
      stream = jsonData.stream || false;
    }
    
    // Дальнейшие проверки данных
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
        // При использовании изображений с gpt-4o, рекомендуется использовать max_tokens
        ...(model === 'gpt-4o' && messages.some(msg => 
          typeof msg.content === 'object' && 
          Array.isArray(msg.content) && 
          msg.content.some(item => item.type === 'image_url')
        ) ? { max_tokens: 4000 } : {})
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