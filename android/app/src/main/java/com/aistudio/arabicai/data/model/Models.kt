package com.aistudio.arabicai.data.model

import android.graphics.Bitmap

enum class MessageRole {
    USER,
    ASSISTANT
}

data class AttachedImage(
    val id: String,
    val bitmap: Bitmap? = null,
    val mimeType: String = "image/jpeg",
    val name: String = "image.jpg"
)

data class Message(
    val id: String,
    val role: MessageRole,
    val content: String,
    val images: List<AttachedImage> = emptyList(),
    val timestamp: Long = System.currentTimeMillis(),
    val isStreaming: Boolean = false,
    val error: Boolean = false
)

data class Persona(
    val id: String,
    val name: String,
    val title: String,
    val description: String,
    val systemPrompt: String,
    val iconName: String,
    val suggestedPrompts: List<String>
)

data class ChatSession(
    val id: String,
    val title: String,
    val personaId: String = "general",
    val isPinned: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

data class PromptItem(
    val id: String,
    val title: String,
    val prompt: String,
    val category: String,
    val personaId: String
)
