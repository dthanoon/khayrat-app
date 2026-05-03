import WidgetKit
import SwiftUI
import AppIntents

let appGroup = "group.com.khayrat.app"

struct WidgetLogData {
    var quranReading:    Bool
    var fasting:         Bool
    var qiyam:           Bool
    var kahfReading:     Bool
    var date:            String
    var accessToken:     String
    var refreshToken:    String
    var supabaseUrl:     String
    var supabaseAnonKey: String
    var userId:          String

    static func load() -> WidgetLogData {
        let d = UserDefaults(suiteName: appGroup)
        return WidgetLogData(
            quranReading:    d?.bool(forKey: "quran_reading")       ?? false,
            fasting:         d?.bool(forKey: "fasting")             ?? false,
            qiyam:           d?.bool(forKey: "qiyam")               ?? false,
            kahfReading:     d?.bool(forKey: "kahf_reading")        ?? false,
            date:            d?.string(forKey: "log_date")          ?? "",
            accessToken:     d?.string(forKey: "access_token")      ?? "",
            refreshToken:    d?.string(forKey: "refresh_token")     ?? "",
            supabaseUrl:     d?.string(forKey: "supabase_url")      ?? "",
            supabaseAnonKey: d?.string(forKey: "supabase_anon_key") ?? "",
            userId:          d?.string(forKey: "user_id")           ?? ""
        )
    }

    static func save(field: String, value: Bool) {
        let d = UserDefaults(suiteName: appGroup)
        d?.set(value, forKey: field)
        d?.synchronize()
    }

    static func saveTokens(accessToken: String, refreshToken: String) {
        let d = UserDefaults(suiteName: appGroup)
        d?.set(accessToken,  forKey: "access_token")
        d?.set(refreshToken, forKey: "refresh_token")
        d?.synchronize()
    }

    // Wipe all activity booleans and advance the stored date to today.
    static func resetForNewDay() {
        let d = UserDefaults(suiteName: appGroup)
        d?.set(false,      forKey: "quran_reading")
        d?.set(false,      forKey: "fasting")
        d?.set(false,      forKey: "qiyam")
        d?.set(false,      forKey: "kahf_reading")
        d?.set(isoToday(), forKey: "log_date")
        d?.synchronize()
    }

    var isAuthenticated: Bool { !accessToken.isEmpty && !userId.isEmpty }
}

struct LogEntry: TimelineEntry {
    let date: Date
    let data: WidgetLogData
}

struct LogProvider: TimelineProvider {
    func placeholder(in context: Context) -> LogEntry {
        LogEntry(date: Date(), data: WidgetLogData.load())
    }

