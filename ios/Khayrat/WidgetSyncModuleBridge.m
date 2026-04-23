#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetSyncModule, NSObject)
RCT_EXTERN_METHOD(syncData:(NSDictionary *)data)
@end
