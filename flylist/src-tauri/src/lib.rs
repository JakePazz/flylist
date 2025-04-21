// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_plugin_shell;
use tauri_plugin_store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    let migrations = vec![
        Migration {
            version: 1,
            description: "create flights table",
            sql: "CREATE TABLE IF NOT EXISTS flights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dep_airport TEXT NOT NULL,
                arr_airport TEXT NOT NULL,
                flight_num TEXT NOT NULL,
                callsign TEXT NOT NULL,
                ac_type TEXT NOT NULL,
                duration INTEGER NOT NULL,
                archived BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_edited DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create aircraft table",
            sql: "CREATE TABLE IF NOT EXISTS aircraft (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                model TEXT NOT NULL,
                manufacturer TEXT NOT NULL,
                icao_code TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            kind: MigrationKind::Up,
        },
    ];


    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:flylist.db", migrations)
                .build()
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

