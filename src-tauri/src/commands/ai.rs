use tauri::AppHandle;
use tauri_plugin_keyring::KeyringExt;

const SERVICE: &str = "com.serq.app";
const KEY_NAME: &str = "anthropic-api-key";

/// Store API key in system keychain (macOS Keychain)
#[tauri::command]
pub fn set_api_key(app: AppHandle, key: String) -> Result<(), String> {
    app.keyring()
        .set(SERVICE, KEY_NAME, &key)
        .map_err(|e| format!("Failed to store API key: {}", e))
}

/// Retrieve API key from keychain
/// Returns None if no key is stored
#[tauri::command]
pub fn get_api_key(app: AppHandle) -> Result<Option<String>, String> {
    match app.keyring().get(SERVICE, KEY_NAME) {
        Ok(key) => {
            // Treat empty string as "not set"
            if key.is_empty() {
                Ok(None)
            } else {
                Ok(Some(key))
            }
        }
        Err(tauri_plugin_keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("Failed to retrieve API key: {}", e)),
    }
}

/// Check if API key exists without retrieving it
#[tauri::command]
pub fn has_api_key(app: AppHandle) -> Result<bool, String> {
    match app.keyring().get(SERVICE, KEY_NAME) {
        Ok(key) => Ok(!key.is_empty()),
        Err(tauri_plugin_keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(format!("Failed to check API key: {}", e)),
    }
}
