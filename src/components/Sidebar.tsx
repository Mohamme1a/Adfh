import { useState } from "react";
import { ChatSession, Persona, ActiveTab } from "../types";
import { PERSONAS } from "../data/personas";
import {
  MessageSquarePlus,
  Bot,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Sparkles,
  Wrench,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Sliders,
  PanelLeftClose,
  Code2,
  PenTool,
  GraduationCap,
  Briefcase,
  BookOpen
} from "lucide-react";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  activeTab: ActiveTab;
  onSelectSession: (id: string) => void;
  onNewSession: (personaId?: string) => void;
  onDeleteSession: (id: string) => void;
  onPinSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  selectedPersona: Persona;
  onSelectPersona: (persona: Persona) => void;
  onChangeTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const personaIcons: Record<string, any> = {
  Sparkles,
  Code2,
  PenTool,
  GraduationCap,
  Briefcase,
  BookOpen,
};

export function Sidebar({
  sessions,
  activeSessionId,
  activeTab,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onPinSession,
  onRenameSession,
  onClearAll,
  selectedPersona,
  onSelectPersona,
  onChangeTab,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showPersonasModal, setShowPersonasModal] = useState(false);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const recentSessions = filteredSessions.filter((s) => !s.isPinned);

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent) => {
    e?.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 right-0 z-50 w-72 sm:w-80 bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100 block leading-tight">
                تطبيق الذكاء الاصطناعي
              </span>
              <span className="text-[11px] text-indigo-400 font-medium">
                Gemini 3.7 Flash Engine
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-200 lg:hidden rounded-lg hover:bg-slate-800"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="p-3.5 space-y-2">
          <button
            type="button"
            onClick={() => {
              onNewSession(selectedPersona.id);
              onChangeTab("chat");
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all active:scale-[0.98]"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>محادثة جديدة</span>
          </button>

          {/* Navigation Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                onChangeTab("chat");
                onCloseMobile();
              }}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "chat"
                  ? "bg-slate-800 text-indigo-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              المحادثة
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeTab("tools");
                onCloseMobile();
              }}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "tools"
                  ? "bg-slate-800 text-indigo-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              الأدوات
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeTab("library");
                onCloseMobile();
              }}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "library"
                  ? "bg-slate-800 text-indigo-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              الأوامر
            </button>
          </div>
        </div>

        {/* Persona Selector Pill */}
        <div className="px-3.5 pb-2">
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">الشخصية النشطة:</span>
              <button
                type="button"
                onClick={() => setShowPersonasModal(!showPersonasModal)}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                <span>تغيير</span>
                <Sliders className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 truncate">
                {selectedPersona.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-medium">
                {selectedPersona.badge}
              </span>
            </div>
          </div>
        </div>

        {/* Persona Quick Picker Dropdown/Modal */}
        {showPersonasModal && (
          <div className="px-3.5 pb-2 space-y-1.5 max-h-48 overflow-y-auto">
            {PERSONAS.map((p) => {
              const Icon = personaIcons[p.icon] || Sparkles;
              const isSelected = selectedPersona.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectPersona(p);
                    setShowPersonasModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all text-right ${
                    isSelected
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                      : "bg-slate-800/40 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-semibold truncate">{p.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{p.badge}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search bar */}
        <div className="px-3.5 py-1">
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="بحث في سجل المحادثات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Chat History Sessions List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-2 space-y-4">
          {/* Pinned Sessions */}
          {pinnedSessions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
                <Pin className="w-3 h-3 text-amber-400" />
                <span>المثبتة</span>
              </span>
              {pinnedSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={activeSessionId === session.id && activeTab === "chat"}
                  isEditing={editingId === session.id}
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  onSelect={() => {
                    onSelectSession(session.id);
                    onChangeTab("chat");
                    onCloseMobile();
                  }}
                  onPin={(e) => {
                    e.stopPropagation();
                    onPinSession(session.id);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  onStartRename={(e) => handleStartRename(session, e)}
                  onSaveRename={() => handleSaveRename(session.id)}
                  onCancelRename={() => setEditingId(null)}
                />
              ))}
            </div>
          )}

          {/* Recent Sessions */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 px-2">
              سجل المحادثات ({recentSessions.length})
            </span>
            {recentSessions.length === 0 && pinnedSessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                لا توجد محادثات سابقة
              </div>
            ) : (
              recentSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={activeSessionId === session.id && activeTab === "chat"}
                  isEditing={editingId === session.id}
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  onSelect={() => {
                    onSelectSession(session.id);
                    onChangeTab("chat");
                    onCloseMobile();
                  }}
                  onPin={(e) => {
                    e.stopPropagation();
                    onPinSession(session.id);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  onStartRename={(e) => handleStartRename(session, e)}
                  onSaveRename={() => handleSaveRename(session.id)}
                  onCancelRename={() => setEditingId(null)}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        {sessions.length > 0 && (
          <div className="p-3 border-t border-slate-800 bg-slate-900/60">
            <button
              type="button"
              onClick={onClearAll}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح كل المحادثات</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (val: string) => void;
  onSelect: () => void;
  onPin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onStartRename: (e: React.MouseEvent) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
}

function SessionItem({
  session,
  isActive,
  isEditing,
  editTitle,
  setEditTitle,
  onSelect,
  onPin,
  onDelete,
  onStartRename,
  onSaveRename,
  onCancelRename,
}: SessionItemProps) {
  if (isEditing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSaveRename();
        }}
        className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg"
      >
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="flex-1 px-2 py-1 bg-slate-950 text-xs text-slate-200 rounded border border-indigo-500 focus:outline-none"
          autoFocus
        />
        <button
          type="button"
          onClick={onSaveRename}
          className="p-1 text-emerald-400 hover:bg-slate-700 rounded"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onCancelRename}
          className="p-1 text-slate-400 hover:bg-slate-700 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </form>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
        isActive
          ? "bg-slate-800 text-indigo-300 font-semibold shadow-sm border border-slate-700/80"
          : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
      }`}
    >
      <span className="truncate pr-1 flex-1 leading-snug">
        {session.title || "محادثة بدون عنوان"}
      </span>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onPin}
          className={`p-1 rounded hover:bg-slate-700 ${
            session.isPinned ? "text-amber-400 opacity-100" : "text-slate-400"
          }`}
          title={session.isPinned ? "إلغاء التثبيت" : "تثبيت المحادثة"}
        >
          <Pin className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={onStartRename}
          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          title="إعادة التسمية"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded hover:bg-rose-900/50 text-slate-400 hover:text-rose-400"
          title="حذف المحادثة"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
