import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";
import { ToolType } from "../types";
import { speakText, stopSpeaking } from "../utils/speech";
import {
  PenTool,
  FileText,
  CheckCheck,
  Code2,
  Languages,
  Lightbulb,
  Image as ImageIcon,
  Send,
  Loader2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Upload,
  X,
  Sparkles,
  RefreshCw,
  BookOpen
} from "lucide-react";

interface ToolsViewProps {
  onSendToChat?: (text: string) => void;
}

export function ToolsView({ onSendToChat }: ToolsViewProps) {
  const [selectedTool, setSelectedTool] = useState<ToolType>("rewrite");
  const [inputContent, setInputContent] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Tool Specific Options
  const [rewriteTone, setRewriteTone] = useState("احترافي ورسمي");
  const [rewriteLength, setRewriteLength] = useState("متوسط");
  const [summaryType, setSummaryType] = useState("نقاط رئيسية مع خلاصة تنفيذية");
  const [codeLanguage, setCodeLanguage] = useState("TypeScript / React");
  const [sourceLang, setSourceLang] = useState("تلقائي");
  const [targetLang, setTargetLang] = useState("العربية");
  
  // Vision Image
  const [imageFile, setImageFile] = useState<{ data: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toolsList: {
    id: ToolType;
    name: string;
    description: string;
    icon: any;
    color: string;
  }[] = [
    {
      id: "rewrite",
      name: "إعادة الصياغة والكتابة",
      description: "تحسين الأسلوب، تغيير النبرة، وزيادة البلاغة والتأثير",
      icon: PenTool,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    },
    {
      id: "summarize",
      name: "الملخص والتحليل الذكي",
      description: "استخراج أهم الأفكار والنتائج التنفيذية من المقالات والوثائق",
      icon: FileText,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    },
    {
      id: "grammar",
      name: "التدقيق اللغوي والإملائي",
      description: "اكتشاف وتصحيح الأخطاء النحوية والإملائية مع الشرح",
      icon: CheckCheck,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    },
    {
      id: "diacritize",
      name: "تشكيل النصوص وإعرابها",
      description: "ضبط الحركات الإعرابية التامة للنصوص العربية بدقة",
      icon: BookOpen,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    },
    {
      id: "code",
      name: "مساعد البرمجة والأكواد",
      description: "توليد، شرح، واكتشاف الأخطاء وتحديث الشيفرات البرمجية",
      icon: Code2,
      color: "text-violet-400 bg-violet-500/10 border-violet-500/30",
    },
    {
      id: "translate",
      name: "الترجمة الفورية الدقيقة",
      description: "ترجمة ذكية سياقية تحافظ على المعنى والمصطلحات الفنية",
      icon: Languages,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    },
    {
      id: "vision",
      name: "تحليل الصور والرؤية",
      description: "وصف الصور، استخراج النصوص (OCR)، وتفسير المخططات",
      icon: ImageIcon,
      color: "text-pink-400 bg-pink-500/10 border-pink-500/30",
    },
    {
      id: "ideas",
      name: "العصف الذهني والاستراتيجية",
      description: "توليد أفكار مبتكرة، خطط عمل، واستراتيجيات تسويقية",
      icon: Lightbulb,
      color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    },
  ];

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("يرجى رفع ملف صورة صالح (JPEG/PNG/WebP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setImageFile({
          data: e.target.result,
          name: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExecute = async () => {
    if (!inputContent.trim() && !imageFile) {
      setError("يرجى إدخال النص أو إرفاق صورة قبل التنفيذ");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payloadOptions: any = {
        tone: rewriteTone,
        length: rewriteLength,
        type: summaryType,
        language: codeLanguage,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      };

      if (imageFile) {
        payloadOptions.images = [
          {
            data: imageFile.data,
            mimeType: "image/jpeg",
          },
        ];
      }

      const res = await fetch("/api/tools/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolType: selectedTool,
          input: inputContent || (imageFile ? "يرجى تحليل هذه الصورة بالتفصيل واستخراج ما فيها." : ""),
          options: payloadOptions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل تنفيذ الأداة");
      }

      setResult(data.result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "حدث خطأ أثناء معالجة الطلب");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSpeak = () => {
    if (!result) return;
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(result, "ar-SA", () => {
        setIsSpeaking(false);
      });
    }
  };

  const currentToolMeta = toolsList.find((t) => t.id === selectedTool)!;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
                استوديو أدوات الذكاء الاصطناعي
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              أدوات متخصصة وفائقة الدقة لمعالجة النصوص، الترجمة، البرمجة، والتحليل المتقدم
            </p>
          </div>
        </div>

        {/* Tools Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {toolsList.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setSelectedTool(tool.id);
                  setResult(null);
                  setError(null);
                }}
                className={`flex flex-col items-start p-3.5 sm:p-4 rounded-xl border text-right transition-all ${
                  isSelected
                    ? "bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                }`}
              >
                <div className={`p-2 rounded-lg border mb-2.5 ${tool.color}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="font-bold text-xs sm:text-sm text-slate-100">
                  {tool.name}
                </span>
                <span className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {tool.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tool Workspace Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="flex flex-col rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-200">
                  {currentToolMeta.name}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {inputContent.length} حرف
              </span>
            </div>

            {/* Dynamic Controls based on selected tool */}
            {selectedTool === "rewrite" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium">النبرة والأسلوب:</label>
                  <select
                    value={rewriteTone}
                    onChange={(e) => setRewriteTone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="احترافي ورسمي">احترافي ورسمي (Professional)</option>
                    <option value="إبداعي وبلاغي جذاب">إبداعي وبلاغي جذاب (Creative)</option>
                    <option value="موجز ومباشر">موجز ومباشر (Concise)</option>
                    <option value="أكاديمي وعلمي">أكاديمي وعلمي (Academic)</option>
                    <option value="تسويقي ومقنع">تسويقي ومقنع (Persuasive)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium">الطول المطلوب:</label>
                  <select
                    value={rewriteLength}
                    onChange={(e) => setRewriteLength(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="نفس الطول الأصلي">نفس الطول تقريباً</option>
                    <option value="أقصر وأكثر تركيزاً">أقصر وأكثر تركيزاً</option>
                    <option value="موسع وتفصيلي">موسع وتفصيلي</option>
                  </select>
                </div>
              </div>
            )}

            {selectedTool === "summarize" && (
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
                <label className="block text-slate-400 mb-1.5 font-medium">نوع التلخيص:</label>
                <select
                  value={summaryType}
                  onChange={(e) => setSummaryType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="نقاط رئيسية مع خلاصة تنفيذية">نقاط رئيسية مع خلاصة تنفيذية (Executive Summary)</option>
                  <option value="فقرة واحدة مركزة جداً">فقرة واحدة مركزة جداً (One-Paragraph TL;DR)</option>
                  <option value="قائمة بالقرارات والإجراءات العملية">قائمة بالإجراءات العملية والقرارات (Action Items)</option>
                  <option value="جدول مقارنة للأفكار الرئيسية">جدول تفصيلي للأفكار والمفاهيم (Structured Table)</option>
                </select>
              </div>
            )}

            {selectedTool === "code" && (
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
                <label className="block text-slate-400 mb-1.5 font-medium">لغة البرمجة أو الإطار:</label>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="TypeScript / React">TypeScript / React</option>
                  <option value="Python (FastAPI, Pandas, AI)">Python</option>
                  <option value="JavaScript (Node.js)">JavaScript / Node.js</option>
                  <option value="SQL (PostgreSQL / MySQL)">SQL Database Query</option>
                  <option value="HTML / Tailwind CSS">HTML / Tailwind CSS</option>
                  <option value="C# / .NET">C# / .NET</option>
                  <option value="Java / Kotlin">Java / Kotlin</option>
                  <option value="Golang / Rust">Golang / Rust</option>
                </select>
              </div>
            )}

            {selectedTool === "translate" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium">من لغة:</label>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="تلقائي (كشف تلقائي)">تلقائي (Auto Detect)</option>
                    <option value="الإنجليزية (English)">الإنجليزية</option>
                    <option value="العربية (Arabic)">العربية</option>
                    <option value="الفرنسية (French)">الفرنسية</option>
                    <option value="الألمانية (German)">الألمانية</option>
                    <option value="الإسبانية (Spanish)">الإسبانية</option>
                    <option value="التركية (Turkish)">التركية</option>
                    <option value="الصينية (Chinese)">الصينية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium">إلى لغة:</label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="العربية الفصحى (Arabic)">العربية الفصحى</option>
                    <option value="الإنجليزية (English)">الإنجليزية</option>
                    <option value="الفرنسية (French)">الفرنسية</option>
                    <option value="الألمانية (German)">الألمانية</option>
                    <option value="الإسبانية (Spanish)">الإسبانية</option>
                    <option value="التركية (Turkish)">التركية</option>
                    <option value="الصينية (Chinese)">الصينية</option>
                  </select>
                </div>
              </div>
            )}

            {/* Vision Tool Upload Area */}
            {(selectedTool === "vision" || imageFile) && (
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {imageFile ? (
                  <div className="relative p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={imageFile.data}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs text-slate-300 truncate max-w-[200px]">
                        {imageFile.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl bg-slate-950/40 hover:bg-slate-950/80 transition-all text-center group"
                  >
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 mb-2 transition-colors" />
                    <p className="text-xs font-semibold text-slate-300">
                      اضغط لاختيار صورة أو اسحبها إلى هنا
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      يدعم PNG, JPG, WebP للتحليل والتعرف على النصوص
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Input Textarea */}
            <div className="flex-1 flex flex-col min-h-[220px]">
              <textarea
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder={
                  selectedTool === "rewrite"
                    ? "الصق النص المراد إعادة صياغته وتحسين أسلوبه هنا..."
                    : selectedTool === "summarize"
                    ? "الصق المقال أو التقرير أو الوثيقة التي تريد تلخيصها هنا..."
                    : selectedTool === "grammar"
                    ? "الصق النص المراد فحصه وتدقيقه إملائياً ونحوياً..."
                    : selectedTool === "diacritize"
                    ? "الصق النص العربي المراد تشكيله وضبط حركاته..."
                    : selectedTool === "code"
                    ? "اكتب ما تريده من الكود أو الصق الكود الذي به خطأ أو يحتاج إلى تحسين..."
                    : selectedTool === "translate"
                    ? "الصق النص المراد ترجمته بدقة..."
                    : selectedTool === "ideas"
                    ? "اكتب فكرة مشروعك، سؤالك، أو موضوع العصف الذهني..."
                    : "اكتب تعليمات إضافية حول الصورة أو السؤال..."
                }
                className="w-full flex-1 min-h-[200px] p-4 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y leading-relaxed"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setInputContent("");
                  setImageFile(null);
                  setResult(null);
                  setError(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                مسح الحقول
              </button>

              <button
                type="button"
                onClick={handleExecute}
                disabled={loading || (!inputContent.trim() && !imageFile)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري المعالجة بالذكاء الاصطناعي...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 rotate-180" />
                    <span>تنفيذ الأداة</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Panel */}
          <div className="flex flex-col rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg min-h-[400px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-sm text-slate-200">
                  النتيجة الذكية
                </span>
              </div>

              {result && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSpeak}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      isSpeaking
                        ? "bg-indigo-600/30 text-indigo-400"
                        : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                    title={isSpeaking ? "إيقاف القراءة" : "استماع للنتيجة"}
                  >
                    {isSpeaking ? (
                      <VolumeX className="w-4 h-4 text-indigo-400 animate-pulse" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                    title="نسخ النتيجة"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {onSendToChat && (
                    <button
                      type="button"
                      onClick={() => onSendToChat(result)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                    >
                      إرسال للمحادثة
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center py-16 space-y-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-sm font-medium">يقوم الذكاء الاصطناعي بصياغة النتيجة...</p>
                  <p className="text-xs text-slate-500">يتم تطبيق خوارزميات اللغة والتحليل المتقدمة</p>
                </div>
              ) : result ? (
                <div className="markdown-body text-sm text-slate-200 leading-relaxed space-y-3">
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
                    {result}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center text-slate-500 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">لا توجد نتيجة حتى الآن</p>
                  <p className="text-xs max-w-xs text-slate-500">
                    اختر الأداة المناسبة، املأ الحقول واضغط على «تنفيذ الأداة» لتوليد النتيجة الفورية
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
