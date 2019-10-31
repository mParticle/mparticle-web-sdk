export interface ApplicationInformation {
    application_name?: string;
    application_version?: string;
    application_build_number?: string;
    install_referrer?: string;
    _package?: string;
    os?: ApplicationInformationOsEnum;
    apple_search_ads_attributes?: { [key: string]: { [key: string]: string } };
}

/**
 * Enum for the os property.
 */
export type ApplicationInformationOsEnum =
    | 'Unknown'
    | 'IOS'
    | 'Android'
    | 'WindowsPhone'
    | 'MobileWeb'
    | 'UnityIOS'
    | 'UnityAndroid'
    | 'Desktop'
    | 'TVOS'
    | 'Roku'
    | 'OutOfBand'
    | 'Alexa'
    | 'SmartTV'
    | 'FireTV'
    | 'Xbox';

export interface ApplicationStateTransitionEvent {
    data?: ApplicationStateTransitionEventData;
    event_type: ApplicationStateTransitionEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type ApplicationStateTransitionEventEventTypeEnum = 'application_state_transition';

export interface ApplicationStateTransitionEventData extends CommonEventData {
    successfully_closed?: boolean;
    is_first_run: boolean;
    is_upgrade: boolean;
    push_notification_payload?: string;
    launch_referral?: string;
    application_transition_type: ApplicationStateTransitionEventDataApplicationTransitionTypeEnum;
}

/**
 * Enum for the application_transition_type property.
 */
export type ApplicationStateTransitionEventDataApplicationTransitionTypeEnum =
    | 'application_initialized'
    | 'application_exit'
    | 'application_background'
    | 'application_foreground';

export interface AttributionInfo {
    service_provider: string;
    publisher: string;
    campaign: string;
}

export interface BaseEvent {
    data?: CommonEventData;
    event_type: EventType;
}

export interface Batch {
    source_request_id?: string;
    /**
     * Provide a list of event objects - such as CustomEvent, ScreenViewEvent, or CommerceEvent
     */
    events?: BaseEvent[];
    device_info?: DeviceInformation;
    application_info?: ApplicationInformation;
    user_attributes?: { [key: string]: string | string[] };
    deleted_user_attributes?: string[];
    user_identities?: BatchUserIdentities;
    environment: BatchEnvironmentEnum;
    api_key?: string;
    api_keys?: string[];
    ip?: string;
    integration_attributes?: { [key: string]: { [key: string]: string } };
    partner_identity?: string;
    source_info?: SourceInformation;
    mp_deviceid?: string;
    attribution_info?: AttributionInfo;
    timestamp_unixtime_ms?: number;
    batch_id?: string | number;
    mpid: string | number;
    sdk_version?: string;
    consent_state?: ConsentState;
    job_id?: string;
}

/**
 * Enum for the environment property.
 */
export type BatchEnvironmentEnum = 'unknown' | 'development' | 'production';

export interface BatchUserIdentities {
    other?: string;
    customer_id?: string;
    facebook?: string;
    twitter?: string;
    google?: string;
    microsoft?: string;
    yahoo?: string;
    email?: string;
    alias?: string;
    facebook_custom_audience_id?: string;
    other_id_2?: string;
    other_id_3?: string;
    other_id_4?: string;
}

export interface BreadcrumbEvent {
    data?: BreakcrumbEventData;
    event_type: BreadcrumbEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type BreadcrumbEventEventTypeEnum = 'breadcrumb';

export interface BreakcrumbEventData extends CommonEventData {
    session_number?: number;
    label: string;
}

export interface CommerceEvent {
    data?: CommerceEventData;
    event_type: CommerceEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type CommerceEventEventTypeEnum = 'commerce_event';

export interface CommerceEventData extends CommonEventData {
    product_action?: ProductAction;
    promotion_action?: PromotionAction;
    product_impressions?: ProductImpression[];
    shopping_cart?: ShoppingCart;
    currency_code?: string;
    screen_name?: string;
    is_non_interactive?: boolean;
    event_name?: string;
    custom_event_type?: CommerceEventDataCustomEventTypeEnum;
    custom_flags?: { [key: string]: string };
}

/**
 * Enum for the custom_event_type property.
 */
export type CommerceEventDataCustomEventTypeEnum =
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'checkout'
    | 'checkout_option'
    | 'click'
    | 'view_detail'
    | 'purchase'
    | 'refund'
    | 'promotion_view'
    | 'promotion_click'
    | 'add_to_wishlist'
    | 'remove_from_wishlist'
    | 'impression';

export interface CommonEventData {
    timestamp_unixtime_ms?: number;
    event_id?: number;
    source_message_id?: string;
    session_id?: number;
    session_uuid?: string;
    session_start_unixtime_ms?: number;
    event_start_unixtime_ms?: number;
    custom_attributes?: { [key: string]: string };
    location?: GeoLocation;
    device_current_state?: DeviceCurrentState;
    is_goal_defined?: boolean;
    lifetime_value_change?: boolean;
    lifetime_value_attribute_name?: string;
    data_connection_type?: string;
    event_num?: number;
    view_controller?: string;
    is_main_thread?: boolean;
    canonical_name?: string;
    event_system_notification_info?: EventSystemNotificationInfo;
}

export interface ConsentState {
    gdpr: { [key: string]: GDPRConsentState };
}

export interface CrashReportEvent {
    data?: CrashReportEventData;
    event_type: CrashReportEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type CrashReportEventEventTypeEnum = 'crash_report';

export interface CrashReportEventData extends CommonEventData {
    breadcrumbs?: string[];
    class_name?: string;
    severity?: string;
    message?: string;
    stack_trace?: string;
    exception_handled?: boolean;
    topmost_context?: string;
    pl_crash_report_file_base64?: string;
    ios_image_base_address?: number;
    ios_image_size?: number;
    session_number?: number;
}

export interface CustomEvent {
    data?: CustomEventData;
    event_type: CustomEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type CustomEventEventTypeEnum = 'custom_event';

export interface CustomEventData extends CommonEventData {
    custom_event_type: CustomEventDataCustomEventTypeEnum;
    event_name: string;
    custom_flags?: { [key: string]: string };
}

/**
 * Enum for the custom_event_type property.
 */
export type CustomEventDataCustomEventTypeEnum =
    | 'unknown'
    | 'navigation'
    | 'location'
    | 'search'
    | 'transaction'
    | 'user_content'
    | 'user_preference'
    | 'social'
    | 'other';

export interface DeviceCurrentState {
    time_since_start_ms?: number;
    battery_level?: number;
    data_connection_type?: string;
    data_connection_type_detail?: string;
    gps_state?: boolean;
    total_system_memory_usage_bytes?: number;
    disk_space_free_bytes?: number;
    external_disk_space_free_bytes?: number;
    cpu?: string;
    system_memory_available_bytes?: number;
    system_memory_low?: boolean;
    system_memory_threshold_bytes?: number;
    application_memory_available_bytes?: number;
    application_memory_max_bytes?: number;
    application_memory_total_bytes?: number;
    device_orientation?: DeviceCurrentStateDeviceOrientationEnum;
    status_bar_orientation?: DeviceCurrentStateStatusBarOrientationEnum;
}

/**
 * Enum for the device_orientation property.
 */
export type DeviceCurrentStateDeviceOrientationEnum =
    | 'portrait'
    | 'portrait_upside_down'
    | 'landscape'
    | 'LandscapeLeft'
    | 'LandscapeRight'
    | 'FaceUp'
    | 'FaceDown'
    | 'Square';

/**
 * Enum for the status_bar_orientation property.
 */
export type DeviceCurrentStateStatusBarOrientationEnum =
    | 'portrait'
    | 'portrait_upside_down'
    | 'landscape'
    | 'LandscapeLeft'
    | 'LandscapeRight'
    | 'FaceUp'
    | 'FaceDown'
    | 'Square';

export interface DeviceInformation {
    brand?: string;
    product?: string;
    device?: string;
    android_uuid?: string;
    device_manufacturer?: string;
    platform?: DeviceInformationPlatformEnum;
    os_version?: string;
    device_model?: string;
    screen_height?: number;
    screen_width?: number;
    screen_dpi?: number;
    device_country?: string;
    locale_language?: string;
    locale_country?: string;
    network_country?: string;
    network_carrier?: string;
    network_code?: string;
    network_mobile_country_code?: string;
    timezone_offset?: number;
    build_identifier?: string;
    http_header_user_agent?: string;
    ios_advertising_id?: string;
    push_token?: string;
    cpu_architecture?: string;
    is_tablet?: boolean;
    push_notification_sound_enabled?: boolean;
    push_notification_vibrate_enabled?: boolean;
    radio_access_technology?: string;
    supports_telephony?: boolean;
    has_nfc?: boolean;
    bluetooth_enabled?: boolean;
    bluetooth_version?: string;
    ios_idfv?: string;
    android_advertising_id?: string;
    build_version_release?: string;
    limit_ad_tracking?: boolean;
    amp_id?: string;
    is_dst?: boolean;
    roku_advertising_id?: string;
    roku_publisher_id?: string;
    microsoft_advertising_id?: string;
    microsoft_publisher_id?: string;
    fire_advertising_id?: string;
}

/**
 * Enum for the platform property.
 */
export type DeviceInformationPlatformEnum =
    | 'iOS'
    | 'Android'
    | 'web'
    | 'desktop'
    | 'tvOS'
    | 'roku'
    | 'out_of_band'
    | 'smart_tv'
    | 'xbox';

export interface EventSystemNotificationInfo {
    type: EventSystemNotificationInfoTypeEnum;
}

/**
 * Enum for the type property.
 */
export type EventSystemNotificationInfoTypeEnum = 'gdpr_change';

export type EventType =
    | 'unknown'
    | 'session_start'
    | 'session_end'
    | 'screen_view'
    | 'custom_event'
    | 'crash_report'
    | 'opt_out'
    | 'first_run'
    | 'pre_attribution'
    | 'push_registration'
    | 'application_state_transition'
    | 'push_message'
    | 'network_performance'
    | 'breadcrumb'
    | 'profile'
    | 'push_reaction'
    | 'commerce_event'
    | 'user_attribute_change'
    | 'user_identity_change'
    | 'uninstall';
export interface GDPRConsentState {
    regulation?: string;
    document?: string;
    consented: boolean;
    timestamp_unixtime_ms?: number;
    location?: string;
    hardware_id?: string;
}

export interface GeoLocation {
    latitude: number | string;
    longitude: number | string;
    accuracy?: number | string;
}

export type identityType =
    | 'other'
    | 'customer_id'
    | 'facebook'
    | 'twitter'
    | 'google'
    | 'microsoft'
    | 'yahoo'
    | 'email'
    | 'alias'
    | 'facebook_custom_audience_id'
    | 'other_id_2'
    | 'other_id_3'
    | 'other_id_4';
export interface NetworkPerformanceEvent {
    data?: NetworkPerformanceEventData;
    event_type: NetworkPerformanceEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type NetworkPerformanceEventEventTypeEnum = 'network_performance';

export interface NetworkPerformanceEventData extends CommonEventData {
    http_verb?: string;
    url: string;
    time_elapsed?: number;
    bytes_in?: number;
    bytes_out?: number;
    response_code: number;
    data?: string;
}

export interface OptOutEvent {
    data?: OptOutEventData;
    event_type: OptOutEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type OptOutEventEventTypeEnum = 'opt_out';

export interface OptOutEventData extends CommonEventData {
    is_opted_out: boolean;
}

export interface Product {
    id?: string;
    name?: string;
    brand?: string;
    category?: string;
    variant?: string;
    position?: number;
    price?: number;
    quantity?: number;
    coupon_code?: string;
    added_to_cart_time_ms?: number;
    total_product_amount?: number;
    custom_attributes?: { [key: string]: string };
}

export interface ProductAction {
    action: ProductActionActionEnum;
    checkout_step?: number;
    checkout_options?: string;
    product_action_list?: string;
    product_list_source?: string;
    transaction_id?: string;
    affiliation?: string;
    total_amount?: number;
    tax_amount?: number;
    shipping_amount?: number;
    coupon_code?: string;
    products?: Product[];
}

/**
 * Enum for the action property.
 */
export type ProductActionActionEnum =
    | 'unknown'
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'checkout'
    | 'checkout_option'
    | 'click'
    | 'view_detail'
    | 'purchase'
    | 'refund'
    | 'add_to_wishlist'
    | 'remove_from_wish_list';

export interface ProductImpression {
    product_impression_list?: string;
    products?: Product[];
}

export interface ProfileEvent {
    data?: ProfileEventData;
    event_type: ProfileEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type ProfileEventEventTypeEnum = 'profile';

export interface ProfileEventData extends CommonEventData {
    previous_mpid: number;
    current_mpid: number;
    profile_event_type: ProfileEventDataProfileEventTypeEnum;
}

/**
 * Enum for the profile_event_type property.
 */
export type ProfileEventDataProfileEventTypeEnum =
    | 'signup'
    | 'login'
    | 'logout'
    | 'update'
    | 'delete';

export interface Promotion {
    id: string;
    name: string;
    creative: string;
    position: string;
}

export interface PromotionAction {
    action: PromotionActionActionEnum;
    promotions: Promotion[];
}

/**
 * Enum for the action property.
 */
export type PromotionActionActionEnum = 'view' | 'click';

export interface PushMessageEvent {
    data?: PushMessageEventData;
    event_type: PushMessageEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type PushMessageEventEventTypeEnum = 'push_message';

export interface PushMessageEventData extends CommonEventData {
    push_message_token: string;
    push_message_type: PushMessageEventDataPushMessageTypeEnum;
    message?: string;
    network?: string;
    push_notification_payload: string;
    application_state?: PushMessageEventDataApplicationStateEnum;
    action_identifier?: string;
    push_message_behavior?: PushMessageEventDataPushMessageBehaviorEnum;
}

/**
 * Enum for the push_message_type property.
 */
export type PushMessageEventDataPushMessageTypeEnum =
    | 'sent'
    | 'received'
    | 'action';

/**
 * Enum for the application_state property.
 */
export type PushMessageEventDataApplicationStateEnum =
    | 'not_running'
    | 'background'
    | 'foreground';

/**
 * Enum for the push_message_behavior property.
 */
export type PushMessageEventDataPushMessageBehaviorEnum =
    | 'Received'
    | 'DirectOpen'
    | 'Read'
    | 'InfluencedOpen'
    | 'Displayed';

export interface PushRegistrationEvent {
    data?: PushRegistrationEventData;
    event_type: PushRegistrationEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type PushRegistrationEventEventTypeEnum = 'push_registration';

export interface PushRegistrationEventData extends CommonEventData {
    register: boolean;
    registration_token: string;
}

export interface ScreenViewEvent {
    data?: ScreenViewEventData;
    event_type: ScreenViewEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type ScreenViewEventEventTypeEnum = 'screen_view';

export interface ScreenViewEventData extends CommonEventData {
    screen_name: string;
    activity_type?: string;
    custom_flags?: { [key: string]: string };
}

export interface SessionEndEvent {
    data?: SessionEndEventData;
    event_type: SessionEndEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type SessionEndEventEventTypeEnum = 'session_end';

export interface SessionEndEventData extends CommonEventData {
    session_duration_ms: number;
}

export interface SessionStartEvent {
    data?: SessionStartEventData;
    event_type: SessionStartEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type SessionStartEventEventTypeEnum = 'session_start';

export interface SessionStartEventData extends CommonEventData {}

export interface ShoppingCart {
    products: Product[];
}

export interface SourceInformation {
    channel?: SourceInformationChannelEnum;
    partner?: string;
    replay_request_id?: string;
    replay_job_id?: string;
    is_historical?: boolean;
}

/**
 * Enum for the channel property.
 */
export type SourceInformationChannelEnum =
    | 'native'
    | 'javascript'
    | 'pixel'
    | 'desktop'
    | 'partner'
    | 'server_to_server';

export interface UserAttributeChangeEvent {
    data?: UserAttributeChangeEventData;
    event_type: UserAttributeChangeEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type UserAttributeChangeEventEventTypeEnum = 'user_attribute_change';

export interface UserAttributeChangeEventData extends CommonEventData {
    user_attribute_name: string;
    new: string | string[];
    old: string | string[];
    deleted: boolean;
    is_new_attribute: boolean;
}

export interface UserIdentity {
    identity_type: identityType;
    identity: string;
    timestamp_unixtime_ms: number;
    created_this_batch: boolean;
}

export interface UserIdentityChangeEvent {
    data?: UserIdentityChangeEventData;
    event_type: UserIdentityChangeEventEventTypeEnum;
}

/**
 * Enum for the event_type property.
 */
export type UserIdentityChangeEventEventTypeEnum = 'user_identity_change';

export interface UserIdentityChangeEventData extends CommonEventData {
    new: UserIdentity;
    old: UserIdentity;
}
