import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import type { AiResponseDto } from '../../services/aiService';
import { Bot, Sparkles, Send, FileText, Database, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const AiChatPage: React.FC = () => {
  const { language } = useThemeStore();
  const tAi = i18nDictionary[language].aiChat;
  const tCommon = i18nDictionary[language].common;

  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; docs?: string[] }>>([
    {
      sender: 'ai',
      text: tAi.welcomeMessage,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  // Ingest Document Modal
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docCategory, setDocCategory] = useState(tAi.catPolicy);
  const [ingesting, setIngesting] = useState(false);

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input;
    if (!textToSend.trim() || loading) return;
    if (!overridePrompt) setInput('');

    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const stream = aiService.sendMessageStream({
        conversationId,
        message: textToSend,
      });

      // Tạo sẵn 1 tin nhắn trống của AI để cập nhật dần
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: '',
          docs: [],
        },
      ]);
      setLoading(false); // Disable loading spinner immediately as we start streaming

      let currentText = '';
      for await (const chunk of stream) {
        if (typeof chunk === 'object' && chunk.type === 'conversationId') {
          setConversationId(chunk.id);
        } else if (typeof chunk === 'string') {
          currentText += chunk;
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              text: currentText,
            };
            return newMessages;
          });
        }
      }
    } catch (e: any) {
      const errMsg = e.message || 'Lỗi kết nối Stream!';
      setMessages((prev) => [...prev, { sender: 'ai', text: `❌ ${errMsg}` }]);
      toast.error(errMsg);
      setLoading(false);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;
    setIngesting(true);

    try {
      await aiService.ingestDocument(docTitle, docContent, docCategory);
      toast.success(language === 'vi' ? 'Đã nhúng Vector và nạp tri thức mới vào Qdrant thành công!' : 'Vector embeddings ingested into Qdrant successfully!', { icon: '🤖' });
      setShowIngestModal(false);
      setDocTitle('');
      setDocContent('');
    } catch (e: any) {
      toast.error(e.response?.data?.message || (language === 'vi' ? 'Nạp tri thức thất bại!' : 'Failed to ingest document knowledge!'));
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-muted-foreground">
      {/* Action Header Banner */}
      <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-card shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-primary border border-emerald-500/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-medium text-2xl text-foreground tracking-tight flex items-center gap-2">
              {tAi.aiChatTitle} <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-normal">{tAi.aiChatSubtitle}</p>
          </div>
        </div>

        <Button variant="outline"
          onClick={() => setShowIngestModal(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-medium text-xs shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Database className="w-4 h-4" /> {tAi.btnIngestKnowledge}
        </Button>
      </div>

      {/* Main Chat Frame */}
      <div className="rounded-3xl bg-card border border-border/50 shadow-md overflow-hidden flex flex-col h-[640px]">
        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs bg-card">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-4 rounded-3xl space-y-2 whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-tr-none font-medium shadow-sm'
                    : 'bg-card border border-slate-400/20 text-foreground rounded-tl-none shadow-md'
                }`}
              >
                <div className="leading-relaxed text-sm">
                  {m.text ? m.text : (
                    m.sender === 'ai' && idx === messages.length - 1 ? (
                      <div className="flex items-center gap-1.5 h-5 text-primary opacity-80">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : null
                  )}
                </div>
                {m.docs && m.docs.length > 0 && (
                  <div className="pt-2 border-t border-slate-400/20 text-[11px] text-primary space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> {tAi.refDocsLabel}
                    </p>
                    {m.docs.map((d, dIdx) => (
                      <span key={dIdx} className="inline-block bg-card px-2.5 py-1 rounded-xl border border-emerald-500/30 text-primary font-mono text-[10px] mr-1 font-bold shadow-inner border border-border/50 bg-muted/20">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Suggest Prompts Bar */}
        <div className="px-6 py-3 bg-card border-t border-slate-400/20 flex items-center gap-2 overflow-x-auto text-xs shadow-inner border border-border/50 bg-muted/20">
          <span className="text-foreground font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> {tAi.promptSuggestionsLabel}
          </span>
          {[
            tAi.prompt1,
            tAi.prompt2,
            tAi.prompt3,
          ].map((prompt, pIdx) => (
            <Button variant="outline"
              key={pIdx}
              onClick={() => handleSend(prompt)}
              className="px-3.5 py-1.5 rounded-xl bg-card hover:text-primary text-foreground font-medium border border-slate-400/20 shrink-0 transition-all shadow-sm active:shadow-inner border border-border/50 bg-muted/20 text-xs cursor-pointer"
            >
              {prompt}
            </Button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-card border-t border-slate-400/20 flex items-center gap-3">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={tAi.inputPlaceholder}
            className="flex-1 bg-card border border-slate-300/40 rounded-2xl px-4 py-3 text-xs text-foreground font-normal placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-inner border border-border/50 bg-muted/20"
          />
          <Button variant="outline"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 text-white font-medium text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" /> {tAi.btnSend}
          </Button>
        </div>
      </div>

      {/* Ingest Document Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card rounded-3xl p-6 border border-border/50 shadow-md space-y-5 text-foreground animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-400/20 pb-3">
              <h3 className="font-heading font-medium text-base text-foreground flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" /> {tAi.modalTitle}
              </h3>
              <Button variant="outline" onClick={() => setShowIngestModal(false)} className="p-1.5 rounded-xl bg-card text-slate-400 hover:text-foreground shadow-sm transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleIngest} className="space-y-4 text-xs">
              <div>
                <label className="text-foreground font-medium block mb-1">{tAi.titleLabel}</label>
                <Input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Quy định đổi trả máy lỗi nguồn trong 30 ngày..."
                  className="w-full bg-card border border-slate-300/40 rounded-2xl px-3.5 py-2.5 text-xs text-foreground font-medium placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>

              <div>
                <label className="text-foreground font-medium block mb-1">{tAi.categoryLabel}</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full bg-card border border-slate-300/40 rounded-2xl px-3.5 py-2.5 text-xs text-foreground font-medium shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                >
                  <option value="Chính sách" className="bg-slate-900 text-white">{tAi.catPolicy}</option>
                  <option value="Bán hàng" className="bg-slate-900 text-white">{tAi.catSales}</option>
                  <option value="Sửa chữa" className="bg-slate-900 text-white">{tAi.catRepair}</option>
                  <option value="Khác" className="bg-slate-900 text-white">{tAi.catOther}</option>
                </select>
              </div>

              <div>
                <label className="text-foreground font-medium block mb-1">{tAi.contentLabel}</label>
                <textarea
                  rows={5}
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Nhập toàn bộ nội dung chính sách hoặc quy trình nghiệp vụ..."
                  className="w-full bg-card border border-slate-300/40 rounded-2xl px-3.5 py-2.5 text-xs text-foreground placeholder-slate-400 shadow-inner border border-border/50 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline"
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-card text-muted-foreground hover:text-foreground font-medium shadow-sm active:shadow-inner border border-border/50 bg-muted/20 transition-all cursor-pointer"
                >
                  {tCommon.cancel}
                </Button>
                <Button variant="outline"
                  type="submit"
                  disabled={ingesting}
                  className="flex-[2] py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-medium flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> {ingesting ? tAi.ingesting : tAi.btnIngest}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
