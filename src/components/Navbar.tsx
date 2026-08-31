import { useState } from "react";
import { ActiveTab, Persona, ChatSession } from "../types";
import {
  Sparkles,
  Menu,
  MessageSquare,
  Palette,
  Wrench,
  BookMarked,
  Download,
  Share2,
  Trash2,
  Sliders,
  Check,
  Languages,
  Moon,
  Sun
} from "lucide-react";

interface NavbarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  selectedPersona: Persona;
  currentSession?: ChatSession;
  onToggleSidebar: () => void;
  onClearCurrentChat?: () => void;
  onExportChat?: (format: "markdown" | "json" | "text") => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
}

export function Navbar({
  activeTab,
  onChangeTab,
  selectedPersona,
  currentSession,
  onToggleSidebar,
  onClearCurrentChat,
  onExportChat,
  temperature,
  onTemperatureChange,
}: NavbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

  return (
    <header className="h-16 px-4 sm:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-30 sticky top-0">
      {/* Left: Sidebar Toggle & App Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 lg:hidden transition-colors"
          title="فتح القائمة الجانبية"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/15">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2 leading-tight">
              <span>تطبيق الذكاء الاصطناعي</span>
              <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                FLASH 3.6
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[200px] md:max-w-xs">
              {activeTab === "chat"
                ? selectedPersona.name
                : activeTab === "image"
                ? "استوديو الصور (Gemini 3.1 Flash Image)"
                : activeTab === "tools"
                ? "استوديو الأدوات التخصصية"
                : "مكتبة الأوامر الجاهزة"}
            </p>
          </div>
        </div>
      </div>

      {/* Center: Main App Tabs */}
      <div className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => onChangeTab("chat")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "chat"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>المحادثة الذكية</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab("image")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "image"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>توليد وتعديل الصور</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab("tools")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "tools"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>أدوات الذكاء</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab("library")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "library"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          }`}
        >
          <BookMarked className="w-3.5 h-3.5" />
          <span>مكتبة الأوامر</span>
        </button>
      </div>

      {/* Right: Actions & Settings */}
      <div className="flex items-center gap-2">
        {/* Export Dropdown */}
        {activeTab === "chat" && currentSession && currentSession.messages.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowExport(!showExport);
                setShowSettings(false);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="تصدير المحادثة"
            >
              <Download className="w-4 h-4" />
            </button>

            {showExport && (
              <div className="absolute left-0 mt-2 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-1.5 z-50 text-xs space-y-1">
                <span className="block px-2.5 py-1 text-[10px] text-slate-500 font-bold uppercase">
                  تصدير المحادثة
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onExportChat?.("markdown");
                    setShowExport(false);
                  }}
                  className="w-full text-right px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200"
                >
                  ملف Markdown (.md)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportChat?.("text");
                    setShowExport(false);
                  }}
                  className="w-full text-right px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200"
                >
                  ملف نصي (.txt)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportChat?.("json");
                    setShowExport(false);
                  }}
                  className="w-full text-right px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200"
                >
                  بيانات JSON (.json)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Clear Current Chat */}
        {activeTab === "chat" && currentSession && currentSession.messages.length > 0 && (
          <button
            type="button"
            onClick={onClearCurrentChat}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="تفريغ المحادثة الحالية"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Parameters / Creativity Settings */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowSettings(!showSettings);
              setShowExport(false);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="إعدادات النموذج والإبداع"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {showSettings && (
            <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50 text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200">إعدادات الذكاء الاصطناعي</span>
                <span className="text-[10px] text-indigo-400 font-mono">Gemini 3.6 Flash</span>
              </div>

              {/* Temperature Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">درجة الإبداع (Temperature):</span>
                  <span className="font-mono text-indigo-300 font-semibold">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>دقيق ومنطقي</span>
                  <span>متوازن</span>
                  <span>إبداعي ومتنوع</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                يتم توليد الردود بسرعة فائقة عبر خوادم Gemini السحابية.
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
