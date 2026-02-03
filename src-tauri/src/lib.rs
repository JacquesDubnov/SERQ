// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
// Note: AI commands disabled until keyring API is fixed

use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to SERQ.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // .plugin(tauri_plugin_keyring::init())  // TODO: Re-enable with commands
        .plugin(
            SqlBuilder::default()
                .add_migrations(
                    "sqlite:serq.db",
                    vec![
                        Migration {
                            version: 1,
                            description: "create_versions_table",
                            sql: include_str!("../migrations/001_versions.sql"),
                            kind: MigrationKind::Up,
                        },
                        Migration {
                            version: 2,
                            description: "create_comments_table",
                            sql: include_str!("../migrations/002_comments.sql"),
                            kind: MigrationKind::Up,
                        },
                    ],
                )
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Debug bridge - always active in dev
            commands::debug_bridge_log,
            commands::debug_bridge_clear,
            // TODO: Re-enable after fixing keyring API
            // commands::set_api_key,
            // commands::get_api_key,
            // commands::has_api_key,
            greet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
