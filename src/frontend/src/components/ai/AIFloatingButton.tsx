import React, { useState } from 'react';
import { Bot, Sparkles, X, Send } from 'lucide-react';
import { aiService } from '../../services/aiService';
import type { AiResponseDto } from '../../services/aiService';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

export const AIFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Xin chào! Tôi là Trợ Lý AI. Bạn cần tra cứu thông tin gì hôm nay?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res: AiResponseDto = await aiService.sendMessage({
        conversationId,
        message: userText,
      });

      if (res.conversationId) setConversationId(res.conversationId);
      setMessages((prev) => [...prev, { sender: 'ai', text: res.response }]);
    } catch (e: any) {
      const errMsg = e.response?.status === 401
        ? 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!'
        : 'Không thể kết nối tới mô hình AI. Vui lòng kiểm tra server Backend & Ollama!';
      setMessages((prev) => [...prev, { sender: 'ai', text: `❌ ${errMsg}` }]);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <Button variant="outline"
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-[var(--neu-bg-base)] border border-[var(--neu-border)] text-emerald-600 flex items-center justify-center shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 hover:scale-105 transition-all duration-300 group relative focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          title="Hỏi nhanh Trợ Lý AI"
        >
          <Bot className="w-7 h-7 text-[var(--neu-accent-mint)] group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border border-white">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </span>
        </Button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <Card className="w-[380px] h-[550px] max-w-[90vw] max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Drawer Header */}
          <div className="p-4 border-b border-[var(--neu-border)] flex items-center justify-between shadow-inner border border-border/50 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--neu-bg-base)] border border-[var(--neu-border)] shadow-[var(--neu-shadow-button)] flex items-center justify-center text-[var(--neu-accent-mint)]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-medium text-sm text-[var(--neu-text-title)] flex items-center gap-1.5">
                  Trợ Lý AI RAG <Sparkles className="w-3 h-3 text-[var(--neu-accent-mint)] animate-pulse" />
                </h3>
                <span className="text-[10px] text-[var(--neu-text-sub)]">Ollama Qwen 2.5:7b</span>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} title="Đóng">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Drawer Message Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-sm shadow-[var(--neu-shadow-button)]'
                      : 'bg-[var(--neu-bg-base)] border border-[var(--neu-border)] text-[var(--neu-text-title)] rounded-tl-sm shadow-inner border border-border/50 bg-muted/20'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-[11px] text-[var(--neu-accent-mint)] font-medium animate-pulse flex items-center gap-1.5 p-2">
                <Bot className="w-3.5 h-3.5" /> AI đang suy nghĩ...
              </div>
            )}
          </div>

          {/* Drawer Input */}
          <div className="p-3 border-t border-[var(--neu-border)] bg-[var(--neu-bg-base)] flex items-center gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi AI..."
              className="flex-1"
            />
            <Button
              variant="primary"
              size="icon"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
