"use client";

import { useState } from 'react';
import { Button } from './button';
import { MessageCircle, X, Maximize2, Send } from 'lucide-react';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl w-[350px] h-[500px] flex flex-col">
          <div className="bg-[#1B4B79] text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">ClutchBot ❤️</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
              Unable to connect to chat service.
              <Button variant="secondary" size="sm" className="mt-2 w-full">
                Try Again
              </Button>
            </div>
            
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="bg-gray-100 text-gray-700 p-3 rounded-lg text-sm">
                Connection error. Please try again later.
              </div>
            ))}
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#87B440]"
              />
              <Button size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button 
          size="icon" 
          className="h-12 w-12 rounded-full bg-[#87B440] hover:bg-[#759C37] shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}