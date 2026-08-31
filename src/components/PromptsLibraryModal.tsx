import { useState } from "react";
import { PROMPT_LIBRARY } from "../data/promptsLibrary";
import { PromptTemplate } from "../types";
import { 
  Sparkles, 
  Search, 
  Copy, 
  Check, 
  Send, 
  X,
  Code2,
  FileText,
  Briefcase,
  GraduationCap,
  Share2,
  CheckSquare
} from "lucide-react";

interface PromptsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string, autoSend?: boolean) => void;
}

export function PromptsLibraryModal({ isOpen, onClose, onSelectPrompt }: PromptsLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: "all", label: "الكل" },
    { id: "coding", label: "برمجة وتطوير", icon: Code2 },
    { id: "writing", label: "كتابة ومحتوى", icon: FileText },
    { id: "business", label: "أعمال واستراتيجية", icon: Briefcase },
    { id: "education", label: "تعليم ودراسة", icon: GraduationCap },
    { id: "marketing", label: "تسويق وإعلانات", icon: Share2 },
    { id: "productivity", label: "إنتاجية", icon: CheckSquare },
  ];

  const filteredPrompts = PROMPT_LIBRARY.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryAr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">مكتبة الأوامر الذكية (Prompts Library)</h2>
              <p className="text-xs text-slate-400">نماذج أوامر جاهزة ومصممة لتحقيق أفضل نتائج مع الذكاء الاصطناعي</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-5 border-b border-slate-800/80 space-y-3 bg-slate-900/50">
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث في مكتبة الأوامر (بالعنوان، الكلمات الدلالية، أو التصنيف)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrompts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              لا توجد أوامر مطابقة لعملية البحث
            </div>
          ) : (
            filteredPrompts.map((item: PromptTemplate) => (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/50 hover:bg-slate-800/90 transition-all shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-950/70 text-indigo-300 border border-indigo-800/50">
                      {item.categoryAr}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.prompt)}
                      className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                      title="نسخ الأمر"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300/90 line-clamp-3 leading-relaxed font-sans bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                    {item.prompt}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-700/50 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPrompt(item.prompt, false);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 transition-colors"
                  >
                    تعديل في المحادثة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPrompt(item.prompt, true);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 transition-all"
                  >
                    <Send className="w-3.5 h-3.5 rotate-180" />
                    <span>إرسال مباشر</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
