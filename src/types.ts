export type Role = "user" | "assistant" | "system";

export interface AttachedImage {
  id: string;
  data: string; // base64 string
  mimeType: string;
  name?: string;
  size?: number;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  images?: AttachedImage[];
  isStreaming?: boolean;
  error?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  personaId: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

export interface Persona {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  badge: string;
  systemPrompt: string;
  suggestedPrompts: string[];
}

export interface PromptTemplate {
  id: string;
  category: "coding" | "writing" | "business" | "education" | "marketing" | "productivity" | "creative";
  categoryAr: string;
  title: string;
  prompt: string;
  icon: string;
}

export type ActiveTab = "chat" | "tools" | "library";

export type ToolType = 
  | "rewrite"
  | "summarize"
  | "grammar"
  | "diacritize"
  | "code"
  | "translate"
  | "ideas"
  | "vision";

export interface ToolConfig {
  id: ToolType;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  placeholder: string;
  actionText: string;
}
