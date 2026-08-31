import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const PORT = 3000;

// Lazy initialization for GoogleGenAI
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Chat Streaming Endpoint
  app.post("/api/chat/stream", async (req, res) => {
    try {
      const {
        messages,
        systemInstruction = "أنت مساعد ذكاء اصطناعي عربي ذكي ومفيد ومتعدد المهارات. أجب بدقة وتنسيق جميل وبشكل واضح.",
        temperature = 0.7,
      } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "قائمة الرسائل مطلوبة (messages array is required)" });
      }

      const ai = getGenAI();

      // Convert messages to Gemini format
      const contents = messages.map((msg: {
        role: "user" | "model" | "assistant";
        content: string;
        images?: { data: string; mimeType: string }[];
      }) => {
        const parts: any[] = [];

        if (msg.images && msg.images.length > 0) {
          for (const img of msg.images) {
            // Strip data:image/...;base64, prefix if present
            let cleanBase64 = img.data;
            if (cleanBase64.includes(",")) {
              cleanBase64 = cleanBase64.split(",")[1];
            }
            parts.push({
              inlineData: {
                data: cleanBase64,
                mimeType: img.mimeType || "image/jpeg",
              },
            });
          }
        }

        if (msg.content) {
          parts.push({ text: msg.content });
        }

        return {
          role: msg.role === "assistant" ? "model" : msg.role,
          parts: parts.length > 0 ? parts : [{ text: "" }],
        };
      });

      // Set headers for Server-Sent Events (SSE)
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.7-flash",
        contents,
        config: {
          systemInstruction,
          temperature: Number(temperature) || 0.7,
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text || "";
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      const errorMessage = error?.message || "حدث خطأ غير متوقع أثناء معالجة الطلب";
      
      if (!res.headersSent) {
        res.status(500).json({ error: errorMessage });
      } else {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
      }
    }
  });

  // Specialized Tool Generation Endpoint
  app.post("/api/tools/execute", async (req, res) => {
    try {
      const {
        toolType,
        input,
        options = {},
      } = req.body;

      if (!input) {
        return res.status(400).json({ error: "نص الإدخال مطلوب (Input text is required)" });
      }

      const ai = getGenAI();

      let systemInstruction = "أنت خبير ذكاء اصطناعي محترف.";
      let userPrompt = input;

      switch (toolType) {
        case "rewrite":
          const tone = options.tone || "احترافي ورسمي";
          const length = options.length || "متوسط";
          systemInstruction = `أنت كاتب ومحرر نصوص محترف باللغة العربية. أعد صياغة النص المعطى بنبرة: (${tone})، وبطول: (${length}). حافظ على المعنى الأساسي مع تحسين الجماليات البلاغية والوضوح. قدم 2-3 خيارات مختلفة لإعادة الصياغة مع شرح الفروق.`;
          userPrompt = `النص الأصلي المراد إعادة صياغته:\n"""${input}"""`;
          break;

        case "summarize":
          const summaryType = options.type || "نقاط رئيسية مع خلاصة تنفيذية";
          systemInstruction = `أنت خبير تلخيص وتحليل وثائق. قم بتلخيص النص التالي بأسلوب (${summaryType}). استخرج أهم الأفكار، الإحصائيات، والتوصيات التنفيذية بدقة متناهية وترتيب أنيق.`;
          userPrompt = `النص المطلوب تلخيصه:\n"""${input}"""`;
          break;

        case "grammar":
          systemInstruction = `أنت مدقق لغوي وخبير في النحو والصرف والإملاء العربي. 
قم بتدقيق النص التالي:
1. اعرض النص المصحح بالكامل مع التشكيل المناسب.
2. ضع جدولاً أو قائمة بالأخطاء المكتشفة، نوع الخطأ (إملائي / نحوي / ترقيم)، التصحيح، وسبب التصحيح.
3. قدم نصائح عامة لتحسين صياغة النص.`;
          userPrompt = `النص المراد تدقيقه:\n"""${input}"""`;
          break;

        case "diacritize":
          systemInstruction = `أنت مدقق لغوي وعالم في الإعراب وتشكيل النصوص العربية. قم بوضع حركات التشكيل الكاملة والدقيقة والصحيحة إعرابياً على النص المعطى بدون أي زيادة أو حذف لكلمات النص. بعد النص المشكول، اذكر إعراباً موجزاً لأبرز الكلمات المؤثرة.`;
          userPrompt = `النص لتشكيله:\n"""${input}"""`;
          break;

        case "code":
          const lang = options.language || "TypeScript / Python";
          systemInstruction = `أنت مهندس برمجيات ومطور خبير. قم بتحليل الطلب البرمجي، توليد الكود النظيف والموثق مع أفضل الممارسات، وشرح طريقة العمل، وكيفية التعامل مع الأخطاء.`;
          userPrompt = `المهمة البرمجية (اللغة: ${lang}):\n${input}`;
          break;

        case "translate":
          const targetLang = options.targetLanguage || "العربية";
          const sourceLang = options.sourceLanguage || "تلقائي";
          systemInstruction = `أنت مترجم فوري محترف ومتقن للمصطلحات الأدبية والتقنية والأكاديمية. ترجم النص من (${sourceLang}) إلى (${targetLang}) بترجمة طبيعية ومحكمة، مع توفير توضيحات لأي تعبيرات اصطلاحية (Idioms).`;
          userPrompt = `النص للترجمة:\n"""${input}"""`;
          break;

        case "ideas":
          systemInstruction = `أنت مستشار ابتكار وعصف ذهني إبداعي واستراتيجي. قم بتوليد أفكار إبداعية، واقعية وقابلة للتطبيق مع تفصيل خطة العمل والفرص والتحديات لكل فكرة.`;
          userPrompt = `الموضوع للعصف الذهني:\n${input}`;
          break;

        case "vision":
          systemInstruction = `أنت خبير تحليل صور ورؤية حاسوبية. قم بتحليل الصورة بدقة، وصف عناصرها، استخراج أي نصوص موجودة بها، وتقديم معلومات سياقية عميقة ومفيدة.`;
          userPrompt = input;
          break;

        default:
          systemInstruction = "أنت مساعد ذكاء اصطناعي ذكي وشامل.";
          userPrompt = input;
          break;
      }

      // If image is attached in options
      let contentsPayload: any = userPrompt;
      if (options.images && options.images.length > 0) {
        const parts: any[] = [];
        for (const img of options.images) {
          let cleanBase64 = img.data;
          if (cleanBase64.includes(",")) {
            cleanBase64 = cleanBase64.split(",")[1];
          }
          parts.push({
            inlineData: {
              data: cleanBase64,
              mimeType: img.mimeType || "image/jpeg",
            },
          });
        }
        parts.push({ text: userPrompt });
        contentsPayload = { parts };
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: contentsPayload,
        config: {
          systemInstruction,
          temperature: Number(options.temperature) || 0.7,
        },
      });

      res.json({
        result: response.text || "",
        toolType,
      });
    } catch (error: any) {
      console.error("Tool Execution Error:", error);
      res.status(500).json({
        error: error?.message || "فشل تنفيذ الأداة، يرجى التحقق من المدخلات ومحاولة ذلك مرة أخرى",
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Studio Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
