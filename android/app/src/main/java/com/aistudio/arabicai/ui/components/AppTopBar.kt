package com.aistudio.arabicai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.arabicai.data.model.Persona
import com.aistudio.arabicai.ui.theme.*

enum class AppTab(val title: String) {
    CHAT("المحادثة"),
    IMAGE_GEN("توليد الصور"),
    TOOLS("الأدوات"),
    LIBRARY("المكتبة")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppTopBar(
    selectedPersona: Persona,
    currentTab: AppTab,
    onTabSelected: (AppTab) -> Unit,
    onOpenDrawer: () -> Unit,
    onOpenSettings: () -> Unit,
    onClearChat: () -> Unit,
    canClearChat: Boolean
) {
    Surface(
        color = Slate900,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Left: Drawer Hamburger & Brand Title
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    IconButton(onClick = onOpenDrawer) {
                        Icon(
                            imageVector = Icons.Default.Menu,
                            contentDescription = "القائمة الجانبية",
                            tint = Slate100
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Brush.linearGradient(listOf(Indigo600, Violet600))),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = Slate100,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    Column {
                        Text(
                            text = "الذكاء الاصطناعي",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = Slate100
                        )
                        Text(
                            text = if (currentTab == AppTab.CHAT) selectedPersona.name else currentTab.title,
                            fontSize = 11.sp,
                            color = Slate400
                        )
                    }
                }

                // Right: Action buttons (Clear & Settings)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    if (canClearChat && currentTab == AppTab.CHAT) {
                        IconButton(onClick = onClearChat) {
                            Icon(
                                imageVector = Icons.Default.DeleteOutline,
                                contentDescription = "تفريغ المحادثة",
                                tint = Slate400
                            )
                        }
                    }

                    IconButton(onClick = onOpenSettings) {
                        Icon(
                            imageVector = Icons.Default.Tune,
                            contentDescription = "الإعدادات",
                            tint = Slate400
                        )
                    }
                }
            }

            // Tabs Row
            TabRow(
                selectedTabIndex = currentTab.ordinal,
                containerColor = Slate950,
                contentColor = Indigo400,
                modifier = Modifier.fillMaxWidth()
            ) {
                AppTab.entries.forEach { tab ->
                    Tab(
                        selected = currentTab == tab,
                        onClick = { onTabSelected(tab) },
                        text = {
                            Text(
                                text = tab.title,
                                fontWeight = if (currentTab == tab) FontWeight.Bold else FontWeight.Normal,
                                fontSize = 13.sp,
                                color = if (currentTab == tab) Indigo400 else Slate400
                            )
                        }
                    )
                }
            }
        }
    }
}
