import { useState, useRef, useEffect } from "react";
import { Message, Persona, AttachedImage } from "../types";
import { MessageItem } from "./MessageItem";
import { isSpeechRecognitionSupported, createSpeechRecognizer } from "../utils/speech";
import {
  Send,
  Square,
  Sparkles,
  Paperclip,
  Mic,
  MicOff,
  Image as ImageIcon,
  X,
  BookMarked,
  ArrowDown,
  RotateCcw,
  Bot,
  AlertTriangle
} from "lucide-react";

interface ChatViewProps {
  messages: Message[];
  persona: Persona;
  isStreaming: boolean;
  onSendMessage: (content: string, images?: AttachedImage[]) => void;
  onStopStreaming: () => void;
  onOpenLibrary: () => void;
  onRetryLastMessage?: () => void;
}

export function ChatView({
  messages,
  persona,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  onOpenLibrary,
  onRetryLastMessage,
}: ChatViewProps) {
  const [input, setInput] = useState("");
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  useEffect(() => {
    if (isStreaming) {
      scrollToBottom(false);
    }
  }, [messages, isStreaming]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  // Send message
  const handleSend = () => {
    if ((!input.trim() && attachedImages.length === 0) || isStreaming) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    onSendMessage(input.trim(), attachedImages);
    setInput("");
    setAttachedImages([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle File / Image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === "string") {
          const newImg: AttachedImage = {
            id: `img_${Date.now()}_${Math.random()}`,
            data: event.target.result,
            mimeType: file.type,
            name: file.name,
            size: file.size,
          };
          setAttachedImages((prev) => [...prev, newImg]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Voice Input Speech Recognition
  const toggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert("التعرف على الصوت غير مدعوم في هذا المتصفح. يرجى تجربة Google Chrome.");
      return;
    }

    try {
      const recognition = createSpeechRecognizer(
        (transcript, isFinal) => {
          if (isFinal) {
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        },
        (err) => {
          console.error("Speech Recognition Error:", err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        },
        "ar-SA"
      );

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden relative">
      {/* Messages Scroll Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-slate-800/40"
      >
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 text-center space-y-6">
            <div className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 text-indigo-400 shadow-xl">
              <Sparkles className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                مرحباً بك في {persona.name}
              </h2>
              <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
                {persona.description}
              </p>
            </div>

            {/* Suggested Prompts Cards */}
            <div className="pt-4 text-right">
              <span className="text-xs font-bold text-slate-400 block mb-3 px-1">
                اقتراحات لبدء المحادثة:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {persona.suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendMessage(prompt)}
                    className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 text-right text-xs sm:text-sm text-slate-200 hover:text-white transition-all shadow-sm group flex items-start justify-between gap-2"
                  >
                    <span className="leading-relaxed">{prompt}</span>
                    <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 flex-shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages List */
          <div className="max-w-4xl mx-auto w-full">
            {messages.map((msg, index) => (
              <MessageItem
                key={msg.id || index}
                message={msg}
                personaName={persona.name}
                onRetry={
                  msg.error && index === messages.length - 1
                    ? onRetryLastMessage
                    : undefined
                }
              />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-28 left-6 p-2.5 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition-all z-20 animate-bounce"
          title="الانتقال إلى أسفل المحادثة"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Attached Images Preview */}
          {attachedImages.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {attachedImages.map((img) => (
                <div
                  key={img.id}
                  className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0 group"
                >
                  <img
                    src={img.data}
                    alt={img.name || "Preview"}
                    className="w-16 h-16 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 left-1 p-1 bg-slate-950/80 hover:bg-rose-600 text-white rounded-full text-xs transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Listening Indicator Bar */}
          {isListening && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>جاري الاستماع لصوتك باللغة العربية... تحدث الآن</span>
              </div>
              <button
                type="button"
                onClick={toggleVoice}
                className="font-bold underline hover:text-white"
              >
                إيقاف
              </button>
            </div>
          )}

          {/* Main Input Box */}
          <div className="relative rounded-2xl bg-slate-950/90 border border-slate-700/80 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 shadow-inner flex flex-col transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك أو استفسارك هنا، أو استخدم الصوت أو ارفع صورة..."
              className="w-full bg-transparent px-4 pt-3.5 pb-2 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none resize-none min-h-[48px] max-h-[200px] leading-relaxed"
            />

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
              <div className="flex items-center gap-1">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                {/* Attach Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                  title="إرفاق صورة للتحليل"
                >
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`p-2 rounded-xl transition-colors ${
                    isListening
                      ? "bg-rose-600 text-white animate-pulse"
                      : "text-slate-400 hover:text-indigo-400 hover:bg-slate-800"
                  }`}
                  title={isListening ? "إيقاف الميكروفون" : "التحدث بالصوت"}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>

                {/* Prompt Library Quick Button */}
                <button
                  type="button"
                  onClick={onOpenLibrary}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="فتح مكتبة الأوامر الجاهزة"
                >
                  <BookMarked className="w-4 h-4" />
                  <span className="hidden sm:inline">مكتبة الأوامر</span>
                </button>
              </div>

              {/* Send or Stop Button */}
              <div>
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={onStopStreaming}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-rose-600/30 transition-all"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>إيقاف التوليد</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() && attachedImages.length === 0}
                    className="flex items-center justify-center p-2 sm:px-4 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4 rotate-180 sm:ml-1.5" />
                    <span className="hidden sm:inline">إرسال</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>مدعوم بنموذج الذكاء الاصطناعي Gemini 3.7 Flash</span>
            <span>اضغط Enter للإرسال و Shift+Enter لسطر جديد</span>
          </div>
        </div>
      </div>
    </div>
  );
}
