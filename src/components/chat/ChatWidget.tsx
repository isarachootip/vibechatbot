"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "สวัสดีครับ! แอดมิน AI จาก Fastauto Service ยินดีให้บริการ สนใจเช็คสเปคหรือราคายาง/แบตเตอรี่รถรุ่นไหน แจ้งได้เลยครับ เช่น 'Camry 2018 ใช้ยางขนาดเท่าไหร่'",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to UI
    const newUserMsg: Message = { id: Date.now().toString(), role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const newMessages = [...messages, newUserMsg];
      const res = await fetch("/api/auto1-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          history: newMessages.slice(-5) // Send last 5 messages for context
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: data.reply },
        ]);
      } else {
         setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: "ขออภัยครับ ระบบมีปัญหาในการตอบกลับ กรุณาลองใหม่อีกครั้ง" },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "ขออภัยครับ ไม่สามารถเชื่อมต่อกับระบบ AI ได้ในขณะนี้" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 flex flex-col w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 ease-in-out">
          {/* Header */}
          <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6" />
              <span className="font-bold text-lg">Fastauto AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm whitespace-pre-wrap ${
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm flex items-center space-x-2">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex space-x-2"
            >
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ถามเรื่องยางหรือแบตเตอรี่..."
                className="flex-1 focus-visible:ring-primary rounded-full bg-slate-50 border-slate-200"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="rounded-full shadow-md bg-primary hover:bg-primary/90">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-primary-foreground rounded-full p-4 shadow-2xl hover:scale-105 transition-transform duration-200 flex items-center justify-center ring-4 ring-primary/20"
        >
          <MessageCircle className="h-8 w-8" />
        </button>
      )}
    </div>
  );
}