    func getSnapshot(in context: Context, completion: @escaping (LogEntry) -> Void) {
        completion(LogEntry(date: Date(), data: WidgetLogData.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LogEntry>) -> Void) {
        var data = WidgetLogData.load()
        let today = isoToday()

        // Day has rolled over — reset cached booleans so stale ticks don't show
        if !data.date.isEmpty && data.date != today {
            WidgetLogData.resetForNewDay()
            data.quranReading = false
            data.fasting      = false
            data.qiyam        = false
            data.kahfReading  = false
            data.date         = today
        }

        let cal = Calendar.current
        let midnight = cal.nextDate(
            after: Date(),
            matching: DateComponents(hour: 0, minute: 0, second: 0),
            matchingPolicy: .nextTime
        )!

        // Current entry with live data
        let currentEntry = LogEntry(date: Date(), data: data)

        // Midnight entry with blank state so the widget visually resets at day boundary
        var resetData          = data
        resetData.quranReading = false
        resetData.fasting      = false
        resetData.qiyam        = false
        resetData.kahfReading  = false
        let midnightEntry = LogEntry(date: midnight, data: resetData)

        // Ask iOS to call getTimeline again 1 min after midnight so the new day loads cleanly
        let afterMidnight = cal.date(byAdding: .minute, value: 1, to: midnight)!
        completion(Timeline(entries: [currentEntry, midnightEntry], policy: .after(afterMidnight)))
    }
}

private struct TokenResponse: Decodable {
    let access_token:  String
    let refresh_token: String
}

// Calls Supabase token endpoint to rotate the access + refresh token pair.
// Saves the new tokens to shared UserDefaults so the next widget reload picks them up.
func refreshTokens(_ data: WidgetLogData) async -> WidgetLogData? {
    guard !data.refreshToken.isEmpty,
          let url = URL(string: "\(data.supabaseUrl)/auth/v1/token?grant_type=refresh_token")
    else { return nil }

    var req = URLRequest(url: url)
    req.httpMethod = "POST"
    req.setValue(data.supabaseAnonKey, forHTTPHeaderField: "apikey")
    req.setValue("application/json",   forHTTPHeaderField: "Content-Type")
    req.httpBody = try? JSONSerialization.data(withJSONObject: ["refresh_token": data.refreshToken])

    guard let (body, response) = try? await URLSession.shared.data(for: req),
          (response as? HTTPURLResponse)?.statusCode == 200,
          let tokens = try? JSONDecoder().decode(TokenResponse.self, from: body)
    else { return nil }

    WidgetLogData.saveTokens(accessToken: tokens.access_token, refreshToken: tokens.refresh_token)

    var updated = data
    updated.accessToken  = tokens.access_token
    updated.refreshToken = tokens.refresh_token
    return updated
}

func buildUpsertRequest(url: URL, data: WidgetLogData) -> URLRequest {
    let body: [String: Any] = [
        "user_id":       data.userId,
        "log_date":      isoToday(),
        "quran_reading": data.quranReading,
        "fasting":       data.fasting,
        "qiyam":         data.qiyam,
        "kahf_reading":  data.kahfReading,
    ]
    var req = URLRequest(url: url)
    req.httpMethod = "POST"
    req.setValue(data.supabaseAnonKey,          forHTTPHeaderField: "apikey")
    req.setValue("Bearer \(data.accessToken)",  forHTTPHeaderField: "Authorization")
    req.setValue("application/json",            forHTTPHeaderField: "Content-Type")
    req.setValue("resolution=merge-duplicates", forHTTPHeaderField: "Prefer")
    req.httpBody = try? JSONSerialization.data(withJSONObject: body)
    return req
}

// Always writes today's actual date. Awaited inside perform() so the App Intents
// framework keeps the process alive until the network call completes.
// On 401, rotates the token pair and retries once — covers the case where the user
// hasn't opened the app in days and the access token has expired.
func upsertLog(_ data: WidgetLogData) async {
    guard data.isAuthenticated,
          let url = URL(string: "\(data.supabaseUrl)/rest/v1/daily_logs?on_conflict=user_id,log_date")
    else { return }

    guard let (_, response) = try? await URLSession.shared.data(for: buildUpsertRequest(url: url, data: data)) else { return }
    let status = (response as? HTTPURLResponse)?.statusCode ?? 0

    // 2xx = success, non-401 error = nothing we can fix here
    guard status == 401 else { return }

    // Access token expired — refresh and retry once
    guard let refreshed = await refreshTokens(data) else { return }
    _ = try? await URLSession.shared.data(for: buildUpsertRequest(url: url, data: refreshed))
}

func isoToday() -> String {
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: Date())
}

// weekday: 1 = Sunday … 6 = Friday
func isFriday() -> Bool {
    Calendar.current.component(.weekday, from: Date()) == 6
}

@available(iOS 17.0, *)
struct ToggleQuranIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Quran Reading"
    func perform() async throws -> some IntentResult {
        var data = WidgetLogData.load()
        data.quranReading.toggle()
        WidgetLogData.save(field: "quran_reading", value: data.quranReading)
        await upsertLog(data)
        return .result()
    }
}

@available(iOS 17.0, *)
struct ToggleFastingIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Fasting"
    func perform() async throws -> some IntentResult {
        var data = WidgetLogData.load()
        data.fasting.toggle()
        WidgetLogData.save(field: "fasting", value: data.fasting)
        await upsertLog(data)
        return .result()
    }
}

