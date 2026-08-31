import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "../types";
import { CodeBlock } from "./CodeBlock";
import { speakText, stopSpeaking } from "../utils/speech";
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Sparkles,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface MessageItemProps {
  message: Message;
  personaName?: string;
  onRetry?: () => void;
}

export function MessageItem({ message, personaName = "المساعد الذكي", onRetry }: MessageItemProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message", err);
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(message.content, "ar-SA", () => {
        setIsSpeaking(false);
      });
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`group flex gap-3.5 sm:gap-4 py-5 px-3.5 sm:px-6 transition-colors ${
        isUser
          ? "bg-slate-900/40 border-b border-slate-800/40"
          : "bg-slate-900/90 border-b border-slate-800/80"
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        {isUser ? (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <User className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/10">
            <Sparkles className="w-5 h-5 animate-pulse text-indigo-200" />
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm sm:text-base text-slate-100">
              {isUser ? "أنت" : personaName}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            {!isUser && (
              <button
                type="button"
                onClick={handleSpeak}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  isSpeaking
                    ? "bg-indigo-600/30 text-indigo-400"
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
                title={isSpeaking ? "إيقاف القراءة" : "استماع للنص"}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 text-indigo-400 animate-pulse" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              title="نسخ الرسالة"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Attached Images */}
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pt-1 pb-2">
            {message.images.map((img) => (
              <div
                key={img.id}
                className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-800/80 shadow-sm max-w-xs group/img"
              >
                <img
                  src={img.data}
                  alt={img.name || "Attached"}
                  className="max-h-48 w-auto object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
                {img.name && (
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[10px] text-slate-300 px-2 py-0.5 truncate font-mono">
                    {img.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message Body */}
        {message.error ? (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{message.content}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 text-rose-100 text-xs font-semibold transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة المحاولة</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="markdown-body text-sm sm:text-base text-slate-200 leading-relaxed overflow-hidden">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");

                  if (!inline && (match || codeString.includes("\n"))) {
                    return (
                      <CodeBlock
                        language={match ? match[1] : ""}
                        value={codeString}
                      />
                    );
                  }

                  return (
                    <code
                      className="px-1.5 py-0.5 rounded-md bg-slate-800 text-indigo-300 font-mono text-[0.9em] border border-slate-700/60"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>

            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1 align-middle rounded-sm" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
