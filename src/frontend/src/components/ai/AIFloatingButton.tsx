import React, { useState, useMemo } from 'react';
import { Bot, Sparkles, X, Send, RotateCcw } from 'lucide-react';
import { aiService } from '../../services/aiService';
import type { AiResponseDto } from '../../services/aiService';
import { useAuthStore } from '@/stores/authStore';
import { useBranchStore } from '@/stores/branchStore';
import { getRoleAiProfile } from './roleAiProfile';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import ReactMarkdown from 'react-markdown';

interface FloatingChatMessage {
  sender: 'user' | 'ai';
  text: string;
  isWelcome?: boolean;
}

export const AIFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { roles } = useAuthStore();
  const { activeBranchName } = useBranchStore();
  const roleProfile = useMemo(() => getRoleAiProfile(roles), [roles]);

  const [messages, setMessages] = useState<FloatingChatMessage[]>([
    { sender: 'ai', text: '', isWelcome: true },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const handleResetChat = () => {
    setConversationId(undefined);
    setMessages([{ sender: 'ai', text: '', isWelcome: true }]);
    toast.success('Đã làm mới phiên chat AI');
  };

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
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-30">
      {/* Floating Button */}
      {!isOpen && (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-card border border-border/50 text-emerald-600 flex items-center justify-center shadow-sm active:shadow-inner border border-border/50 bg-muted/20 hover:scale-105 transition-all duration-300 group relative focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          title="Hỏi nhanh Trợ Lý AI"
          aria-label="Hỏi nhanh Trợ Lý AI"
        >
          <Bot className="w-7 h-7 text-primary group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border border-white">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </span>
        </Button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <Card className="w-[420px] h-[620px] max-w-[calc(100vw-2rem)] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 shadow-2xl">
          {/* Drawer Header */}
          <div className="p-4 border-b border-border/50 flex items-center justify-between shadow-inner border border-border/50 bg-muted/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-card border border-border/50 shadow-sm flex items-center justify-center text-primary shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5 truncate">
                  Trợ Lý AI PhoneShop <Sparkles className="w-3 h-3 text-primary animate-pulse shrink-0" />
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${roleProfile.badgeColor} truncate max-w-[140px]`}>
                    {roleProfile.title}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[110px]">
                    {activeBranchName}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetChat}
                title="Làm mới cuộc trò chuyện"
                className="w-7 h-7 rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                title="Đóng"
                className="w-7 h-7 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Drawer Message Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.isWelcome ? (
                  /* Role-Aware Interactive AI Welcome Message Card */
                  <div className="w-full rounded-2xl bg-gradient-to-b from-card to-muted/20 border border-border/60 shadow-sm p-4 space-y-3.5 text-xs animate-in fade-in duration-200">
                    {/* Welcome Header */}
                    <div className="flex items-start gap-2.5 border-b border-border/40 pb-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-xs text-foreground flex items-center gap-1">
                          Chào mừng bạn đến với <span className="text-primary">Trợ lý AI hỗ trợ PhoneShop!</span> 🤖
                        </h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Hỏi đáp quy trình nghiệp vụ & tra cứu tri thức theo phân quyền tài khoản của bạn.
                        </p>
                      </div>
                    </div>

                    {/* Capabilities Section */}
                    <div className="space-y-1.5">
                      <h5 className="font-bold text-foreground flex items-center gap-1 text-[11px]">
                        <Sparkles className="w-3 h-3 text-primary" /> Bạn có thể nhờ AI hỗ trợ:
                      </h5>
                      <div className="space-y-1.5">
                        {roleProfile.capabilities.map((cap, capIdx) => (
                          <div key={capIdx} className="p-2 rounded-xl bg-card border border-border/50 text-[10px] leading-relaxed text-foreground shadow-sm flex items-start gap-1.5">
                            <span>{cap}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips Section */}
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <h5 className="font-bold text-foreground flex items-center gap-1 text-[11px]">
                        💡 Mẹo để được hỗ trợ tốt nhất:
                      </h5>
                      <div className="space-y-1.5 text-[10px] text-muted-foreground leading-relaxed">
                        <div className="p-2 rounded-xl bg-muted/20 border border-border/30">
                          <strong className="text-foreground">📝 Nhập câu hỏi đầy đủ, rõ ràng và mô tả cụ thể:</strong>
                          <span className="block mt-0.5">
                            Ví dụ: <em>“Làm thế nào để cập nhật trạng thái phiếu sửa chữa sang Đã hoàn thành?”</em> thay vì chỉ gõ tắt <em>“sửa đơn”</em>.
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-muted/20 border border-border/30">
                          <strong className="text-foreground">🔍 Cung cấp mã hoặc thông tin định danh:</strong>
                          <span className="block mt-0.5">
                            Khi cần hỗ trợ về phiếu sửa chữa, hóa đơn, khách hàng, thiết bị hay linh kiện, hãy cung cấp mã (ví dụ: <code>#SO-...</code>, <code>#RT-...</code>, số IMEI hoặc tên máy) để AI xác định chính xác dữ liệu cần tra cứu.
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-muted/20 border border-border/30">
                          <strong className="text-foreground">⚠️ Tránh câu hỏi quá ngắn hoặc viết tắt:</strong>
                          <span className="block mt-0.5">
                            Thông tin càng rõ ràng, AI càng truy xuất đúng tài liệu nghiệp vụ phù hợp.
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-muted/20 border border-border/30">
                          <strong className="text-foreground">🤖 Giới hạn dữ liệu và thẩm quyền:</strong>
                          <span className="block mt-0.5">
                            Trợ lý AI cung cấp thông tin dựa trên dữ liệu và phân quyền của bạn. Một số câu trả lời mang tính tham khảo và có thể chưa bao quát mọi trường hợp.
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-muted/20 border border-border/30">
                          <strong className="text-foreground">📩 Nghiệp vụ quan trọng & xử lý ngoại lệ:</strong>
                          <span className="block mt-0.5">
                            Đối với các vấn đề liên quan đến tiền bạc, thanh toán hoặc xử lý ngoại lệ, vui lòng kiểm tra lại trên hệ thống hoặc liên hệ Quản lý chi nhánh để được hỗ trợ.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl whitespace-pre-wrap ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-sm shadow-sm'
                        : 'bg-card border border-border/50 text-foreground rounded-tl-sm shadow-inner border border-border/50 bg-muted/20'
                    }`}
                  >
                    {m.sender === 'ai' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                    ) : (
                      m.text
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-[11px] text-primary font-medium animate-pulse flex items-center gap-1.5 p-2">
                <Bot className="w-3.5 h-3.5" /> AI đang suy nghĩ...
              </div>
            )}
          </div>

          {/* Drawer Input */}
          <div className="p-3 border-t border-border/50 bg-card flex items-center gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi AI về quy trình, chính sách..."
              className="flex-1 text-xs"
            />
            <Button
              variant="primary"
              size="icon"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
