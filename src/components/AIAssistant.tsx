import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User as UserIcon, X, Maximize2, Minimize2 } from "lucide-react";
import { inventoryAssistant } from "../services/geminiService";
import { Item, Unit, HistoryEntry } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AIAssistantProps {
  items: Item[];
  units: Unit[];
  history: HistoryEntry[];
}

export default function AIAssistant({ items, units, history }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: "¡Hola! Soy tu asistente de inventario Solmar. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim() || loading) return;

    const userText = query.trim();
    setQuery("");
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await inventoryAssistant(userText, items, units, history);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Hubo un problema al procesar tu solicitud." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[var(--accent)] text-white rounded-full shadow-[0_12px_24px_var(--ag)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
      >
        <Sparkles className="group-hover:animate-pulse" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '60px' : '500px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-24 right-6 w-[360px] bg-[var(--bg2)] border border-[var(--line2)] rounded-[var(--r3)] shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col z-50 overflow-hidden transition-all duration-300`}
          >
            {/* Header */}
            <div className="h-[60px] px-5 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg3)] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--as)] text-[var(--accent)] flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[var(--txt)] tracking-tight">Solmar AI</div>
                  <div className="text-[10px] text-[var(--green)] flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-current animate-pulse" /> En línea
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg4)] rounded-md transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg4)] rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                        msg.role === 'ai' ? 'bg-[var(--as)] text-[var(--accent)] border border-[rgba(99,102,241,0.2)]' : 'bg-[var(--bg4)] text-[var(--txt2)] border border-[var(--line2)]'
                      }`}>
                        {msg.role === 'ai' ? <Bot size={14} /> : <UserIcon size={14} />}
                      </div>
                      <div className={`p-3 rounded-[var(--r2)] text-[12.5px] leading-relaxed max-w-[80%] ${
                        msg.role === 'ai' 
                          ? 'bg-[var(--bg3)] text-[var(--txt2)] border border-[var(--line)]' 
                          : 'bg-[var(--accent)] text-white shadow-lg'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-[var(--as)] text-[var(--accent)] flex items-center justify-center border border-[rgba(99,102,241,0.2)]">
                        <Bot size={14} />
                      </div>
                      <div className="p-3 bg-[var(--bg3)] border border-[var(--line)] rounded-[var(--r2)] flex gap-1 items-center">
                        <div className="w-1 h-1 bg-[var(--txt3)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1 h-1 bg-[var(--txt3)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1 h-1 bg-[var(--txt3)] rounded-full animate-bounce" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[var(--line)] bg-[var(--bg3)]">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Consultar sobre stock, traslados..." 
                      className="w-full h-10 pl-4 pr-10 bg-[var(--bg2)] border border-[var(--line2)] rounded-full text-[13px] text-[var(--txt)] outline-none focus:border-[var(--accent)] transition-all"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!query.trim() || loading}
                      className="absolute right-1.5 top-1.5 w-7 h-7 bg-[var(--accent)] text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
