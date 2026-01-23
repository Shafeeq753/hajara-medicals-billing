
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sale, Purchase, Product, Customer, Supplier, ChatMessage, Bill } from '../types';
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
  bills: Bill[];
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
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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
      /* Initialize Gemini API directly using process.env.API_KEY as per guidelines */
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `You are an intelligent AI assistant for 'Hajara Medicals'. 
      You have access to the entire database of the shop in JSON format provided below.
      
      Your Role:
      1. Answer user queries about sales, purchases, products, customers, suppliers, and billing.
      2. Perform calculations (e.g., total sales between dates, most popular product).
      3. Be concise, direct, and helpful. Avoid long paragraphs unless asked for details.
      
      Current Date: ${new Date().toLocaleDateString()}
      
      Database Context:
      ${JSON.stringify(appData)}
      
      Instructions:
      - If asked about sales/revenue, combine data from 'sales' (direct sales) and 'bills' (billing section).
      - Dates in the database are in YYYY-MM-DD format.
      - Calculate totals accurately.
      `;

      const parts: any[] = [];
      if (image) {
        const [prefix, base64Data] = image.split(',');
        const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/jpeg';
        parts.push({ inlineData: { mimeType, data: base64Data } });
      }
      parts.push({ text: input || '(Analyze the image)' });

      /* Use gemini-3-pro-preview for complex reasoning and data analysis tasks */
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts },
        config: {
            systemInstruction: systemInstruction
        }
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || "I couldn't generate a response." }]);
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
    <div className="fixed bottom-24 right-6 w-[calc(100%-3rem)] max-w-md h-[600px] max-h-[70vh] z-50 flex flex-col shadow-2xl rounded-2xl animate-fade-in-up">
      <div className="bg-white h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        <header className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center space-x-2">
             <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
             <h3 className="text-lg font-semibold">AI Assistant</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors"><CloseIcon /></button>
        </header>

        <main className="flex-1 p-4 overflow-y-auto bg-slate-50 scrollbar-thin scrollbar-thumb-gray-300">
          <div className="space-y-4">
             {messages.length === 0 && (
                 <div className="text-center text-gray-500 mt-10">
                     <p>👋 Hi! I have access to your shop's data.</p>
                     <p className="text-sm mt-2">Ask me about sales, stock, or suppliers!</p>
                 </div>
             )}
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                  {msg.image && <img src={msg.image} alt="user upload" className="rounded-lg mb-2 max-h-40 object-cover" />}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                  <div className="max-w-xs p-3 rounded-2xl bg-white border border-gray-200 shadow-sm">
                     <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                     </div>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="p-3 bg-white border-t border-gray-100">
          {image && (
            <div className="p-2 relative mb-2 inline-block">
              <img src={image} alt="preview" className="h-16 w-16 rounded-lg object-cover border"/>
              <button onClick={() => { setImage(null); if(imageInputRef.current) imageInputRef.current.value = ''; }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md">
                <CloseIcon />
              </button>
            </div>
          )}
          <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-full border border-gray-200">
            <button onClick={() => imageInputRef.current?.click()} className="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-200" title="Attach Image"><PaperclipIcon /></button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask anything about your business..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-800 placeholder-gray-400"
              disabled={isLoading}
            />
            <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageChange} className="hidden" />
            <button onClick={handleVoiceInput} className={`p-2 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-200'}`} title="Voice Input"><MicrophoneIcon /></button>
            <button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !image)} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm transition-all transform active:scale-95" title="Send">
              {isLoading ? <SpinnerIcon /> : <SendIcon />}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chatbot;
