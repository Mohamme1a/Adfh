# Arabic AI Studio - Native Android App (Kotlin & Jetpack Compose)

تطبيق Android أصلي بالكامل مبني باستخدام **Kotlin** و **Jetpack Compose (Material 3)**، مع الحفاظ على نفس التصميم الأنيق، والوظائف المتقدمة، وبدون الحاجة لفتح المتصفح.

---

## 📱 مميزات التطبيق الأصلي (Native Android Features)

1. **واجهة Jetpack Compose حديثة**:
   - دعم الوضع الداكن بتدرجات الألوان المتناسقة (Slate & Indigo).
   - دعم اتجاه الواجهة من اليمين إلى اليسار (RTL) للغة العربية بالكامل.
   - تنقل سلس بين شاشات المحادثة الذكية، استوديو الأدوات، ومكتبة الأوامر.

2. **تكامل Gemini API الأصلي**:
   - استخدام مكتبة `com.google.ai.client.generativeai:generativeai` الرسمية من Google.
   - دعم البث المباشر للردود (Streaming Responses) في الوقت الفعلي عبر Kotlin Flow.
   - ضبط درجة الإبداع (Temperature) ومفتاح API من داخل التطبيق.

3. **قاعدة بيانات Room Database**:
   - تخزين محلي غير متزامن للمحادثات والجلسات والرسائل.
   - إمكانية تثبيت المحادثات، إعادة تسميتها، وتفريغها أو حذفها.

4. **إدخال وإخراج صوتي أصلي**:
   - التعرف التلقائي على الصوت العربي عبر `SpeechRecognizer` بضغطة زر.
   - قراءة الردود صوتياً باستخدام محرك `TextToSpeech` الأصلي للنظام.

5. **إرفاق وتحليل الصور (Vision)**:
   - اختيار الصور مباشرة من معرض الجهاز أو الكاميرا وإرسالها للنموذج للتحليل.

---

## 🛠️ متطلبات التشغيل والبناء (Building & Running)

- **Android Studio**: الإصدار الحديث (Iguana / Jellyfish / Koala أو أحدث).
- **JDK**: Java 17 أو Java 21.
- **Android SDK**: Min SDK 24 (Android 7.0+), Target SDK 34.

### خطوات التشغيل:
1. افتح مجلد `android/` في **Android Studio**.
2. انتظر مزامنة Gradle (`Sync Project with Gradle Files`).
3. اضغط على زر **Run ▶** لتشغيل التطبيق على المحاكي (Emulator) أو على هاتفك الحقيقي.
4. (اختياري) لإنشاء ملف APK قابل للتثبيت:
   ```bash
   ./gradlew assembleDebug
   ```
   سيكون الملف الناتج في: `app/build/outputs/apk/debug/app-debug.apk`.
