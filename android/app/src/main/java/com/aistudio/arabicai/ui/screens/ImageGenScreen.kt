package com.aistudio.arabicai.ui.screens

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.arabicai.ui.theme.*
import com.aistudio.arabicai.ui.viewmodel.ChatViewModel
import java.io.File
import java.io.FileOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImageGenScreen(
    viewModel: ChatViewModel
) {
    val context = LocalContext.current
    val state by viewModel.imageGenState.collectAsState()

    val aspectRatios = listOf(
        "1:1" to "مربع (1:1)",
        "16:9" to "عريض (16:9)",
        "9:16" to "طولي (9:16)",
        "4:3" to "شاشة (4:3)",
        "3:4" to "بورتريه (3:4)"
    )

    val imageSizes = listOf(
        "1K" to "عالي الوضوح (1K)",
        "2K" to "فائق الدقة (2K)",
        "512px" to "سريع (512px)"
    )

    val samplePrompts = listOf(
        "لوحة فنية زاهية لمنظر طبيعي ساحر في وقت الغروب مع جبال وبحيرة هادئة وأشجار صنوبر بأسلوب زيتي راقٍ",
        "رائد فضاء عربي يستكشف كوكباً فضائياً غامضاً بأسلوب سايبربانك مع إضاءات نيون مستقبلية فائقة الواقعية",
        "قطة كرتونية لطيفة ترتدي نظارات طبية وتقرأ كتاباً قديماً في مكتبة خشبية دافئة بإضاءة سينمائية",
        "تصميم شعار عصري ثلاثي الأبعاد لشعار تقني عربي مفعم بالحيوية والتدرجات اللونية الفضائية 3D Render",
        "فنجان قهوة عربية تقليدية على طاولة خشبية مزخرفة مع حبات هيل وبخار متصاعد بدقة 4K واقعية",
        "سيارة مستقبلية طائرة تسير في مدينة ذكية عربية متطورة ذات ناطحات سحاب مذهلة"
    )

    // Image Picker Launcher
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            try {
                val inputStream = context.contentResolver.openInputStream(it)
                val bitmap = BitmapFactory.decodeStream(inputStream)
                inputStream?.close()
                if (bitmap != null) {
                    viewModel.setImageGenInputBitmap(bitmap)
                    Toast.makeText(context, "تم اختيار الصورة بنجاح للتعديل بالذكاء الاصطناعي", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "فشل فتح الصورة: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header Banner
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(16.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Indigo600, Violet600)))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Brush.linearGradient(listOf(Indigo600, Violet600))),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Palette,
                                contentDescription = null,
                                tint = Slate100,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "مولّد وتعديل الصور بالذكاء الاصطناعي",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = Slate100
                                )
                                Surface(
                                    color = Indigo950,
                                    shape = RoundedCornerShape(4.dp),
                                    border = CardDefaults.outlinedCardBorder()
                                ) {
                                    Text(
                                        text = "Gemini 3.1 Flash Image",
                                        color = Indigo300,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Text(
                                text = "اكتب وصفاً خيالياً أو ارفع صورة من هاتفك لتعديلها وإضافة عناصر جديدة",
                                fontSize = 12.sp,
                                color = Slate400
                            )
                        }
                    }
                }
            }
        }

        // Base Image Picker for AI Editing
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (state.inputBitmap != null) "الصورة الأساسية المختارة للتعديل:" else "تعديل صورة من الهاتف (اختياري):",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Slate200
                        )

                        if (state.inputBitmap != null) {
                            TextButton(
                                onClick = { viewModel.setImageGenInputBitmap(null) },
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Icon(Icons.Default.Close, contentDescription = null, tint = Red400, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("إلغاء الصورة", color = Red400, fontSize = 12.sp)
                            }
                        }
                    }

                    if (state.inputBitmap != null) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Slate950)
                                .border(1.dp, Indigo500.copy(alpha = 0.5f), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Image(
                                bitmap = state.inputBitmap!!.asImageBitmap(),
                                contentDescription = "الصورة المختارة للتعديل",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Fit
                            )
                        }
                    } else {
                        OutlinedButton(
                            onClick = { imagePickerLauncher.launch("image/*") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Indigo400
                            )
                        ) {
                            Icon(Icons.Default.AddPhotoAlternate, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("اختيار صورة من الاستوديو لتعديلها", fontSize = 13.sp)
                        }
                    }
                }
            }
        }

        // Prompt Input Field
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = if (state.inputBitmap != null) "اكتب تعليمات التعديل على الصورة:" else "وصف الصورة المراد إنشاؤها:",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Slate200
                    )

                    OutlinedTextField(
                        value = state.prompt,
                        onValueChange = { viewModel.setImageGenPrompt(it) },
                        placeholder = {
                            Text(
                                if (state.inputBitmap != null)
                                    "مثال: أضف كوكب زحل في السماء، واجعل الإضاءة دافئة وساحرة..."
                                else
                                    "صف الصورة بدقة، مثلاً: قلعة تاريخية وسط واحة نخيل بأسلوب واقعي ثلاثي الأبعاد...",
                                color = Slate500,
                                fontSize = 13.sp
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 100.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Slate950,
                            unfocusedContainerColor = Slate950,
                            focusedBorderColor = Indigo500,
                            unfocusedBorderColor = Slate800,
                            focusedTextColor = Slate100,
                            unfocusedTextColor = Slate100
                        )
                    )

                    // Inspiration prompts chips
                    Text(
                        text = "أفكار مقترحة للإلهام:",
                        fontSize = 11.sp,
                        color = Slate400
                    )
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(samplePrompts) { sample ->
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = Slate800,
                                modifier = Modifier.clickable {
                                    viewModel.setImageGenPrompt(sample)
                                }
                            ) {
                                Text(
                                    text = sample.take(28) + "...",
                                    color = Slate300,
                                    fontSize = 11.sp,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Settings (Aspect Ratio & Resolution)
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate900),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "أبعاد الصورة (Aspect Ratio):",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Slate300
                    )
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(aspectRatios) { (ratio, label) ->
                            val isSelected = state.aspectRatio == ratio
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (isSelected) Indigo600 else Slate800,
                                modifier = Modifier.clickable { viewModel.setImageGenAspectRatio(ratio) }
                            ) {
                                Text(
                                    text = label,
                                    color = if (isSelected) Slate100 else Slate300,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "جودة ودقة الصورة (Image Size):",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Slate300
                    )
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(imageSizes) { (size, label) ->
                            val isSelected = state.imageSize == size
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (isSelected) Indigo600 else Slate800,
                                modifier = Modifier.clickable { viewModel.setImageGenSize(size) }
                            ) {
                                Text(
                                    text = label,
                                    color = if (isSelected) Slate100 else Slate300,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Action Generate Button
        item {
            Button(
                onClick = { viewModel.generateOrEditImage() },
                enabled = !state.isLoading && state.prompt.isNotBlank(),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Indigo600,
                    disabledContainerColor = Slate800
                )
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(
                        color = Slate100,
                        modifier = Modifier.size(22.dp),
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = if (state.inputBitmap != null) "جاري تعديل الصورة عبر Gemini 3.1..." else "جاري إنشاء الصورة بالذكاء الاصطناعي...",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate100
                    )
                } else {
                    Icon(
                        imageVector = if (state.inputBitmap != null) Icons.Default.AutoFixHigh else Icons.Default.Sparkles,
                        contentDescription = null,
                        tint = Slate100,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (state.inputBitmap != null) "تعديل الصورة الآن" else "إنشاء الصورة بالذكاء الاصطناعي",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate100
                    )
                }
            }
        }

        // Error Banner
        if (state.errorMessage != null) {
            item {
                Surface(
                    color = Red900.copy(alpha = 0.4f),
                    shape = RoundedCornerShape(12.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Red500, Red700)))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = Red400)
                        Text(
                            text = state.errorMessage!!,
                            color = Red200,
                            fontSize = 12.sp,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(onClick = { viewModel.clearImageGenError() }) {
                            Icon(Icons.Default.Close, contentDescription = "إغلاق", tint = Red300, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }

        // Result Display Card
        if (state.generatedBitmap != null) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Slate900),
                    shape = RoundedCornerShape(16.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(Indigo500, Violet500)))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "الصورة الناتجة 🎨",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = Slate100
                            )

                            Surface(
                                color = Emerald950,
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = "تم التوليد بنجاح",
                                    color = Emerald400,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        // Generated Image Box
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 260.dp, max = 400.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Slate950),
                            contentAlignment = Alignment.Center
                        ) {
                            Image(
                                bitmap = state.generatedBitmap!!.asImageBitmap(),
                                contentDescription = "الصورة المنشأة بالذكاء الاصطناعي",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Fit
                            )
                        }

                        if (state.generatedDescription != null) {
                            Text(
                                text = state.generatedDescription!!,
                                fontSize = 12.sp,
                                color = Slate300,
                                textAlign = TextAlign.Start,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        // Action Buttons: Save & Regenerate & Share
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Save Button
                            Button(
                                onClick = {
                                    saveImageToGallery(context, state.generatedBitmap!!)
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
                            ) {
                                Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("حفظ بالمعرض", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }

                            // Regenerate Button
                            OutlinedButton(
                                onClick = { viewModel.generateOrEditImage() },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Indigo300)
                            ) {
                                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("إعادة التوليد", fontSize = 12.sp)
                            }

                            // Share Button
                            IconButton(
                                onClick = {
                                    shareImage(context, state.generatedBitmap!, state.prompt)
                                },
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Slate800)
                            ) {
                                Icon(Icons.Default.Share, contentDescription = "مشاركة", tint = Slate200)
                            }
                        }
                    }
                }
            }
        }

        // History Gallery in the Session
        if (state.history.isNotEmpty()) {
            item {
                Text(
                    text = "سجل الصور المنشأة في الجلسة:",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = Slate300,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            items(state.history) { item ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = Slate900),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Image(
                            bitmap = item.bitmap.asImageBitmap(),
                            contentDescription = null,
                            modifier = Modifier
                                .size(70.dp)
                                .clip(RoundedCornerShape(8.dp)),
                            contentScale = ContentScale.Crop
                        )

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = item.prompt,
                                fontSize = 12.sp,
                                color = Slate200,
                                maxLines = 2
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = if (item.isEdited) "تعديل صورة" else "إنشاء جديد",
                                fontSize = 10.sp,
                                color = Indigo400,
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        IconButton(onClick = { saveImageToGallery(context, item.bitmap) }) {
                            Icon(Icons.Default.Download, contentDescription = "حفظ", tint = Slate300, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        }
    }
}

private fun saveImageToGallery(context: Context, bitmap: Bitmap) {
    try {
        val filename = "ArabicAI_${System.currentTimeMillis()}.jpg"
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, filename)
            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/ArabicAI")
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }
        }

        val resolver = context.contentResolver
        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
        if (uri != null) {
            resolver.openOutputStream(uri)?.use { stream ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 95, stream)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.clear()
                values.put(MediaStore.Images.Media.IS_PENDING, 0)
                resolver.update(uri, values, null, null)
            }
            Toast.makeText(context, "تم حفظ الصورة في معرض الصور بنجاح 🖼️", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(context, "فشل إنشاء ملف الصورة في المعرض", Toast.LENGTH_SHORT).show()
        }
    } catch (e: Exception) {
        Toast.makeText(context, "خطأ أثناء حفظ الصورة: ${e.message}", Toast.LENGTH_SHORT).show()
    }
}

private fun shareImage(context: Context, bitmap: Bitmap, prompt: String) {
    try {
        val cachePath = File(context.cacheDir, "images")
        cachePath.mkdirs()
        val file = File(cachePath, "shared_ai_image.jpg")
        val stream = FileOutputStream(file)
        bitmap.compress(Bitmap.CompressFormat.JPEG, 95, stream)
        stream.flush()
        stream.close()

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, "تم إنشاء هذه الصورة بالذكاء الاصطناعي مع Gemini 3.1 Flash Image:\n\"$prompt\"")
        }
        context.startActivity(Intent.createChooser(intent, "مشاركة وصف الصورة عبر"))
    } catch (e: Exception) {
        Toast.makeText(context, "فشلت المشاركة: ${e.message}", Toast.LENGTH_SHORT).show()
    }
}
