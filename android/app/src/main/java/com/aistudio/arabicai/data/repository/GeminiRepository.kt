package com.aistudio.arabicai.data.repository

import android.graphics.Bitmap
import com.aistudio.arabicai.data.model.AttachedImage
import com.aistudio.arabicai.data.model.Message
import com.aistudio.arabicai.data.model.MessageRole
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.google.ai.client.generativeai.type.generationConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class GeminiRepository(
    private var apiKey: String = ""
) {
    fun setApiKey(newKey: String) {
        apiKey = newKey
    }

    fun generateStream(
        messages: List<Message>,
        systemInstruction: String,
        temperature: Float = 0.7f,
        modelName: String = "gemini-1.5-flash"
    ): Flow<String> = flow {
        if (apiKey.isBlank()) {
            emit("تنبيه: يرجى إدخال مفتاح Gemini API Key في الإعدادات لبدء التوليد الفوري.")
            return@flow
        }

        try {
            val generativeModel = GenerativeModel(
                modelName = modelName,
                apiKey = apiKey,
                generationConfig = generationConfig {
                    this.temperature = temperature
                },
                systemInstruction = content { text(systemInstruction) }
            )

            // Convert conversation history
            val history = messages.dropLast(1).map { msg ->
                content(role = if (msg.role == MessageRole.USER) "user" else "model") {
                    text(msg.content)
                }
            }

            val chat = generativeModel.startChat(history)
            val latestMessage = messages.lastOrNull() ?: return@flow

            val promptContent = content {
                latestMessage.images.forEach { attachedImg ->
                    attachedImg.bitmap?.let { btm ->
                        image(btm)
                    }
                }
                if (latestMessage.content.isNotBlank()) {
                    text(latestMessage.content)
                }
            }

            chat.sendMessageStream(promptContent).collect { chunk ->
                chunk.text?.let { textChunk ->
                    emit(textChunk)
                }
            }
        } catch (e: Exception) {
            emit("\n[حدث خطأ أثناء التوليد: ${e.localizedMessage ?: e.message}]")
        }
    }

    suspend fun generateToolResult(
        prompt: String,
        systemInstruction: String,
        images: List<Bitmap> = emptyList(),
        temperature: Float = 0.7f
    ): String = withContext(Dispatchers.IO) {
        if (apiKey.isBlank()) {
            return@withContext "يرجى تعيين مفتاح Gemini API في إعدادات التطبيق."
        }

        try {
            val generativeModel = GenerativeModel(
                modelName = "gemini-1.5-flash",
                apiKey = apiKey,
                generationConfig = generationConfig {
                    this.temperature = temperature
                },
                systemInstruction = content { text(systemInstruction) }
            )

            val inputContent = content {
                images.forEach { btm ->
                    image(btm)
                }
                text(prompt)
            }

            val response = generativeModel.generateContent(inputContent)
            response.text ?: "تمت معالجة الطلب بدون محتوى نصي."
        } catch (e: Exception) {
            "خطأ: ${e.localizedMessage ?: e.message}"
        }
    }
}
