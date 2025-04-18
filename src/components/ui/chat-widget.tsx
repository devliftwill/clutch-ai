"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { MessageSquare, X, Send, Maximize2, Minimize2 } from "lucide-react";

type Message = {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
};

type JobContext = {
  title?: string;
  company?: string;
  location?: string;
  type?: string;
  salary?: string;
  experience?: string;
  overview?: string;
} | null;

export function ChatWidget({ jobContext }: { jobContext?: JobContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection with reconnection logic
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket('wss://clutch.ngrok.app');

      ws.onopen = () => {
        setIsConnected(true);
        setMessages(prev => {
          // Only add welcome message if it's not already there
          if (prev.length === 0) {
            return [{
              type: 'bot',
              content: 'Hi! How can I help you today?',
              timestamp: new Date()
            }];
          }
          return prev;
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.message) {
            setMessages(prev => [...prev, {
              type: 'bot',
              content: data.message,
              timestamp: new Date()
            }]);
            setIsTyping(false);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isOpen) {
            connectWebSocket();
          }
        }, 5000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        ws.close();
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Create context string if job context exists
    let messageWithContext = message;
    if (jobContext) {
      messageWithContext = JSON.stringify({
        userMessage: message,
        jobContext: {
          title: jobContext.title,
          company: jobContext.company,
          location: jobContext.location,
          type: jobContext.type,
          salary: jobContext.salary,
          experience: jobContext.experience,
          overview: jobContext.overview
        }
      });
    }

    // Add user message to chat (show only the user's message, not the context)
    setMessages(prev => [...prev, {
      type: 'user',
      content: message,
      timestamp: new Date()
    }]);

    // Send message with context to server
    wsRef.current.send(messageWithContext);
    
    setIsTyping(true);
    setMessage("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div 
          className={`bg-white rounded-lg shadow-xl transition-all duration-200 flex flex-col ${
            isExpanded ? "w-[600px] h-[800px]" : "w-[320px] h-[480px]"
          }`}
        >
          {/* Header */}
          <div className="bg-[#166A9A] text-white p-3 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="font-semibold">C</span>
              </div>
              <div>
                <h3 className="font-medium">Chat with ClutchBot</h3>
                <p className="text-xs text-white/80">
                  {isConnected ? 'Online' : 'Connecting...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 h-8 w-8"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 mb-4 ${
                  msg.type === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.type === 'user' ? 'bg-[#87B440]' : 'bg-[#166A9A]'
                } text-white`}>
                  <span className="text-sm font-medium">
                    {msg.type === 'user' ? 'U' : 'C'}
                  </span>
                </div>
                <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <div className={`${
                    msg.type === 'user' 
                      ? 'bg-[#87B440] text-white rounded-2xl rounded-tr-none' 
                      : 'bg-gray-100 rounded-2xl rounded-tl-none'
                  } p-3 break-words`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-gray-50">
            <form 
              className="flex gap-2"
              onSubmit={handleSubmit}
            >
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#166A9A] focus:border-transparent resize-none overflow-hidden min-h-[36px] max-h-[150px]"
                disabled={!isConnected}
                rows={1}
              />
              <Button 
                type="submit" 
                size="icon"
                className="bg-[#87B440] hover:bg-[#759C37] text-white rounded-full h-9 w-9"
                disabled={!message.trim() || !isConnected}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-[#166A9A] hover:bg-[#166A9A]/90 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center relative group"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-[#87B440] rounded-full border-2 border-white"></span>
        </Button>
      )}
    </div>
  );
}