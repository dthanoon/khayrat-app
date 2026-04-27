import Foundation
import WidgetKit

@objc(WidgetSyncModule)
class WidgetSyncModule: NSObject {

  @objc
  func syncData(_ data: NSDictionary) {
    guard let defaults = UserDefaults(suiteName: "group.com.khayrat.app") else { return }
    defaults.set(data["userId"]          as? String ?? "", forKey: "user_id")
    defaults.set(data["accessToken"]     as? String ?? "", forKey: "access_token")
    defaults.set(data["supabaseUrl"]     as? String ?? "", forKey: "supabase_url")
    defaults.set(data["supabaseAnonKey"] as? String ?? "", forKey: "supabase_anon_key")
    defaults.set(data["quranReading"]    as? Bool   ?? false, forKey: "quran_reading")
    defaults.set(data["fasting"]         as? Bool   ?? false, forKey: "fasting")
    defaults.set(data["qiyam"]           as? Bool   ?? false, forKey: "qiyam")
    defaults.set(data["kahfReading"]     as? Bool   ?? false, forKey: "kahf_reading")
    defaults.set(data["date"]            as? String ?? "", forKey: "log_date")
    defaults.synchronize()

    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: "KhayratDailyLogWidget")
    }
  }

  @objc
  func syncAuthToken(_ userId: String, accessToken: String, supabaseUrl: String, supabaseAnonKey: String) {
    guard let defaults = UserDefaults(suiteName: "group.com.khayrat.app") else { return }
    defaults.set(userId,         forKey: "user_id")
    defaults.set(accessToken,    forKey: "access_token")
    defaults.set(supabaseUrl,    forKey: "supabase_url")
    defaults.set(supabaseAnonKey, forKey: "supabase_anon_key")
    defaults.synchronize()

    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: "KhayratDailyLogWidget")
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }
}
