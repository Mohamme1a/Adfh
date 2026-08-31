package com.aistudio.arabicai.ui.screens

import android.speech.tts.TextToSpeech
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.aistudio.arabicai.ui.components.*
import com.aistudio.arabicai.ui.theme.*
import com.aistudio.arabicai.ui.viewmodel.ChatViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScreen(
    viewModel: ChatViewModel,
    tts: TextToSpeech?
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val coroutineScope = rememberCoroutineScope()

    var currentTab by remember { mutableStateOf(AppTab.CHAT) }
    var showSettingsDialog by remember { mutableStateOf(false) }

    val sessions by viewModel.sessions.collectAsState()
    val activeSessionId by viewModel.activeSessionId.collectAsState()
    val selectedPersona by viewModel.selectedPersona.collectAsState()
    val messages by viewModel.messages.collectAsState()
    val isStreaming by viewModel.isStreaming.collectAsState()
    val temperature by viewModel.temperature.collectAsState()
    val apiKey by viewModel.apiKey.collectAsState()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = Slate900
            ) {
                AppDrawer(
                    sessions = sessions,
                    activeSessionId = activeSessionId,
                    selectedPersona = selectedPersona,
                    onSelectSession = { sessionId ->
                        viewModel.selectSession(sessionId)
                        currentTab = AppTab.CHAT
                    },
                    onNewChat = { personaId ->
                        viewModel.createNewSession(personaId)
                        currentTab = AppTab.CHAT
                    },
                    onDeleteSession = { sessionId ->
                        viewModel.deleteSession(sessionId)
                    },
                    onPinSession = { sessionId ->
                        viewModel.pinSession(sessionId)
                    },
                    onSelectPersona = { persona ->
                        viewModel.selectPersona(persona)
                    },
                    onCloseDrawer = {
                        coroutineScope.launch { drawerState.close() }
                    }
                )
            }
        }
    ) {
        Scaffold(
            topBar = {
                AppTopBar(
                    selectedPersona = selectedPersona,
                    currentTab = currentTab,
                    onTabSelected = { currentTab = it },
                    onOpenDrawer = {
                        coroutineScope.launch { drawerState.open() }
                    },
                    onOpenSettings = { showSettingsDialog = true },
                    onClearChat = { viewModel.clearCurrentChat() },
                    canClearChat = messages.isNotEmpty()
                )
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .background(Slate950)
            ) {
                when (currentTab) {
                    AppTab.CHAT -> {
                        ChatScreen(
                            messages = messages,
                            selectedPersona = selectedPersona,
                            isStreaming = isStreaming,
                            onSendMessage = { text, imgs ->
                                viewModel.sendMessage(text, imgs)
                            },
                            onStopStreaming = { viewModel.stopStreaming() },
                            onRetryMessage = {
                                if (messages.size >= 2) {
                                    val lastUserMsg = messages.findLast { it.role.name == "USER" }
                                    if (lastUserMsg != null) {
                                        viewModel.sendMessage(lastUserMsg.content, lastUserMsg.images)
                                    }
                                }
                            },
                            tts = tts
                        )
                    }
                    AppTab.TOOLS -> {
                        ToolsScreen(
                            onExecuteTool = { tool, input, opt ->
                                viewModel.executeTool(tool, input, opt)
                            },
                            onSendToChat = { result ->
                                currentTab = AppTab.CHAT
                                viewModel.sendMessage(result)
                            }
                        )
                    }
                    AppTab.LIBRARY -> {
                        LibraryScreen(
                            onSelectPrompt = { prompt ->
                                currentTab = AppTab.CHAT
                                viewModel.sendMessage(prompt)
                            }
                        )
                    }
                }
            }
        }
    }

    // Settings Dialog
    if (showSettingsDialog) {
        var tempKey by remember(apiKey) { mutableStateOf(apiKey) }
        var tempSlider by remember(temperature) { mutableStateOf(temperature) }

        Dialog(onDismissRequest = { showSettingsDialog = false }) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Slate900,
                border = androidx.compose.foundation.BorderStroke(1.dp, Slate800),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        text = "إعدادات الذكاء الاصطناعي",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = Slate100
                    )

                    // API Key Field
                    Column {
                        Text(
                            text = "Gemini API Key:",
                            fontSize = 12.sp,
                            color = Slate300,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        TextField(
                            value = tempKey,
                            onValueChange = { tempKey = it },
                            placeholder = { Text("أدخل مفتاح Gemini API هنا", fontSize = 12.sp, color = Slate400) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = TextFieldDefaults.colors(
                                focusedContainerColor = Slate950,
                                unfocusedContainerColor = Slate950,
                                focusedIndicatorColor = Indigo500,
                                unfocusedIndicatorColor = Slate800,
                                focusedTextColor = Slate100,
                                unfocusedTextColor = Slate100
                            ),
                            shape = RoundedCornerShape(8.dp)
                        )
                    }

                    // Temperature Slider
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = "درجة الإبداع (Temperature):", fontSize = 12.sp, color = Slate300)
                            Text(text = String.format("%.1f", tempSlider), fontSize = 12.sp, color = Indigo400, fontWeight = FontWeight.Bold)
                        }
                        Slider(
                            value = tempSlider,
                            onValueChange = { tempSlider = it },
                            valueRange = 0.1f..1.0f,
                            steps = 9,
                            colors = SliderDefaults.colors(
                                thumbColor = Indigo500,
                                activeTrackColor = Indigo500,
                                inactiveTrackColor = Slate800
                            )
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(onClick = { showSettingsDialog = false }) {
                            Text("إلغاء", color = Slate400)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                viewModel.setApiKey(tempKey)
                                viewModel.setTemperature(tempSlider)
                                showSettingsDialog = false
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Indigo600),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("حفظ التغييرات", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
