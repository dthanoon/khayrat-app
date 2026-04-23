package com.khayrat.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.widget.RemoteViews
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DailyLogWidget : AppWidgetProvider() {

    companion object {
        const val PREFS = "KhayratWidgetPrefs"
        const val ACTION_TOGGLE_QURAN   = "com.khayrat.app.TOGGLE_QURAN"
        const val ACTION_TOGGLE_FASTING = "com.khayrat.app.TOGGLE_FASTING"
        const val ACTION_TOGGLE_QIYAM   = "com.khayrat.app.TOGGLE_QIYAM"

        fun updateAllWidgets(context: Context) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(ComponentName(context, DailyLogWidget::class.java))
            for (id in ids) updateWidget(context, mgr, id)
        }

        fun updateWidget(context: Context, mgr: AppWidgetManager, widgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val quran   = prefs.getBoolean("quran_reading", false)
            val fasting = prefs.getBoolean("fasting", false)
            val qiyam   = prefs.getBoolean("qiyam", false)
            val today   = SimpleDateFormat("EEE, MMM d", Locale.getDefault()).format(Date())

            val views = RemoteViews(context.packageName, R.layout.widget_daily_log)
            views.setTextViewText(R.id.widget_date, today)

            applyRowState(context, views, R.id.row_quran,   R.id.check_quran,   quran,   ACTION_TOGGLE_QURAN,   widgetId)
            applyRowState(context, views, R.id.row_fasting, R.id.check_fasting, fasting, ACTION_TOGGLE_FASTING, widgetId)
            applyRowState(context, views, R.id.row_qiyam,   R.id.check_qiyam,   qiyam,   ACTION_TOGGLE_QIYAM,   widgetId)

            mgr.updateAppWidget(widgetId, views)
        }

        private fun applyRowState(
            context: Context,
            views: RemoteViews,
            rowId: Int,
            checkId: Int,
            checked: Boolean,
            action: String,
            widgetId: Int,
        ) {
            views.setInt(rowId, "setBackgroundResource",
                if (checked) R.drawable.widget_row_checked else R.drawable.widget_row_unchecked)
            views.setTextViewText(checkId, if (checked) "✓" else "○")
            views.setTextColor(checkId,
                if (checked) android.graphics.Color.parseColor("#10b981")
                else android.graphics.Color.parseColor("#666666"))

            val intent = Intent(context, DailyLogWidget::class.java).apply {
                this.action = action
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
            }
            val pi = PendingIntent.getBroadcast(
                context, widgetId * 10 + rowId,
                intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(rowId, pi)
        }
    }

    override fun onUpdate(context: Context, mgr: AppWidgetManager, ids: IntArray) {
        for (id in ids) updateWidget(context, mgr, id)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        val field = when (intent.action) {
            ACTION_TOGGLE_QURAN   -> "quran_reading"
            ACTION_TOGGLE_FASTING -> "fasting"
            ACTION_TOGGLE_QIYAM   -> "qiyam"
            else -> return
        }

        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val newVal = !prefs.getBoolean(field, false)
        prefs.edit().putBoolean(field, newVal).apply()

        // Immediately refresh UI optimistically
        updateAllWidgets(context)

        // Persist to Supabase in a background thread
        val result = goAsync()
        Thread {
            try {
                callSupabase(prefs, field, newVal)
            } catch (_: Exception) {
                // If API fails revert the optimistic update
                prefs.edit().putBoolean(field, !newVal).apply()
                updateAllWidgets(context)
            } finally {
                result.finish()
            }
        }.start()
    }

    private fun callSupabase(prefs: SharedPreferences, field: String, value: Boolean) {
        val supabaseUrl  = prefs.getString("supabase_url", "") ?: return
        val anonKey      = prefs.getString("supabase_anon_key", "") ?: return
        val accessToken  = prefs.getString("access_token", "") ?: return
        val userId       = prefs.getString("user_id", "") ?: return
        val logDate      = prefs.getString("log_date", today()) ?: today()

        if (supabaseUrl.isBlank() || accessToken.isBlank()) return

        // Read other fields to build full upsert payload
        val quran   = prefs.getBoolean("quran_reading", false)
        val fasting = prefs.getBoolean("fasting", false)
        val qiyam   = prefs.getBoolean("qiyam", false)

        val body = """{"user_id":"$userId","log_date":"$logDate","quran_reading":$quran,"fasting":$fasting,"qiyam":$qiyam}"""

        val url = URL("$supabaseUrl/rest/v1/daily_logs")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.setRequestProperty("apikey", anonKey)
        conn.setRequestProperty("Authorization", "Bearer $accessToken")
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("Prefer", "resolution=merge-duplicates")
        conn.doOutput = true
        conn.connectTimeout = 8000
        conn.readTimeout = 8000

        conn.outputStream.use { it.write(body.toByteArray()) }

        val code = conn.responseCode
        conn.disconnect()

        if (code == 401) {
            // Token expired — clear it so widget shows "open app" state next cycle
            prefs.edit().putString("access_token", "").apply()
        }
    }

    private fun today(): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
}
