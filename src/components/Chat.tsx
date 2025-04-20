'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

type Model = {
  id: string;
  name: string;
  provider: 'openai';
};

// Updated list of current models
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto scroll to the last message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll down when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Automatically adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Fetch model information when the component first loads
  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const data = await response.json();
          // Save available models
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

  // Start a new chat
  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setModelInfo(null);
    setErrorMessage(null);
  };

  // Process form submission with streaming data support
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
      // Add temporary assistant message for streaming text generation
      const tempAssistantMessage: Message = { 
        role: 'assistant', 
        content: '', 
        isStreaming: true 
      };
      
      setMessages([...newMessages, tempAssistantMessage]);
      
      console.log(`Sending request with model: ${selectedModel.id}`);
      
      // Use streaming data
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map(msg => ({ role: msg.role, content: msg.content })),
          model: selectedModel.id,
          stream: true, // Enable streaming
        }),
      });

      if (!response.ok) {
        // Handle HTTP errors
        let errorDetails = 'Network response was not ok: ' + response.status;
        try {
          const errorData = await response.json();
          errorDetails = errorData.details || errorData.error || errorDetails;
        } catch (e) {
          // Failed to parse JSON
        }
        throw new Error(errorDetails);
      }

      // Create reader for streaming data
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

                // Process different message types
                if (data.type === 'chunk') {
                  fullContent += data.content;

                  setMessages(prevMessages => {
                    const updatedMessages = [...prevMessages];
                    // Update assistant message content in real time
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
                  // Final content and model information
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

      // Complete streaming, set final data
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
      
      // If there was a streaming response, remove temporary message and add error message
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

  // Handle Enter key press for sending, Shift+Enter for new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="chatgpt-container">
      {/* Sidebar */}
      <div className="sidebar" style={{ width: isSidebarOpen ? '260px' : '0', overflow: 'hidden', transition: 'width 0.3s' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={handleNewChat}
            style={{ 
              width: '100%', 
              padding: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              borderRadius: '6px', 
              color: 'white', 
              cursor: 'pointer' 
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
              <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>New chat</span>
          </button>
        </div>
        
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          {/* Conversation history would go here */}
        </div>
        
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px' }}>Select model:</div>
          <select
            value={selectedModel.id}
            onChange={(e) => {
              const model = openaiModels.find(m => m.id === e.target.value);
              if (model) setSelectedModel(model);
            }}
            style={{ 
              width: '100%', 
              padding: '8px', 
              backgroundColor: '#343541', 
              color: 'white', 
              border: '1px solid rgba(255,255,255,0.2)', 
              borderRadius: '6px' 
            }}
          >
            {openaiModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          
          {modelInfo && (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>{modelInfo}</div>
          )}
        </div>
      </div>
      
      {/* Mobile sidebar toggle button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{ 
          position: 'fixed', 
          left: 0, 
          top: '16px', 
          backgroundColor: '#202123', 
          padding: '8px', 
          borderRadius: '0 6px 6px 0', 
          zIndex: 10, 
          color: 'white', 
          border: 'none', 
          cursor: 'pointer', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isSidebarOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19L4 12L11 5M20 19L13 12L20 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 5L20 12L13 19M4 5L11 12L4 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Main chat area */}
      <div className="chat-content">
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {messages.length === 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              color: 'rgba(255,255,255,0.6)',
              padding: '0 16px',
              textAlign: 'center'
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '16px', opacity: 0.3 }}>
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '8px', color: 'rgba(255,255,255,0.9)' }}>How can I help you today?</h2>
              <p style={{ maxWidth: '400px' }}>
                Start a conversation with the AI assistant. Your chat messages will appear here.
              </p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index} className={message.role === 'assistant' ? 'assistant-message' : 'user-message'}>
              <div className="message-container">
                <div className={message.role === 'user' ? 'user-icon' : 'bot-icon'}>
                  {message.role === 'user' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div style={{ color: 'white', lineHeight: 1.6 }}>
                  {message.isStreaming ? (
                    <div>
                      {message.content}
                      <div className="typing-animation"></div>
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && !messages[messages.length - 1]?.isStreaming && (
            <div className="assistant-message">
              <div className="message-container">
                <div className="bot-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.6)', animation: 'bounce 1s infinite' }}></div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.6)', animation: 'bounce 1s infinite', animationDelay: '0.1s' }}></div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.6)', animation: 'bounce 1s infinite', animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef}></div>
        </div>

        {/* Input form */}
        <div style={{ padding: '16px', position: 'relative', backgroundColor: '#40414F', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {errorMessage && (
            <div style={{ 
              position: 'absolute', 
              bottom: '80px', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              backgroundColor: 'rgba(239, 68, 68, 0.9)', 
              color: 'white', 
              padding: '12px 16px', 
              borderRadius: '6px', 
              maxWidth: '400px', 
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <span style={{ fontWeight: 500 }}>Error:</span> {errorMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message ChatGPT..."
              className="input-box"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{ 
                position: 'absolute', 
                right: '12px', 
                bottom: '12px', 
                backgroundColor: 'transparent', 
                border: 'none', 
                color: isLoading || !input.trim() ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)', 
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 5L20 12L13 19M5 5L12 12L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '8px' }}>
              {isLoading ? 'Processing...' : 'Press Enter to send, Shift+Enter for new line'}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 