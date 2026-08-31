import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  value: string;
}

export function CodeBlock({ language = "text", value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-md dir-ltr text-left">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/90 border-b border-slate-700/80 text-xs text-slate-300 font-mono">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium text-slate-200 lowercase">{language || "code"}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
          title="نسخ الكود"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">تم النسخ</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>نسخ</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-slate-100 selection:bg-indigo-600/40">
        <pre className="m-0 p-0 whitespace-pre">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}
