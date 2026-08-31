package com.aistudio.arabicai.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.arabicai.ui.theme.*
import kotlinx.coroutines.launch

enum class ToolType(val id: String, val title: String, val description: String) {
    REWRITE("rewrite", "إعادة الصياغة", "تحسين الأسلوب والنبرة مع الحفاظ على المعنى"),
    SUMMARIZE("summarize", "التلخيص الذكي", "استخراج أهم النقاط والأفكار الرئيسية"),
    PROOFREAD("proofread", "التدقيق اللغوي", "تصحيح الأخطاء النحوية والإملائية مع التشكيل"),
    CODE("code", "مساعد البرمجة", "كتابة وفحص وشرح الأكواد البرمجية"),
    TRANSLATE("translate", "الترجمة الفورية", "ترجمة دقيقة وسياقية بين مختلف اللغات"),
    BRAINSTORM("brainstorm", "العصف الذهني", "توليد أفكار إبداعية وحلول استراتيجية")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ToolsScreen(
    onExecuteTool: suspend (ToolType, String, String) -> String,
    onSendToChat: (String) -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var selectedTool by remember { mutableStateOf(ToolType.REWRITE) }
    var inputText by remember { mutableStateOf("") }
    var resultText by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var optionParam by remember { mutableStateOf("رسمي ومحترف") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(16.dp)
    ) {
        // Tool Selector Tabs
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(ToolType.entries.toTypedArray()) { tool ->
                val isSelected = tool == selectedTool
                Card(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .clickable {
                            selectedTool = tool
                            resultText = ""
                        },
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) Indigo600 else Slate900
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) Indigo500 else Slate800)
                ) {
                    Text(
                        text = tool.title,
                        fontSize = 13.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        color = Slate100,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Tool Description Banner
        Surface(
            color = Slate900,
            shape = RoundedCornerShape(12.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Slate800),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = selectedTool.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = Slate100
                )
                Text(
                    text = selectedTool.description,
                    fontSize = 12.sp,
                    color = Slate400
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                // Input TextField
                Text(
                    text = "النص المدخل:",
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    color = Slate300
                )
                Spacer(modifier = Modifier.height(4.dp))
                TextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = {
                        Text(text = "الصق النص أو اكتب المسألة هنا...", fontSize = 13.sp, color = Slate400)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Slate900,
                        unfocusedContainerColor = Slate900,
                        focusedIndicatorColor = Indigo500,
                        unfocusedIndicatorColor = Slate800,
                        focusedTextColor = Slate100,
                        unfocusedTextColor = Slate100
                    ),
                    shape = RoundedCornerShape(12.dp)
                )
            }

            item {
                // Action Button
                Button(
                    onClick = {
                        if (inputText.isNotBlank() && !isLoading) {
                            coroutineScope.launch {
                                isLoading = true
                                resultText = onExecuteTool(selectedTool, inputText, optionParam)
                                isLoading = false
                            }
                        }
                    },
                    enabled = inputText.isNotBlank() && !isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = Indigo600),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Slate100)
                    } else {
                        Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "معالجة بالذكاء الاصطناعي", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                }
            }

            if (resultText.isNotBlank()) {
                item {
                    // Result Card
                    Surface(
                        color = Slate900,
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Slate800),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "النتيجة الذكية:",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = Indigo400
                                )

                                Row {
                                    IconButton(
                                        onClick = {
                                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                            val clip = ClipData.newPlainText("Result", resultText)
                                            clipboard.setPrimaryClip(clip)
                                            Toast.makeText(context, "تم نسخ النتيجة", Toast.LENGTH_SHORT).show()
                                        },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(imageVector = Icons.Default.ContentCopy, contentDescription = "نسخ", tint = Slate400, modifier = Modifier.size(16.dp))
                                    }

                                    IconButton(
                                        onClick = { onSendToChat(resultText) },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(imageVector = Icons.Default.ChatBubbleOutline, contentDescription = "نقل للمحادثة", tint = Slate400, modifier = Modifier.size(16.dp))
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = resultText,
                                fontSize = 13.sp,
                                lineHeight = 22.sp,
                                color = Slate100
                            )
                        }
                    }
                }
            }
        }
    }
}
