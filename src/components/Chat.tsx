'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

type Model = {
  id: string;
  name: string;
  provider: 'openai';
};

// Обновленный список актуальных моделей
const openaiModels: Model[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
];

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<Model>(openaiModels[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Автоскролл к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // При изменении сообщений скроллим вниз
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Автоматическое изменение высоты поля ввода
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // При первой загрузке выполняем запрос к API для получения информации о моделях
  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const data = await response.json();
          // Сохраняем доступные модели
          setAvailableModels(data);
          console.log('Available models:', data);
        } else {
          console.error('Error fetching models: HTTP', response.status);
          const errorData = await response.json();
          console.error('Error details:', errorData);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };

    fetchModelInfo();
  }, []);

  // Обработка отправки сообщения с поддержкой потоковой передачи данных
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setModelInfo(null);
    setErrorMessage(null);

    try {
      // Добавляем временное сообщение помощника для отображения потоковой генерации текста
      const tempAssistantMessage: Message = { 
        role: 'assistant', 
        content: '', 
        isStreaming: true 
      };
      
      setMessages([...newMessages, tempAssistantMessage]);
      
      console.log(`Sending request with model: ${selectedModel.id}`);
      
      // Используем потоковую передачу данных
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map(msg => ({ role: msg.role, content: msg.content })),
          model: selectedModel.id,
          stream: true, // Включаем потоковую передачу
        }),
      });

      if (!response.ok) {
        // Обработка ошибок HTTP
        let errorDetails = 'Network response was not ok: ' + response.status;
        try {
          const errorData = await response.json();
          errorDetails = errorData.details || errorData.error || errorDetails;
        } catch (e) {
          // Если не удалось распарсить JSON
        }
        throw new Error(errorDetails);
      }

      // Создаем объект чтения для получения потоковых данных
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let responseModel = '';

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = decoder.decode(value);
            const lines = text.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const data = JSON.parse(line);

                // Обработка разных типов сообщений
                if (data.type === 'chunk') {
                  fullContent += data.content;

                  setMessages(prevMessages => {
                    const updatedMessages = [...prevMessages];
                    // Обновляем контент сообщения ассистента в реальном времени
                    const lastMessageIndex = updatedMessages.length - 1;
                    if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].role === 'assistant') {
                      updatedMessages[lastMessageIndex].content = fullContent;
                    }
                    return updatedMessages;
                  });

                  if (data.model) {
                    responseModel = data.model;
                  }
                } else if (data.type === 'end') {
                  // Финальный контент и информация о модели
                  if (data.model) {
                    responseModel = data.model;
                    setModelInfo(`Response generated by: ${responseModel}`);
                  }
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (err) {
                console.error('Error parsing SSE data:', err, line);
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }

      // Завершаем потоковую передачу, устанавливаем окончательные данные
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const lastMessageIndex = updatedMessages.length - 1;
        if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].role === 'assistant') {
          updatedMessages[lastMessageIndex].isStreaming = false;
        }
        return updatedMessages;
      });

    } catch (error) {
      console.error('Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(errorMsg);
      
      // Если был ответ потоком, удаляем временное сообщение и добавляем сообщение с ошибкой
      setMessages(prevMessages => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        const withoutTemp = lastMessage.isStreaming ? prevMessages.slice(0, -1) : prevMessages;
        
        return [...withoutTemp, { 
          role: 'assistant', 
          content: `Sorry, there was an error processing your request: ${errorMsg}`
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка нажатия Enter для отправки, Shift+Enter для новой строки
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl p-4 bg-gray-50 min-h-screen">
      <div className="flex flex-col h-screen bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header with model selector */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-4 text-white">
          <h1 className="text-xl font-bold mb-2">Чат с AI Ассистентом</h1>
          <div className="flex items-center gap-2">
            <label htmlFor="model-select" className="text-white">Модель:</label>
            <select
              id="model-select"
              value={selectedModel.id}
              onChange={(e) => {
                const model = openaiModels.find(m => m.id === e.target.value);
                if (model) setSelectedModel(model);
              }}
              className="p-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              {openaiModels.map((model) => (
                <option key={model.id} value={model.id} className="text-gray-800">
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          {modelInfo && (
            <div className="text-sm text-white/80 mt-1">{modelInfo}</div>
          )}
          {errorMessage && (
            <div className="text-sm bg-red-500/20 border border-red-500/30 text-white p-2 rounded mt-2 max-w-md">
              <span className="font-semibold">Error:</span> {errorMessage}
            </div>
          )}
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">Начните разговор с AI ассистентом</p>
              <p className="text-sm mt-2">Ваши сообщения и ответы будут отображаться здесь</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' ? 'bg-blue-100 text-blue-600 ml-3' : 'bg-indigo-100 text-indigo-600 mr-3'
                }`}>
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                }`}>
                  {message.isStreaming ? (
                    <div>
                      {message.content}
                      <span className="inline-block animate-pulse">▋</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && !messages[messages.length - 1]?.isStreaming && (
            <div className="flex justify-start">
              <div className="flex max-w-3xl">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100 text-indigo-600 mr-3">
                  🤖
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none shadow-sm bg-white border border-gray-200">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите сообщение..."
                rows={1}
                className="w-full p-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 overflow-y-auto"
              />
              <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                {isLoading ? '' : 'Нажмите Enter для отправки'}
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 
                        disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 