@available(iOS 17.0, *)
struct ToggleQiyamIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Qiyam"
    func perform() async throws -> some IntentResult {
        var data = WidgetLogData.load()
        data.qiyam.toggle()
        WidgetLogData.save(field: "qiyam", value: data.qiyam)
        await upsertLog(data)
        return .result()
    }
}

@available(iOS 17.0, *)
struct ToggleKahfIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Kahf Reading"
    func perform() async throws -> some IntentResult {
        var data = WidgetLogData.load()
        data.kahfReading.toggle()
        WidgetLogData.save(field: "kahf_reading", value: data.kahfReading)
        await upsertLog(data)
        return .result()
    }
}

struct LogRowView: View {
    let emoji:   String
    let label:   String
    let checked: Bool

    var body: some View {
        HStack {
            Text("\(emoji) \(label)")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(checked ? Color(hex: "#d1fae5") : .white.opacity(0.85))
            Spacer()
            Image(systemName: checked ? "checkmark.circle.fill" : "circle")
                .foregroundColor(checked ? Color(hex: "#10b981") : Color.white.opacity(0.3))
                .font(.system(size: 14))
        }
        .padding(.horizontal, 10)
        .frame(height: 32)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(checked ? Color(hex: "#0d3326") : Color.white.opacity(0.06))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(checked ? Color(hex: "#10b981") : Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
}

struct KhayratWidgetEntryView: View {
    let entry: LogEntry

    var body: some View {
        if !entry.data.isAuthenticated {
            unauthenticatedView
        } else {
            mainView
        }
    }

    private var unauthenticatedView: some View {
        VStack(spacing: 6) {
            Text("🌿 Khayrat")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(Color(hex: "#10b981"))
            Text("Open app to sign in")
                .font(.system(size: 11))
                .foregroundColor(.white.opacity(0.4))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "#0f0f0f"))
        .widgetURL(URL(string: "khayrat://login"))
    }

    @ViewBuilder
    private var mainView: some View {
        let data   = entry.data
        let friday = isFriday()
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("🌿 Khayrat")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(Color(hex: "#10b981"))
                Spacer()
                Text(shortDate())
                    .font(.system(size: 10))
                    .foregroundColor(.white.opacity(0.4))
            }

            if #available(iOS 17.0, *) {
                Button(intent: ToggleQuranIntent()) {
                    LogRowView(emoji: "📖", label: "Quran", checked: data.quranReading)
                }.buttonStyle(.plain)

                Button(intent: ToggleFastingIntent()) {
                    LogRowView(emoji: "🌙", label: "Fasting", checked: data.fasting)
                }.buttonStyle(.plain)

                Button(intent: ToggleQiyamIntent()) {
                    LogRowView(emoji: "⭐", label: "Qiyam", checked: data.qiyam)
                }.buttonStyle(.plain)

                if friday {
                    Button(intent: ToggleKahfIntent()) {
                        LogRowView(emoji: "📗", label: "Kahf", checked: data.kahfReading)
                    }.buttonStyle(.plain)
                }
            } else {
                LogRowView(emoji: "📖", label: "Quran", checked: data.quranReading)
                LogRowView(emoji: "🌙", label: "Fasting", checked: data.fasting)
                LogRowView(emoji: "⭐", label: "Qiyam", checked: data.qiyam)
                if friday {
                    LogRowView(emoji: "📗", label: "Kahf", checked: data.kahfReading)
                }
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "#0f0f0f"))
        .widgetURL(URL(string: "khayrat://log"))
    }

    private func shortDate() -> String {
        let f = DateFormatter()
        f.dateFormat = "EEE, MMM d"
        return f.string(from: Date())
    }
}

struct KhayratDailyLogWidget: Widget {
    let kind = "KhayratDailyLogWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LogProvider()) { entry in
            KhayratWidgetEntryView(entry: entry)
                .containerBackground(Color(hex: "#0f0f0f"), for: .widget)
        }
        .configurationDisplayName("Khayrat Daily Log")
        .description("Log your Quran, Fasting, and Qiyam without opening the app.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8)  & 0xFF) / 255
        let b = Double(int & 0xFF)          / 255
        self.init(red: r, green: g, blue: b)
    }
}
