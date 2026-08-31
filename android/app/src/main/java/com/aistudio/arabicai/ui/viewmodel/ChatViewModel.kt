package com.aistudio.arabicai.ui.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.room.Room
import com.aistudio.arabicai.data.local.AppDatabase
import com.aistudio.arabicai.data.local.MessageEntity
import com.aistudio.arabicai.data.local.SessionEntity
import com.aistudio.arabicai.data.model.*
import com.aistudio.arabicai.data.repository.GeminiRepository
import com.aistudio.arabicai.ui.screens.ToolType
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class ChatViewModel(application: Application) : AndroidViewModel(application) {

    private val db = Room.databaseBuilder(
        application,
        AppDatabase::class.java,
        "arabic_ai_chat.db"
    ).build()

    private val chatDao = db.chatDao()
    private val geminiRepo = GeminiRepository()

    // Preferences
    private val prefs = application.getSharedPreferences("ai_prefs", Context.MODE_PRIVATE)

    val sessions: StateFlow<List<SessionEntity>> = chatDao.getAllSessions()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _activeSessionId = MutableStateFlow<String>("")
    val activeSessionId: StateFlow<String> = _activeSessionId.asStateFlow()

    private val _selectedPersona = MutableStateFlow<Persona>(DefaultData.PERSONAS[0])
    val selectedPersona: StateFlow<Persona> = _selectedPersona.asStateFlow()

    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages.asStateFlow()

    private val _isStreaming = MutableStateFlow(false)
    val isStreaming: StateFlow<Boolean> = _isStreaming.asStateFlow()

    private val _temperature = MutableStateFlow(0.7f)
    val temperature: StateFlow<Float> = _temperature.asStateFlow()

    private val _apiKey = MutableStateFlow(prefs.getString("gemini_key", "") ?: "")
    val apiKey: StateFlow<String> = _apiKey.asStateFlow()

    init {
        geminiRepo.setApiKey(_apiKey.value)
        viewModelScope.launch {
            sessions.collect { sessionList ->
                if (_activeSessionId.value.isEmpty() && sessionList.isNotEmpty()) {
                    selectSession(sessionList.first().id)
                } else if (sessionList.isEmpty()) {
                    createNewSession("general")
                }
            }
        }
    }

    fun setApiKey(newKey: String) {
        _apiKey.value = newKey
        geminiRepo.setApiKey(newKey)
        prefs.edit().putString("gemini_key", newKey).apply()
    }

    fun setTemperature(temp: Float) {
        _temperature.value = temp
    }

    fun selectPersona(persona: Persona) {
        _selectedPersona.value = persona
    }

    fun selectSession(sessionId: String) {
        _activeSessionId.value = sessionId
        viewModelScope.launch {
            chatDao.getMessagesForSession(sessionId).collect { entities ->
                _messages.value = entities.map { e ->
                    Message(
                        id = e.id,
                        role = if (e.role == "USER") MessageRole.USER else MessageRole.ASSISTANT,
                        content = e.content,
                        timestamp = e.timestamp
                    )
                }
            }
        }
    }

    fun createNewSession(personaId: String = "general") {
        val newId = "session_${System.currentTimeMillis()}"
        val persona = DefaultData.PERSONAS.find { it.id == personaId } ?: DefaultData.PERSONAS[0]
        _selectedPersona.value = persona
        _activeSessionId.value = newId
        _messages.value = emptyList()

        viewModelScope.launch {
            val session = SessionEntity(
                id = newId,
                title = "محادثة جديدة",
                personaId = personaId,
                isPinned = false,
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )
            chatDao.insertSession(session)
        }
    }

    fun deleteSession(sessionId: String) {
        viewModelScope.launch {
            chatDao.deleteSessionById(sessionId)
            chatDao.deleteMessagesForSession(sessionId)
            if (_activeSessionId.value == sessionId) {
                val remaining = sessions.value.filter { it.id != sessionId }
                if (remaining.isNotEmpty()) {
                    selectSession(remaining.first().id)
                } else {
                    createNewSession()
                }
            }
        }
    }

    fun pinSession(sessionId: String) {
        val session = sessions.value.find { it.id == sessionId } ?: return
        viewModelScope.launch {
            chatDao.updateSession(session.copy(isPinned = !session.isPinned))
        }
    }

    fun clearCurrentChat() {
        val sessionId = _activeSessionId.value
        if (sessionId.isNotEmpty()) {
            viewModelScope.launch {
                chatDao.deleteMessagesForSession(sessionId)
                _messages.value = emptyList()
            }
        }
    }

    fun sendMessage(content: String, images: List<AttachedImage> = emptyList()) {
        val sessionId = _activeSessionId.value
        if (content.isBlank() && images.isEmpty()) return

        val userMessageId = "msg_user_${System.currentTimeMillis()}"
        val userMsg = Message(
            id = userMessageId,
            role = MessageRole.USER,
            content = content,
            images = images,
            timestamp = System.currentTimeMillis()
        )

        val asstPlaceholderId = "msg_asst_${System.currentTimeMillis()}"
        val asstPlaceholder = Message(
            id = asstPlaceholderId,
            role = MessageRole.ASSISTANT,
            content = "",
            isStreaming = true,
            timestamp = System.currentTimeMillis()
        )

        val updatedList = _messages.value + userMsg
        _messages.value = updatedList + asstPlaceholder
        _isStreaming.value = true

        viewModelScope.launch {
            // Save user message to database
            chatDao.insertMessage(
                MessageEntity(
                    id = userMessageId,
                    sessionId = sessionId,
                    role = "USER",
                    content = content,
                    timestamp = userMsg.timestamp
                )
            )

            // Update session title if first message
            val currentSession = sessions.value.find { it.id == sessionId }
            if (currentSession != null && (currentSession.title == "محادثة جديدة" || updatedList.size == 1)) {
                val newTitle = if (content.length > 25) content.take(25) + "..." else content
                chatDao.updateSession(currentSession.copy(title = newTitle, updatedAt = System.currentTimeMillis()))
            }

            var accumulatedText = ""
            geminiRepo.generateStream(
                messages = updatedList,
                systemInstruction = _selectedPersona.value.systemPrompt,
                temperature = _temperature.value
            ).collect { chunk ->
                accumulatedText += chunk
                _messages.value = updatedList + Message(
                    id = asstPlaceholderId,
                    role = MessageRole.ASSISTANT,
                    content = accumulatedText,
                    isStreaming = true,
                    timestamp = asstPlaceholder.timestamp
                )
            }

            _isStreaming.value = false
            _messages.value = updatedList + Message(
                id = asstPlaceholderId,
                role = MessageRole.ASSISTANT,
                content = accumulatedText,
                isStreaming = false,
                timestamp = asstPlaceholder.timestamp
            )

            // Save assistant message to Room database
            chatDao.insertMessage(
                MessageEntity(
                    id = asstPlaceholderId,
                    sessionId = sessionId,
                    role = "ASSISTANT",
                    content = accumulatedText,
                    timestamp = asstPlaceholder.timestamp
                )
            )
        }
    }

    fun stopStreaming() {
        _isStreaming.value = false
    }

    suspend fun executeTool(tool: ToolType, input: String, option: String): String {
        val sysPrompt = when (tool) {
            ToolType.REWRITE -> "أنت محرر لغوي محترف. أعد صياغة النص بأسلوب $option مع الحفاظ على المعنى الأصلي وتجويد التراكيب."
            ToolType.SUMMARIZE -> "أنت خبير تلخيص واستخلاص أفكار. لخص النص بدقة في نقاط رئيسية وخلاصة تنفيذية واضحة."
            ToolType.PROOFREAD -> "أنت مدقق لغوي وعالم بالنحو والصرف. دقق النص نحويّاً وإملائيّاً مع التشكيل الكامل وبيان التصحيحات."
            ToolType.CODE -> "أنت كبير مهندسي البرمجيات. حلل أو اكتب أو صحح الكود البرمجي بأسلوب Clean Code واشرح الحل."
            ToolType.TRANSLATE -> "أنت مترجم فوري محترف. ترجم النص بدقة سياقية وبلاغية عالية إلى اللغة الهدف."
            ToolType.BRAINSTORM -> "أنت مستشار ابتكار واستراتيجية. ولد 5 أفكار مبتكرة واستثنائية مع خطوات التنفيذ."
        }
        return geminiRepo.generateToolResult(input, sysPrompt, emptyList(), _temperature.value)
    }
}
