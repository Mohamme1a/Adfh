import { useState, useRef } from "react";
import {
  Sparkles,
  Palette,
  Upload,
  Download,
  RefreshCw,
  X,
  Image as ImageIcon,
  Copy,
  Check,
  Wand2,
  Layers,
  ZoomIn,
  AlertCircle,
  Clock,
  Send
} from "lucide-react";
import { GeneratedImageRecord } from "../types";

interface ImageStudioProps {
  onSendToChat?: (text: string, imageBase64?: string) => void;
}

export function ImageStudio({ onSendToChat }: ImageStudioProps) {
  const [prompt, setPrompt] = useState("");
  const [inputImageBase64, setInputImageBase64] = useState<string | null>(null);
  const [inputImageName, setInputImageName] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageSize, setImageSize] = useState("1K");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<GeneratedImageRecord | null>(null);
  const [history, setHistory] = useState<GeneratedImageRecord[]>([]);
  const [copied, setCopied] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatios = [
    { value: "1:1", label: "مربع (1:1)", icon: "1:1" },
    { value: "16:9", label: "عريض (16:9)", icon: "16:9" },
    { value: "9:16", label: "طولي ستوري (9:16)", icon: "9:16" },
    { value: "4:3", label: "كلاسيكي (4:3)", icon: "4:3" },
    { value: "3:4", label: "بورتريه (3:4)", icon: "3:4" },
  ];

  const imageSizes = [
    { value: "1K", label: "عالي الوضوح (1K)", desc: "متوازن وسريع" },
    { value: "2K", label: "فائق الجودة (2K)", desc: "تفاصيل فائقة" },
    { value: "512px", label: "سريع (512px)", desc: "توليد فوري" },
  ];

  const samplePrompts = [
    {
      title: "منظر طبيعي خيالي",
      prompt: "لوحة فنية زاهية لمنظر طبيعي ساحر في وقت الغروب مع جبال شاهقة وبحيرة كريستالية هادئة وأشجار صنوبر بأسلوب ألوان زيتية راقٍ وفائق التفاصيل",
      tag: "طبيعة"
    },
    {
      title: "رائد فضاء عربي مستقبلي",
      prompt: "رائد فضاء عربي يستكشف كوكباً غامضاً مليئاً بالبلورات المضيئة بأسلوب سايبربانك مع إضاءات نيون مستقبلية وإخراج سينمائي واقعي بدقة عالية",
      tag: "خيال علمي"
    },
    {
      title: "شخصية كرتونية لطيفة",
      prompt: "قطة بيضاء كرتونية لطيفة ثلاثية الأبعاد ترتدي نظارات دائرية وتقرأ كتاباً قديماً داخل مكتبة دافئة بإضاءة سينمائية ساحرة 3D Pixar Style",
      tag: "رسوم متحركة"
    },
    {
      title: "شعار تقني ثلاثي الأبعاد",
      prompt: "تصميم شعار عصري ثلاثي الأبعاد لعلامة تجارية متطورة في مجال الذكاء الاصطناعي مع تدرجات لونية زجاجية ونيون على خلفية داكنة فخمة 3D Render",
      tag: "تصميم وشعارات"
    },
    {
      title: "فنجان قهوة عربية تراثي",
      prompt: "فنجان قهوة عربية أصيلة على طاولة خشبية عتيقة مزخرفة مع دلة نحاسية وبخار متصاعد بدقة تصوير واقعية 4K مع إضاءة شمسية ناعمة",
      tag: "تراث وواقعية"
    },
    {
      title: "مدينة ذكية عربية 2050",
      prompt: "مدينة ذكية متطورة ذات عمارة عربية مستقبلية مع جسور معلقة وسيارات طائرة وحدائق رأسية خضراء في سماء صافية بدقة سينمائية",
      tag: "مستقبل"
    }
  ];

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setInputImageBase64(base64);
      setInputImageName(file.name);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage("يرجى كتابة وصف للصورة المطلوبة أولاً.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageBase64: inputImageBase64 || undefined,
          aspectRatio,
          imageSize,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل توليد الصورة من الخادم");
      }

      const newRecord: GeneratedImageRecord = {
        id: `img_${Date.now()}`,
        prompt: prompt.trim(),
        imageUrl: data.imageUrl,
        description: data.description,
        timestamp: Date.now(),
        isEdited: Boolean(inputImageBase64),
        aspectRatio,
      };

      setCurrentResult(newRecord);
      setHistory((prev) => [newRecord, ...prev]);
    } catch (err: any) {
      console.error("Image generation error:", err);
      setErrorMessage(err.message || "حدث خطأ غير متوقع أثناء توليد الصورة.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadImage = (url: string, filename = "ArabicAI_Image.png") => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyBase64 = () => {
    if (!currentResult) return;
    navigator.clipboard.writeText(currentResult.imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/20 p-5 sm:p-6 shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20 shrink-0">
                <Palette className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                    استوديو توليد وتعديل الصور بالذكاء الاصطناعي
                  </h2>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-900/80 text-indigo-300 border border-indigo-700/50">
                    Gemini 3.1 Flash Image
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                  أنشئ صوراً فنية وتصميمات رقمية مذهلة من وصفك المباشر، أو ارفع أي صورة لتعديلها وإضافة عناصر جديدة بدقة فائقة.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Control Panel & Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Form & Inputs (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Image Upload for Editing */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>{inputImageBase64 ? "الصورة المختارة للتعديل:" : "تعديل صورة من جهازك (اختياري):"}</span>
                </label>
                {inputImageBase64 && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputImageBase64(null);
                      setInputImageName("");
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>إلغاء الصورة</span>
                  </button>
                )}
              </div>

              {inputImageBase64 ? (
                <div className="relative rounded-xl overflow-hidden border border-indigo-500/40 bg-slate-950 h-44 flex items-center justify-center group">
                  <img
                    src={inputImageBase64}
                    alt="Uploaded Base"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute bottom-2 right-2 bg-slate-900/90 text-[11px] text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                    {inputImageName || "صورة للتعديل"}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-xl p-5 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/80 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-800/80 group-hover:bg-indigo-950/80 group-hover:text-indigo-400 text-slate-400 flex items-center justify-center transition-colors">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-300 group-hover:text-indigo-300 transition-colors">
                        اسحب وأفلت صورة هنا أو اضغط للاختيار من جهازك
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        يدعم PNG, JPG, WebP لتعديل الصور وإضافة عناصر بالذكاء الاصطناعي
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Textarea */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-indigo-400" />
                  <span>{inputImageBase64 ? "تعليمات التعديل والإضافة على الصورة:" : "وصف الصورة المطلوبة بالتفصيل:"}</span>
                </label>
                {prompt && (
                  <button
                    type="button"
                    onClick={() => setPrompt("")}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    مسح النص
                  </button>
                )}
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  inputImageBase64
                    ? "مثال: أضف سماء مرصعة بالنجوم وقمراً بدراً مضيئاً، وحوّل الألوان إلى درجات دافئة وغروب ساحر..."
                    : "مثال: لوحة زيتية لشخص عربي يقرأ في واحة خضراء وسط رمال ذهبية في وقت الغروب بدقة 4K واقعية..."
                }
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all leading-relaxed"
              />

              {/* Inspiration Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-medium text-slate-400 block">
                  أفكار مقترحة للإلهام السريع:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {samplePrompts.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(s.prompt)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-950/80 hover:text-indigo-300 text-slate-300 border border-slate-700/50 transition-colors text-right truncate max-w-xs"
                      title={s.prompt}
                    >
                      ✨ {s.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generation Settings (Aspect Ratio & Image Size) */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-4">
              {/* Aspect Ratio */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>أبعاد الصورة (Aspect Ratio):</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {aspectRatios.map((ar) => (
                    <button
                      key={ar.value}
                      type="button"
                      onClick={() => setAspectRatio(ar.value)}
                      className={`p-2 rounded-xl text-center border text-xs font-medium transition-all ${
                        aspectRatio === ar.value
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850"
                      }`}
                    >
                      <div className="font-bold text-xs">{ar.icon}</div>
                      <div className="text-[10px] opacity-80 truncate">{ar.label.split(" ")[0]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Resolution */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>دقة وحجم الصورة (Image Size):</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {imageSizes.map((sz) => (
                    <button
                      key={sz.value}
                      type="button"
                      onClick={() => setImageSize(sz.value)}
                      className={`p-2 rounded-xl text-right border text-xs transition-all ${
                        imageSize === sz.value
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850"
                      }`}
                    >
                      <div className="font-bold">{sz.value}</div>
                      <div className="text-[10px] opacity-80">{sz.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Main Action Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    {inputImageBase64
                      ? "جاري تعديل الصورة عبر Gemini 3.1 Flash Image..."
                      : "جاري إنشاء الصورة بالذكاء الاصطناعي..."}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {inputImageBase64
                      ? "تعديل الصورة بالذكاء الاصطناعي الآن"
                      : "إنشاء الصورة بالذكاء الاصطناعي"}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Generated Preview & Result (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>معاينة الصورة الناتجة</span>
                </h3>
                {currentResult && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                    تم الإنشاء بنجاح
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="h-80 rounded-xl border border-indigo-500/20 bg-slate-950 flex flex-col items-center justify-center gap-4 text-center p-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    <Sparkles className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-200">
                      جاري المعالجة والتوليد الفني...
                    </p>
                    <p className="text-xs text-slate-500 max-w-xs">
                      يقوم نموذج Gemini 3.1 Flash Image بمعالجة الوصف والألوان والتفاصيل البصرية بدقة عالية
                    </p>
                  </div>
                </div>
              ) : currentResult ? (
                <div className="space-y-4">
                  {/* Image Display */}
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
                    <img
                      src={currentResult.imageUrl}
                      alt={currentResult.prompt}
                      className="w-full h-auto max-h-96 object-contain mx-auto"
                    />
                    
                    {/* Floating Zoom Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(true)}
                      className="absolute top-3 left-3 p-2 rounded-lg bg-slate-900/80 text-slate-200 hover:text-white border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                      title="تكبير الصورة"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>

                  {currentResult.description && (
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                      {currentResult.description}
                    </p>
                  )}

                  {/* Actions Toolbar */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadImage(currentResult.imageUrl, `ArabicAI_${Date.now()}.png`)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>حفظ الصورة</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isLoading}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>إعادة التوليد</span>
                    </button>

                    {onSendToChat && (
                      <button
                        type="button"
                        onClick={() => onSendToChat(`هذه الصورة التي تم إنشاؤها عبر Gemini 3.1 Flash Image بالوصف التالي:\n"${currentResult.prompt}"`, currentResult.imageUrl)}
                        className="col-span-2 sm:col-span-1 py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-indigo-500/30 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>للمحادثة</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-80 rounded-xl border border-slate-800/80 bg-slate-950/40 flex flex-col items-center justify-center gap-3 text-center p-6 text-slate-500">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-400">
                      لم يتم إنشاء صورة بعد
                    </p>
                    <p className="text-[11px] text-slate-600 max-w-xs">
                      اكتب وصفاً أو اختر أحد النماذج المقترحة واضغط على إنشاء بالذكاء الاصطناعي لمعاينة النتيجة هنا
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* History Gallery */}
            {history.length > 0 && (
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>سجل الصور المنشأة في الجلسة ({history.length})</span>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setCurrentResult(item)}
                      className={`relative rounded-lg overflow-hidden border cursor-pointer group aspect-square bg-slate-950 ${
                        currentResult?.id === item.id
                          ? "border-indigo-500 ring-2 ring-indigo-500/30"
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                      title={item.prompt}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Modal Zoom Preview */}
      {previewZoom && currentResult && (
        <div
          onClick={() => setPreviewZoom(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewZoom(false)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 p-2 rounded-full bg-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={currentResult.imageUrl}
              alt={currentResult.prompt}
              className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
            />
            <p className="text-xs text-slate-300 mt-3 text-center max-w-2xl bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-800">
              {currentResult.prompt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
