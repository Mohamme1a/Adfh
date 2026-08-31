package com.aistudio.arabicai.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.speech.tts.TextToSpeech
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.arabicai.data.model.Message
import com.aistudio.arabicai.data.model.MessageRole
import com.aistudio.arabicai.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ChatMessageItem(
    message: Message,
    personaName: String,
    tts: TextToSpeech?,
    onRetry: (() -> Unit)? = null
) {
    val context = LocalContext.current
    val isUser = message.role == MessageRole.USER
    val timeFormat = remember { SimpleDateFormat("HH:mm", Locale.getDefault()) }
    val formattedTime = remember(message.timestamp) { timeFormat.format(Date(message.timestamp)) }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (isUser) Slate950 else Slate900.copy(alpha = 0.5f))
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            // Sender Avatar
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(
                        if (isUser) Brush.linearGradient(listOf(Indigo600, Violet600))
                        else Brush.linearGradient(listOf(Indigo500, Slate800))
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (isUser) Icons.Default.Person else Icons.Default.AutoAwesome,
                    contentDescription = null,
                    tint = Slate100,
                    modifier = Modifier.size(18.dp)
                )
            }

            // Message Content & Meta
            Column(modifier = Modifier.weight(1f)) {
                // Header (Name & Time)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (isUser) "أنت" else personaName,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = if (isUser) Indigo400 else Slate100
                    )
                    Text(
                        text = formattedTime,
                        fontSize = 11.sp,
                        color = Slate400
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Attached Images (if any)
                if (message.images.isNotEmpty()) {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(bottom = 8.dp)
                    ) {
                        items(message.images) { img ->
                            img.bitmap?.let { btm ->
                                Image(
                                    bitmap = btm.asImageBitmap(),
                                    contentDescription = null,
                                    modifier = Modifier
                                        .size(100.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .border(1.dp, Slate700, RoundedCornerShape(8.dp)),
                                    contentScale = ContentScale.Crop
                                )
                            }
                        }
                    }
                }

                // Text Content
                if (message.content.isNotBlank()) {
                    Text(
                        text = message.content,
                        fontSize = 14.sp,
                        lineHeight = 22.sp,
                        color = Slate100
                    )
                }

                // Streaming indicator
                if (message.isStreaming) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(14.dp),
                            color = Indigo400,
                            strokeWidth = 2.dp
                        )
                        Text(
                            text = "جاري كتابة الرد التفاعلي...",
                            fontSize = 11.sp,
                            color = Indigo400
                        )
                    }
                }

                // Action row (Copy, TTS Speak, Retry)
                if (!message.isStreaming && message.content.isNotBlank()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Copy Button
                        IconButton(
                            onClick = {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                val clip = ClipData.newPlainText("AI Message", message.content)
                                clipboard.setPrimaryClip(clip)
                                Toast.makeText(context, "تم نسخ النص", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ContentCopy,
                                contentDescription = "نسخ",
                                tint = Slate400,
                                modifier = Modifier.size(15.dp)
                            )
                        }

                        // Text-to-Speech Speak Button
                        if (!isUser && tts != null) {
                            IconButton(
                                onClick = {
                                    tts.speak(message.content, TextToSpeech.QUEUE_FLUSH, null, message.id)
                                },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.VolumeUp,
                                    contentDescription = "قراءة صوتية",
                                    tint = Slate400,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }

                        // Retry button for errors
                        if (message.error && onRetry != null) {
                            IconButton(
                                onClick = onRetry,
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Refresh,
                                    contentDescription = "إعادة المحاولة",
                                    tint = Rose500,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
