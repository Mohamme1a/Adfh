package com.aistudio.arabicai.data.repository

import android.graphics.Bitmap
import android.util.Base64
import android.util.Log
import com.aistudio.arabicai.data.model.AttachedImage
import com.aistudio.arabicai.data.model.Message
import com.aistudio.arabicai.data.model.MessageRole
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.ByteArrayOutputStream
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit

class GeminiRepository(
    private var apiKey: String = ""
) {
    companion object {
        const val DEFAULT_MODEL = "gemini-3.6-flash"
        private const val BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
        private const val TAG = "GeminiRepository"
    }

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    fun setApiKey(newKey: String) {
        apiKey = newKey.trim()
    }

    fun getApiKey(): String = apiKey

    /**
     * Generate text with Server-Sent Events (SSE) stream using gemini-3.6-flash.
     * Uses robust JSON parsing to prevent Kotlin Serialization MissingFieldException.
     */
    fun generateStream(
        messages: List<Message>,
        systemInstruction: String,
        temperature: Float = 0.7f,
        modelName: String = DEFAULT_MODEL
    ): Flow<String> = flow {
        val currentKey = apiKey.trim()
        if (currentKey.isBlank()) {
            emit("⚠️ تنبيه: يرجى إدخال مفتاح Gemini API Key في شاشة الإعدادات لتفعيل المحادثة.")
            return@flow
        }

        try {
            val url = "$BASE_URL/$modelName:streamGenerateContent?alt=sse&key=$currentKey"

            // Construct JSON request body safely
            val requestJson = JSONObject()

            // System Instruction
            if (systemInstruction.isNotBlank()) {
                val sysInstructionObj = JSONObject()
                val sysParts = JSONArray()
                sysParts.put(JSONObject().put("text", systemInstruction))
                sysInstructionObj.put("parts", sysParts)
                requestJson.put("systemInstruction", sysInstructionObj)
            }

            // Generation Config
            val genConfig = JSONObject()
            genConfig.put("temperature", temperature.toDouble())
            requestJson.put("generationConfig", genConfig)

            // Contents (History + Latest Message)
            val contentsArray = JSONArray()
            messages.forEach { msg ->
                val contentObj = JSONObject()
                contentObj.put("role", if (msg.role == MessageRole.USER) "user" else "model")
                val partsArray = JSONArray()

                // Add text part
                if (msg.content.isNotBlank()) {
                    partsArray.put(JSONObject().put("text", msg.content))
                }

                // Add image parts if present
                msg.images.forEach { attachedImg ->
                    attachedImg.bitmap?.let { bmp ->
                        val base64Str = bitmapToBase64(bmp)
                        if (base64Str.isNotEmpty()) {
                            val inlineData = JSONObject()
                            inlineData.put("mimeType", "image/jpeg")
                            inlineData.put("data", base64Str)
                            val imgPart = JSONObject().put("inlineData", inlineData)
                            partsArray.put(imgPart)
                        }
                    }
                }

                if (partsArray.length() > 0) {
                    contentObj.put("parts", partsArray)
                    contentsArray.put(contentObj)
                }
            }

            requestJson.put("contents", contentsArray)

            val mediaType = "application/json; charset=utf-8".toMediaType()
            val requestBody = requestJson.toString().toRequestBody(mediaType)

            val request = Request.Builder()
                .url(url)
                .post(requestBody)
                .addHeader("User-Agent", "ArabicAIStudio-Android")
                .build()

            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val errorBody = response.body?.string() ?: ""
                    val parsedErrorMessage = parseApiError(response.code, errorBody)
                    emit("\n$parsedErrorMessage")
                    return@flow
                }

                val responseBody = response.body
                if (responseBody == null) {
                    emit("\n[عذراً، لم يتم استلام أي بيانات من الخادم]")
                    return@flow
                }

                val reader = BufferedReader(InputStreamReader(responseBody.byteStream(), StandardCharsets.UTF_8))
                var line: String?

                while (reader.readLine().also { line = it } != null) {
                    val currentLine = line?.trim() ?: continue
                    if (!currentLine.startsWith("data:")) continue

                    val jsonStr = currentLine.removePrefix("data:").trim()
                    if (jsonStr.isEmpty() || jsonStr == "[DONE]") continue

                    try {
                        val rootJson = JSONObject(jsonStr)

                        // Check for error payload inside SSE stream
                        if (rootJson.has("error")) {
                            val errObj = rootJson.optJSONObject("error")
                            val msg = errObj?.optString("message", "خطأ في المعالجة") ?: "خطأ في المعالجة"
                            emit("\n[خطأ من الخادم: $msg]")
                            continue
                        }

                        val candidates = rootJson.optJSONArray("candidates")
                        if (candidates != null && candidates.length() > 0) {
                            val candidate = candidates.optJSONObject(0)
                            val content = candidate?.optJSONObject("content")
                            val parts = content?.optJSONArray("parts")

                            if (parts != null) {
                                for (i in 0 until parts.length()) {
                                    val part = parts.optJSONObject(i)
                                    val text = part?.optString("text", "") ?: ""
                                    if (text.isNotEmpty()) {
                                        emit(text)
                                    }
                                }
                            }
                        }
                    } catch (jsonEx: Exception) {
                        Log.w(TAG, "SSE parse chunk warning: ${jsonEx.message}")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Stream exception", e)
            emit("\n[حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: ${e.localizedMessage ?: e.message}]")
        }
    }.flowOn(Dispatchers.IO)

    /**
     * Non-streaming tool execution with gemini-3.6-flash.
     */
    suspend fun generateToolResult(
        prompt: String,
        systemInstruction: String,
        images: List<Bitmap> = emptyList(),
        temperature: Float = 0.7f,
        modelName: String = DEFAULT_MODEL
    ): String = withContext(Dispatchers.IO) {
        val currentKey = apiKey.trim()
        if (currentKey.isBlank()) {
            return@withContext "⚠️ يرجى إدخال مفتاح Gemini API Key في شاشة الإعدادات لتشغيل الأدوات الذكية."
        }

        try {
            val url = "$BASE_URL/$modelName:generateContent?key=$currentKey"

            val requestJson = JSONObject()

            // System Instruction
            if (systemInstruction.isNotBlank()) {
                val sysInstructionObj = JSONObject()
                val sysParts = JSONArray()
                sysParts.put(JSONObject().put("text", systemInstruction))
                sysInstructionObj.put("parts", sysParts)
                requestJson.put("systemInstruction", sysInstructionObj)
            }

            // Generation Config
            val genConfig = JSONObject()
            genConfig.put("temperature", temperature.toDouble())
            requestJson.put("generationConfig", genConfig)

            // Contents
            val contentsArray = JSONArray()
            val contentObj = JSONObject()
            contentObj.put("role", "user")
            val partsArray = JSONArray()

            if (prompt.isNotBlank()) {
                partsArray.put(JSONObject().put("text", prompt))
            }

            images.forEach { bmp ->
                val base64Str = bitmapToBase64(bmp)
                if (base64Str.isNotEmpty()) {
                    val inlineData = JSONObject()
                    inlineData.put("mimeType", "image/jpeg")
                    inlineData.put("data", base64Str)
                    val imgPart = JSONObject().put("inlineData", inlineData)
                    partsArray.put(imgPart)
                }
            }

            contentObj.put("parts", partsArray)
            contentsArray.put(contentObj)
            requestJson.put("contents", contentsArray)

            val mediaType = "application/json; charset=utf-8".toMediaType()
            val requestBody = requestJson.toString().toRequestBody(mediaType)

            val request = Request.Builder()
                .url(url)
                .post(requestBody)
                .addHeader("User-Agent", "ArabicAIStudio-Android")
                .build()

            httpClient.newCall(request).execute().use { response ->
                val responseBodyStr = response.body?.string() ?: ""

                if (!response.isSuccessful) {
                    return@withContext parseApiError(response.code, responseBodyStr)
                }

                val rootJson = JSONObject(responseBodyStr)
                val candidates = rootJson.optJSONArray("candidates")
                if (candidates != null && candidates.length() > 0) {
                    val candidate = candidates.optJSONObject(0)
                    val content = candidate?.optJSONObject("content")
                    val parts = content?.optJSONArray("parts")

                    val sb = StringBuilder()
                    if (parts != null) {
                        for (i in 0 until parts.length()) {
                            val part = parts.optJSONObject(i)
                            val text = part?.optString("text", "") ?: ""
                            sb.append(text)
                        }
                    }
                    val resultText = sb.toString()
                    return@withContext if (resultText.isNotBlank()) resultText else "تمت معالجة الطلب بدون محتوى نصي."
                }

                return@withContext "لم يتم العثور على أي نتائج من النموذج."
            }
        } catch (e: Exception) {
            Log.e(TAG, "generateToolResult error", e)
            "خطأ: ${e.localizedMessage ?: e.message}"
        }
    }

    private fun parseApiError(statusCode: Int, errorBody: String): String {
        var serverMsg = ""
        try {
            if (errorBody.isNotBlank()) {
                val errJson = JSONObject(errorBody)
                val errObj = errJson.optJSONObject("error")
                serverMsg = errObj?.optString("message", "") ?: ""
            }
        } catch (_: Exception) {}

        return when (statusCode) {
            400 -> "خطأ في صياغة الطلب (400): ${if (serverMsg.isNotBlank()) serverMsg else "يرجى التحقق من المدخلات أو صحة المفتاح"}"
            403 -> "مفتاح API غير صالح أو غير مصرح له (403 Forbidden): يرجى مراجعة المفتاح في الإعدادات."
            404 -> "النموذج غير متوفر (404 Not Found): تم استخدام gemini-3.6-flash. تفاصيل: $serverMsg"
            429 -> "تم تجاوز حد الطلبات المسموح به (429 Quota Exceeded): يرجى الانتظار دقيقة أو التحقق من حصة الحساب."
            500, 503 -> "الخادم غير متاح مؤقتاً ($statusCode): يرجى المحاولة بعد قليل."
            else -> "فشل الطلب ($statusCode): ${if (serverMsg.isNotBlank()) serverMsg else "يرجى المحاولة مجدداً"}"
        }
    }

    private fun bitmapToBase64(bitmap: Bitmap): String {
        return try {
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
            val byteArray = outputStream.toByteArray()
            Base64.encodeToString(byteArray, Base64.NO_WRAP)
        } catch (e: Exception) {
            Log.e(TAG, "Bitmap base64 conversion failed", e)
            ""
        }
    }
}
