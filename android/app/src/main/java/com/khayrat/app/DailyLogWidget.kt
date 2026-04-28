package com.khayrat.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.view.View
import android.widget.RemoteViews
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class DailyLogWidget : AppWidgetProvider() {

    companion object {
        const val PREFS = "KhayratWidgetPrefs"
        const val ACTION_TOGGLE_QURAN   = "com.khayrat.app.TOGGLE_QURAN"
        const val ACTION_TOGGLE_FASTING = "com.khayrat.app.TOGGLE_FASTING"
        const val ACTION_TOGGLE_QIYAM   = "com.khayrat.app.TOGGLE_QIYAM"
        const val ACTION_TOGGLE_KAHF    = "com.khayrat.app.TOGGLE_KAHF"

        private fun isFriday(): Boolean =
            Calendar.getInstance().get(Calendar.DAY_OF_WEEK) == Calendar.FRIDAY

        private fun isoToday(): String =
            SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

        // If the stored date doesn't match today, wipe all booleans so stale
        // votes from yesterday never carry over.
        private fun resetIfNewDay(prefs: SharedPreferences) {
            val stored = prefs.getString("log_date", "") ?: ""
            val today  = isoToday()
            if (stored.isNotEmpty() && stored != today) {
                prefs.edit()
                    .putBoolean("quran_reading", false)
                    .putBoolean("fasting",       false)
                    .putBoolean("qiyam",         false)
                    .putBoolean("kahf_reading",  false)
                    .putString("log_date",       today)
                    .apply()
            }
        }

        fun updateAllWidgets(context: Context) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(ComponentName(context, DailyLogWidget::class.java))
            for (id in ids) updateWidget(context, mgr, id)
        }

        fun updateWidget(context: Context, mgr: AppWidgetManager, widgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            resetIfNewDay(prefs)

            val quran   = prefs.getBoolean("quran_reading", false)
            val fasting = prefs.getBoolean("fasting",       false)
            val qiyam   = prefs.getBoolean("qiyam",         false)
            val kahf    = prefs.getBoolean("kahf_reading",  false)
            val friday  = isFriday()
            val dateStr = SimpleDateFormat("EEE, MMM d", Locale.getDefault()).format(Date())

            val views = RemoteViews(context.packageName, R.layout.widget_daily_log)
            views.setTextViewText(R.id.widget_date, dateStr)

            applyRowState(context, views, R.id.row_quran,   R.id.check_quran,   quran,   ACTION_TOGGLE_QURAN,   widgetId)
            applyRowState(context, views, R.id.row_fasting, R.id.check_fasting, fasting, ACTION_TOGGLE_FASTING, widgetId)
            applyRowState(context, views, R.id.row_qiyam,   R.id.check_qiyam,   qiyam,   ACTION_TOGGLE_QIYAM,   widgetId)

            // Kahf row: only visible on Fridays
            views.setViewVisibility(R.id.row_kahf, if (friday) View.VISIBLE else View.GONE)
            if (friday) {
                applyRowState(context, views, R.id.row_kahf, R.id.check_kahf, kahf, ACTION_TOGGLE_KAHF, widgetId)
            }

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
            ACTION_TOGGLE_KAHF    -> "kahf_reading"
            else -> return
        }

        val prefs  = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val newVal = !prefs.getBoolean(field, false)
        prefs.edit().putBoolean(field, newVal).apply()

        // Refresh UI optimistically
        updateAllWidgets(context)

        // Persist to Supabase in a background thread
        val result = goAsync()
        Thread {
            try {
                callSupabase(prefs)
            } catch (_: Exception) {
                // Revert optimistic update if API fails
                prefs.edit().putBoolean(field, !newVal).apply()
                updateAllWidgets(context)
            } finally {
                result.finish()
            }
        }.start()
    }

    private fun callSupabase(prefs: SharedPreferences) {
        val supabaseUrl = prefs.getString("supabase_url",      "") ?: return
        val anonKey     = prefs.getString("supabase_anon_key", "") ?: return
        val accessToken = prefs.getString("access_token",      "") ?: return
        val userId      = prefs.getString("user_id",           "") ?: return

        if (supabaseUrl.isBlank() || accessToken.isBlank() || userId.isBlank()) return

        val quran   = prefs.getBoolean("quran_reading", false)
        val fasting = prefs.getBoolean("fasting",       false)
        val qiyam   = prefs.getBoolean("qiyam",         false)
        val kahf    = prefs.getBoolean("kahf_reading",  false)

        // Always use today's actual date — never the stale cached date
        val logDate = isoToday()

        val body = """{"user_id":"$userId","log_date":"$logDate","quran_reading":$quran,"fasting":$fasting,"qiyam":$qiyam,"kahf_reading":$kahf}"""

        // on_conflict param is required for upsert to work correctly
        val url  = URL("$supabaseUrl/rest/v1/daily_logs?on_conflict=user_id,log_date")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.setRequestProperty("apikey",        anonKey)
        conn.setRequestProperty("Authorization", "Bearer $accessToken")
        conn.setRequestProperty("Content-Type",  "application/json")
        conn.setRequestProperty("Prefer",        "resolution=merge-duplicates")
        conn.doOutput      = true
        conn.connectTimeout = 8000
        conn.readTimeout    = 8000

        conn.outputStream.use { it.write(body.toByteArray()) }

        val code = conn.responseCode
        conn.disconnect()

        if (code == 401) {
            prefs.edit().putString("access_token", "").apply()
        }
    }
}
