#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetSyncModule, NSObject)
RCT_EXTERN_METHOD(syncData:(NSDictionary *)data)
RCT_EXTERN_METHOD(syncAuthToken:(NSString *)userId
                  accessToken:(NSString *)accessToken
                  refreshToken:(NSString *)refreshToken
                  supabaseUrl:(NSString *)supabaseUrl
                  supabaseAnonKey:(NSString *)supabaseAnonKey)
@end
