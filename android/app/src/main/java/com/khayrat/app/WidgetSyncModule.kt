package com.khayrat.app

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class WidgetSyncModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "WidgetSyncModule"

    @ReactMethod
    fun syncData(data: ReadableMap) {
        val prefs = reactContext.getSharedPreferences(
            DailyLogWidget.PREFS, Context.MODE_PRIVATE
        )
        prefs.edit().apply {
            putString("user_id",          data.getString("userId") ?: "")
            putString("access_token",     data.getString("accessToken") ?: "")
            putString("supabase_url",     data.getString("supabaseUrl") ?: "")
            putString("supabase_anon_key",data.getString("supabaseAnonKey") ?: "")
            putBoolean("quran_reading",   data.getBoolean("quranReading"))
            putBoolean("fasting",         data.getBoolean("fasting"))
            putBoolean("qiyam",           data.getBoolean("qiyam"))
            putString("log_date",         data.getString("date") ?: "")
        }.apply()

        // Refresh all widgets immediately
        DailyLogWidget.updateAllWidgets(reactContext)
    }
}
