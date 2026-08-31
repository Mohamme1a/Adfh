import { useState, useEffect, useRef } from "react";
import { 
  ChatSession, 
  Message, 
  Persona, 
  ActiveTab, 
  AttachedImage 
} from "./types";
import { PERSONAS } from "./data/personas";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { ChatView } from "./components/ChatView";
import { ToolsView } from "./components/ToolsView";
import { ImageStudio } from "./components/ImageStudio";
import { PromptsLibraryModal } from "./components/PromptsLibraryModal";

const STORAGE_KEY_SESSIONS = "ai_app_chat_sessions_v1";
const STORAGE_KEY_SETTINGS = "ai_app_settings_v1";

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load sessions from storage", e);
    }
    const initialSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: "محادثة جديدة",
      messages: [],
      personaId: "general",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || "";
  });

  const [selectedPersona, setSelectedPersona] = useState<Persona>(() => {
    const currentSess = sessions.find((s) => s.id === activeSessionId);
    return (
      PERSONAS.find((p) => p.id === currentSess?.personaId) || PERSONAS[0]
    );
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOpenSidebarMobile, setIsOpenSidebarMobile] = useState(false);
  const [showPromptsLibrary, setShowPromptsLibrary] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save sessions to storage", e);
    }
  }, [sessions]);

  // Current active session
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Update persona when active session changes
  useEffect(() => {
    if (currentSession?.personaId) {
      const foundPersona = PERSONAS.find((p) => p.id === currentSession.personaId);
      if (foundPersona) {
        setSelectedPersona(foundPersona);
      }
    }
  }, [activeSessionId, currentSession?.personaId]);

  // Handle New Session
  const handleNewSession = (personaId: string = "general") => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: "محادثة جديدة",
      messages: [],
      personaId: personaId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    const persona = PERSONAS.find((p) => p.id === personaId) || PERSONAS[0];
    setSelectedPersona(persona);
    setActiveTab("chat");
  };

  // Handle Delete Session
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      if (updated.length === 0) {
        const fallback: ChatSession = {
          id: `session_${Date.now()}`,
          title: "محادثة جديدة",
          messages: [],
          personaId: "general",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        return [fallback];
      }
      return updated;
    });

    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  // Handle Pin Session
  const handlePinSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  // Handle Rename Session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  // Handle Clear All Sessions
  const handleClearAllSessions = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف جميع المحادثات المسجلة؟")) {
      const freshSession: ChatSession = {
        id: `session_${Date.now()}`,
        title: "محادثة جديدة",
        messages: [],
        personaId: "general",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions([freshSession]);
      setActiveSessionId(freshSession.id);
    }
  };

  // Handle Clear Current Chat Messages
  const handleClearCurrentChat = () => {
    if (window.confirm("هل تريد تفريغ رسائل هذه المحادثة؟")) {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [] } : s))
      );
    }
  };

  // Handle Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // Turn off isStreaming on the latest assistant message
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        const msgs = [...s.messages];
        if (msgs.length > 0 && msgs[msgs.length - 1].role === "assistant") {
          msgs[msgs.length - 1] = {
            ...msgs[msgs.length - 1],
            isStreaming: false,
          };
        }
        return { ...s, messages: msgs };
      })
    );
  };

  // Handle Send Message in Chat
  const handleSendMessage = async (content: string, images?: AttachedImage[]) => {
    if (!content.trim() && (!images || images.length === 0)) return;

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content,
      images,
      timestamp: Date.now(),
    };

    const assistantMessagePlaceholder: Message = {
      id: `msg_asst_${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    };

    // Calculate intelligent session title if this is the first user message
    let autoTitle = currentSession.title;
    if (
      currentSession.messages.length === 0 ||
      currentSession.title === "محادثة جديدة"
    ) {
      autoTitle = content.slice(0, 30) + (content.length > 30 ? "..." : "");
    }

    const updatedMessages = [...currentSession.messages, userMessage];

    // Optimistically update session with user message and placeholder
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          title: autoTitle,
          updatedAt: Date.now(),
          messages: [...updatedMessages, assistantMessagePlaceholder],
        };
      })
    );

    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
            images: m.images?.map((img) => ({
              data: img.data,
              mimeType: img.mimeType,
            })),
          })),
          systemInstruction: selectedPersona.systemPrompt,
          temperature,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(
          errJson.error || `خطأ في الخادم (${response.status})`
        );
      }

      if (!response.body) {
        throw new Error("لم يتم استلام استجابة من الخادم");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const dataContent = trimmed.replace(/^data:\s*/, "");
          if (dataContent === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(dataContent);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulatedText += parsed.text;
              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id !== activeSessionId) return s;
                  const msgs = [...s.messages];
                  const lastIdx = msgs.length - 1;
                  if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
                    msgs[lastIdx] = {
                      ...msgs[lastIdx],
                      content: accumulatedText,
                      isStreaming: true,
                    };
                  }
                  return { ...s, messages: msgs };
                })
              );
            }
          } catch (jsonErr: any) {
            if (jsonErr?.message && jsonErr.message !== "Unexpected end of JSON input") {
              console.warn("Parse chunk warning:", jsonErr);
            }
          }
        }
      }

      // Mark streaming completed
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          const msgs = [...s.messages];
          const lastIdx = msgs.length - 1;
          if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: accumulatedText || "تم إنهاء الاستجابة بنجاح.",
              isStreaming: false,
            };
          }
          return { ...s, messages: msgs };
        })
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Streaming aborted by user");
        return;
      }
      console.error("Chat Stream Error:", err);
      const errMessage = err?.message || "حدث خطأ غير متوقع أثناء الاتصال بالذكاء الاصطناعي";

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          const msgs = [...s.messages];
          const lastIdx = msgs.length - 1;
          if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: `عذراً، حدث خطأ: ${errMessage}`,
              error: true,
              isStreaming: false,
            };
          }
          return { ...s, messages: msgs };
        })
      );
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Handle Retry Last Assistant Message
  const handleRetryLastMessage = () => {
    if (currentSession.messages.length < 2) return;
    const msgs = [...currentSession.messages];
    // Pop failed assistant message
    if (msgs[msgs.length - 1].role === "assistant") {
      msgs.pop();
    }
    const lastUserMsg = msgs.pop();
    if (lastUserMsg && lastUserMsg.role === "user") {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, messages: msgs } : s
        )
      );
      handleSendMessage(lastUserMsg.content, lastUserMsg.images);
    }
  };

  // Export Chat
  const handleExportChat = (format: "markdown" | "json" | "text") => {
    if (!currentSession || currentSession.messages.length === 0) return;

    let content = "";
    let mimeType = "text/plain";
    let extension = "txt";

    if (format === "json") {
      content = JSON.stringify(currentSession, null, 2);
      mimeType = "application/json";
      extension = "json";
    } else if (format === "markdown") {
      content = `# ${currentSession.title}\n\n*تاريخ المحادثة: ${new Date(
        currentSession.createdAt
      ).toLocaleString("ar-SA")}*\n\n---\n\n`;
      currentSession.messages.forEach((m) => {
        const sender = m.role === "user" ? "👤 **المستخدم**" : "🤖 **المساعد الذكي**";
        content += `${sender} (${new Date(m.timestamp).toLocaleTimeString("ar-SA")}):\n\n${m.content}\n\n---\n\n`;
      });
      mimeType = "text/markdown";
      extension = "md";
    } else {
      content = `=== ${currentSession.title} ===\n\n`;
      currentSession.messages.forEach((m) => {
        const sender = m.role === "user" ? "المستخدم" : "المساعد الذكي";
        content += `[${sender}]: ${m.content}\n\n`;
      });
      mimeType = "text/plain";
      extension = "txt";
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat_${currentSession.id}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle Persona Selection
  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, personaId: persona.id } : s
      )
    );
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans dir-rtl">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        activeTab={activeTab}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onPinSession={handlePinSession}
        onRenameSession={handleRenameSession}
        onClearAll={handleClearAllSessions}
        selectedPersona={selectedPersona}
        onSelectPersona={handleSelectPersona}
        onChangeTab={(tab) => setActiveTab(tab)}
        isOpenMobile={isOpenSidebarMobile}
        onCloseMobile={() => setIsOpenSidebarMobile(false)}
      />

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          selectedPersona={selectedPersona}
          currentSession={currentSession}
          onToggleSidebar={() => setIsOpenSidebarMobile(!isOpenSidebarMobile)}
          onClearCurrentChat={handleClearCurrentChat}
          onExportChat={handleExportChat}
          temperature={temperature}
          onTemperatureChange={setTemperature}
        />

        <main className="flex-1 flex flex-col min-h-0 relative">
          {activeTab === "chat" && (
            <ChatView
              messages={currentSession?.messages || []}
              persona={selectedPersona}
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
              onStopStreaming={handleStopStreaming}
              onOpenLibrary={() => setShowPromptsLibrary(true)}
              onRetryLastMessage={handleRetryLastMessage}
            />
          )}

          {activeTab === "image" && (
            <ImageStudio
              onSendToChat={(text, imageBase64) => {
                setActiveTab("chat");
                const attachedImgs = imageBase64 ? [{
                  id: `img_${Date.now()}`,
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
                  mimeType: "image/png"
                }] : undefined;
                handleSendMessage(text, attachedImgs);
              }}
            />
          )}

          {activeTab === "tools" && (
            <ToolsView
              onSendToChat={(text) => {
                setActiveTab("chat");
                handleSendMessage(text);
              }}
            />
          )}

          {activeTab === "library" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
              <PromptsLibraryModal
                isOpen={true}
                onClose={() => setActiveTab("chat")}
                onSelectPrompt={(prompt, autoSend) => {
                  setActiveTab("chat");
                  if (autoSend) {
                    handleSendMessage(prompt);
                  }
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* Prompts Library Modal (Triggerable from Chat Input) */}
      <PromptsLibraryModal
        isOpen={showPromptsLibrary}
        onClose={() => setShowPromptsLibrary(false)}
        onSelectPrompt={(prompt, autoSend) => {
          if (autoSend) {
            handleSendMessage(prompt);
          }
        }}
      />
    </div>
  );
}
