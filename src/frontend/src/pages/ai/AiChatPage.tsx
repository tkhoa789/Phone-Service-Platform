import React, { useState, useMemo } from 'react';
import { aiService } from '../../services/aiService';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useBranchStore } from '@/stores/branchStore';
import { i18nDictionary } from '../../locales/dictionary';
import type { AiResponseDto } from '../../services/aiService';
import { Bot, Sparkles, Send, FileText, Database, X, CheckCircle2, RotateCcw, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ReactMarkdown from 'react-markdown';
import { getRoleAiProfile } from '@/components/ai/roleAiProfile';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  docs?: string[];
  isWelcome?: boolean;
}

export const AiChatPage: React.FC = () => {
  const { language } = useThemeStore();
  const { can, roles, user } = useAuthStore();
  const { activeBranchName } = useBranchStore();
  const canIngest = can('AI.ANALYTICS');
  const tAi = i18nDictionary[language].aiChat;
  const tCommon = i18nDictionary[language].common;

  // Role Profile & Scope mapping
  const roleProfile = useMemo(() => getRoleAiProfile(roles), [roles]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: '',
      isWelcome: true,
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

  const handleResetChat = () => {
    setConversationId(undefined);
    setMessages([
      {
        sender: 'ai',
        text: '',
        isWelcome: true,
      },
    ]);
    toast.success('Đã làm mới phiên trò chuyện với Trợ lý AI');
  };

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
    <div className="w-full h-[calc(100vh-12.5rem)] min-h-[450px] flex flex-col font-sans text-muted-foreground overflow-hidden">
      {/* Main Chat Frame - Viewport Fitted */}
      <div className="w-full flex-1 rounded-3xl bg-card border border-border/50 shadow-md overflow-hidden flex flex-col">
        {/* Integrated Chat Header Bar */}
        <div className="px-5 py-3.5 border-b border-border/50 flex items-center justify-between bg-card/80 backdrop-blur-sm shrink-0 shadow-inner border-border/40 bg-muted/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5 truncate">
                {tAi.aiChatTitle} <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse shrink-0" />
              </h1>
              <p className="text-[11px] text-muted-foreground truncate hidden md:block">{tAi.aiChatSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={handleResetChat}
              className="px-3 py-1.5 rounded-xl bg-card hover:text-primary text-foreground font-medium text-xs shadow-sm border border-border/50 flex items-center gap-1.5 cursor-pointer"
              title="Làm mới cuộc trò chuyện"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Làm mới
            </Button>

            {canIngest && (
              <Button
                variant="outline"
                onClick={() => setShowIngestModal(true)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-medium text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" /> {tAi.btnIngestKnowledge}
              </Button>
            )}
          </div>
        </div>

        {/* Messages Body (Only this area scrolls) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs bg-card">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`w-full max-w-4xl xl:max-w-5xl mx-auto flex ${
                m.isWelcome
                  ? 'justify-center'
                  : m.sender === 'user'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              {m.isWelcome ? (
                /* Role-Aware Interactive AI Welcome Message Card */
                <div className="w-full rounded-3xl bg-gradient-to-b from-card to-muted/20 border border-border/60 shadow-md p-5 sm:p-7 space-y-6 text-xs animate-in fade-in duration-300">
                  {/* Header Title */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                        <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-heading font-bold text-sm sm:text-base md:text-lg text-foreground leading-snug">
                          Chào mừng bạn đến với <span className="text-primary">Trợ lý AI hỗ trợ PhoneShop!</span> 🤖
                        </h2>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-normal">
                          Hệ thống hỏi đáp quy trình nghiệp vụ & tra cứu tri thức dựa trên công nghệ RAG và LLM nội bộ.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <span className={`px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold tracking-tight shrink-0 ${roleProfile.badgeColor}`}>
                        {roleProfile.title}
                      </span>
                      <span className="text-[11px] sm:text-xs font-mono px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40 text-muted-foreground">
                        {activeBranchName}
                      </span>
                    </div>
                  </div>

                  {/* Capabilities Section */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-foreground flex items-center gap-2 text-xs sm:text-sm">
                      <Sparkles className="w-4 h-4 text-primary shrink-0" />
                      Bạn có thể nhờ AI hỗ trợ những gì trong vai trò của mình:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {roleProfile.capabilities.map((cap, capIdx) => (
                        <div key={capIdx} className="p-3.5 rounded-2xl bg-card border border-border/50 text-[11px] sm:text-xs leading-relaxed text-foreground shadow-sm flex items-start gap-2.5">
                          <span className="flex-1">{cap}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips Section */}
                  <div className="space-y-3 pt-4 border-t border-border/40">
                    <h3 className="font-bold text-foreground flex items-center gap-2 text-xs sm:text-sm">
                      💡 Mẹo để được hỗ trợ tốt nhất:
                    </h3>
                    <div className="space-y-2.5 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                      <div className="flex items-start gap-3 bg-muted/15 p-3 rounded-2xl border border-border/30">
                        <span className="text-base shrink-0">📝</span>
                        <div>
                          <strong className="text-foreground">Hãy nhập câu hỏi đầy đủ, rõ ràng và mô tả cụ thể vấn đề:</strong>
                          <span className="block text-muted-foreground mt-0.5">
                            Ví dụ: <em>“Làm thế nào để cập nhật trạng thái phiếu sửa chữa sang Đã hoàn thành?”</em> thay vì chỉ gõ tắt <em>“sửa đơn”</em>.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-muted/15 p-3 rounded-2xl border border-border/30">
                        <span className="text-base shrink-0">🔍</span>
                        <div>
                          <strong className="text-foreground">Cung cấp mã hoặc thông tin định danh liên quan:</strong>
                          <span className="block text-muted-foreground mt-0.5">
                            Khi cần hỗ trợ về phiếu sửa chữa, hóa đơn, khách hàng, thiết bị hay linh kiện, hãy cung cấp mã (ví dụ: <code>#SO-20260</code>, <code>#RT-001</code>, số IMEI hoặc tên máy) để AI xác định chính xác dữ liệu cần tra cứu.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-muted/15 p-3 rounded-2xl border border-border/30">
                        <span className="text-base shrink-0">⚠️</span>
                        <div>
                          <strong className="text-foreground">Tránh câu hỏi quá ngắn hoặc viết tắt:</strong>
                          <span className="block text-muted-foreground mt-0.5">
                            Thông tin càng rõ ràng và đầy đủ ngữ cảnh, AI càng truy xuất đúng tài liệu nghiệp vụ phù hợp.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-muted/15 p-3 rounded-2xl border border-border/30">
                        <span className="text-base shrink-0">🤖</span>
                        <div>
                          <strong className="text-foreground">Phạm vi dữ liệu và thẩm quyền:</strong>
                          <span className="block text-muted-foreground mt-0.5">
                            Trợ lý AI hoạt động dựa trên tri thức nội bộ và phân quyền RBAC được cấp cho tài khoản của bạn. Một số câu trả lời mang tính chất tham khảo hoặc chưa bao quát toàn bộ trường hợp ngoại lệ.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-muted/15 p-3 rounded-2xl border border-border/30">
                        <span className="text-base shrink-0">📩</span>
                        <div>
                          <strong className="text-foreground">Nghiệp vụ quan trọng & xử lý ngoại lệ:</strong>
                          <span className="block text-muted-foreground mt-0.5">
                            Đối với các thao tác liên quan đến tiền bạc, thanh toán, hủy giao dịch hoặc dữ liệu khách hàng quan trọng, vui lòng kiểm tra lại trên hệ thống hoặc liên hệ Quản lý chi nhánh có thẩm quyền để được hỗ trợ.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular Chat Messages */
                <div
                  className={`max-w-[85%] md:max-w-2xl lg:max-w-3xl p-4 rounded-3xl space-y-2 whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-tr-none font-medium shadow-sm'
                      : 'bg-card border border-slate-400/20 text-foreground rounded-tl-none shadow-md'
                  }`}
                >
                  <div className="leading-relaxed text-sm">
                    {m.text ? (
                      m.sender === 'ai' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                          <ReactMarkdown>{m.text}</ReactMarkdown>
                        </div>
                      ) : (
                        m.text
                      )
                    ) : (
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
              )}
            </div>
          ))}
        </div>

        {/* Input Bar (No Prompt Suggestions Bar) */}
        <div className="p-4 bg-card border-t border-slate-400/20 shrink-0">
          <div className="w-full max-w-4xl xl:max-w-5xl mx-auto flex items-center gap-3">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={tAi.inputPlaceholder}
              className="flex-1 bg-card border border-slate-300/40 rounded-2xl px-4 py-3 text-xs text-foreground font-normal placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-inner border border-border/50 bg-muted/20"
            />
            <Button
              variant="outline"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 text-white font-medium text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" /> {tAi.btnSend}
            </Button>
          </div>
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
