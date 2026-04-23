import WidgetKit
import SwiftUI
import AppIntents

let appGroup = "group.com.khayrat.app"

struct WidgetLogData {
    var quranReading: Bool
    var fasting: Bool
    var qiyam: Bool
    var date: String
    var accessToken: String
    var supabaseUrl: String
    var supabaseAnonKey: String
    var userId: String

    static func load() -> WidgetLogData {
        let d = UserDefaults(suiteName: appGroup)
        return WidgetLogData(
            quranReading:    d?.bool(forKey: "quran_reading")    ?? false,
            fasting:         d?.bool(forKey: "fasting")          ?? false,
            qiyam:           d?.bool(forKey: "qiyam")            ?? false,
            date:            d?.string(forKey: "log_date")        ?? "",
            accessToken:     d?.string(forKey: "access_token")   ?? "",
            supabaseUrl:     d?.string(forKey: "supabase_url")   ?? "",
            supabaseAnonKey: d?.string(forKey: "supabase_anon_key") ?? "",
            userId:          d?.string(forKey: "user_id")        ?? ""
        )
    }

    static func save(field: String, value: Bool) {
        let d = UserDefaults(suiteName: appGroup)
        d?.set(value, forKey: field)
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
        let entry = LogEntry(date: Date(), data: WidgetLogData.load())
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

func upsertLog(_ data: WidgetLogData) {
    guard data.isAuthenticated,
          let url = URL(string: "\(data.supabaseUrl)/rest/v1/daily_logs") else { return }

    let today = data.date.isEmpty ? isoToday() : data.date
    let body: [String: Any] = [
        "user_id": data.userId,
        "log_date": today,
        "quran_reading": data.quranReading,
        "fasting": data.fasting,
        "qiyam": data.qiyam,
    ]

    var req = URLRequest(url: url)
    req.httpMethod = "POST"
    req.setValue(data.supabaseAnonKey, forHTTPHeaderField: "apikey")
    req.setValue("Bearer \(data.accessToken)", forHTTPHeaderField: "Authorization")
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.setValue("resolution=merge-duplicates", forHTTPHeaderField: "Prefer")
    req.httpBody = try? JSONSerialization.data(withJSONObject: body)
    URLSession.shared.dataTask(with: req).resume()
}

func isoToday() -> String {
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: Date())
}

@available(iOS 17.0, *)
struct ToggleQuranIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Quran Reading"
    func perform() async throws -> some IntentResult {
        var data = WidgetLogData.load()
        data.quranReading.toggle()
        WidgetLogData.save(field: "quran_reading", value: data.quranReading)
        upsertLog(data)
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
        upsertLog(data)
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
        upsertLog(data)
        return .result()
    }
}

struct LogRowView: View {
    let emoji: String
    let label: String
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
        let data = entry.data
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
            } else {
                LogRowView(emoji: "📖", label: "Quran", checked: data.quranReading)
                LogRowView(emoji: "🌙", label: "Fasting", checked: data.fasting)
                LogRowView(emoji: "⭐", label: "Qiyam", checked: data.qiyam)
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
