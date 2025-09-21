import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sale, Purchase, Product, Customer, Supplier, ChatMessage } from '../types';
import { SendIcon, MicrophoneIcon, PaperclipIcon, CloseIcon, SpinnerIcon } from './icons/Icons';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  purchases: Purchase[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
}

const Chatbot = ({ isOpen, onClose, ...appData }: ChatbotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onresult = (event: any) => {
        setInput(event.results[0][0].transcript);
        setIsListening(false);
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !image) || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input, ...(image && { image }) };
    setMessages(prev => [...prev, userMessage]);
    
    setInput('');
    setImage(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    
    setIsLoading(true);

    try {
      const apiKey = (window as any).process.env.API_KEY; 
      if (!apiKey) {
        throw new Error("API Key not found. Please ensure it is configured correctly.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const dataContext = `Analyze the following data from the 'Hajara Medicals' app to answer the user's question. Today's Date: ${new Date().toLocaleDateString()}. DATA: ${JSON.stringify(appData)}`;

      const parts: any[] = [];
      if (image) {
        const [prefix, base64Data] = image.split(',');
        const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/jpeg';
        parts.push({ inlineData: { mimeType, data: base64Data } });
      }
      parts.push({ text: `${dataContext}\n\nUSER QUESTION: ${input || '(Analyze the image)'}` });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      let errorMessage = "Sorry, I'm having trouble connecting to my brain right now.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
        alert("Sorry, your browser doesn't support voice recognition.");
        return;
    }
    if (isListening) {
        recognitionRef.current.stop();
    } else {
        recognitionRef.current.start();
        setIsListening(true);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-6 w-[calc(100%-3rem)] max-w-md h-[70vh] max-h-[600px] z-50">
      <div className="bg-white h-full rounded-2xl shadow-2xl flex flex-col transition-all duration-300">
        <header className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-2xl">
          <h3 className="text-lg font-semibold">AI Assistant</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-blue-700"><CloseIcon /></button>
        </header>

        <main className="flex-1 p-4 overflow-y-auto bg-slate-50">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-sm p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-black rounded-bl-none'}`}>
                  {msg.image && <img src={msg.image} alt="user upload" className="rounded-lg mb-2 max-h-40" />}
                  <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                  <div className="max-w-xs md:max-w-sm p-3 rounded-2xl bg-gray-200 text-black">
                     <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                     </div>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="p-3 border-t bg-white rounded-b-2xl">
          {image && (
            <div className="p-2 relative">
              <img src={image} alt="preview" className="max-h-20 rounded-lg"/>
              <button onClick={() => { setImage(null); if(imageInputRef.current) imageInputRef.current.value = ''; }} className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-full p-0.5 m-1">
                <CloseIcon />
              </button>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask a question..."
              className="flex-1 w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageChange} className="hidden" />
            <button onClick={() => imageInputRef.current?.click()} className="p-2 text-black hover:text-black rounded-full hover:bg-gray-100" aria-label="Attach image"><PaperclipIcon /></button>
            <button onClick={handleVoiceInput} className={`p-2 rounded-full hover:bg-gray-100 ${isListening ? 'text-black' : 'text-black hover:text-black'}`} aria-label="Use voice"><MicrophoneIcon /></button>
            <button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !image)} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed" aria-label="Send message">
              {isLoading ? <SpinnerIcon /> : <SendIcon />}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chatbot;