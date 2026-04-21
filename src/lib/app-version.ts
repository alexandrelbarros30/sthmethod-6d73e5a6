declare const __APP_BUILD_ID__: string;
declare const __APP_RELEASE_VERSION__: string;

export const APP_RELEASE_VERSION = __APP_RELEASE_VERSION__;
export const APP_BUILD_ID = __APP_BUILD_ID__;
export const APP_VERSION = `${APP_RELEASE_VERSION}+${APP_BUILD_ID}`;
export const VERSION_KEY = "sth-app-version";
export const AUTO_RELOAD_KEY = "sth-auto-reload-version";
export const VERSION_URL = "/app-version.json";