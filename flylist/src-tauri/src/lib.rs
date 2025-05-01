// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::command;
use tauri_plugin_shell;
use tauri_plugin_sql::{Migration, MigrationKind};
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
                airline_icao TEXT NOT NULL,
                aircraft INTEGER NOT NULL,
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
        Migration {
            version: 3,
            description: "create airports table",
            sql: "CREATE TABLE IF NOT EXISTS airports (
                id INTEGER PRIMARY KEY NOT NULL,
                type TEXT NOT NULL,
                name TEXT NOT NULL,
                latitude_deg REAL NOT NULL,
                longitude_deg REAL NOT NULL,
                elevation_ft INTEGER,
                continent TEXT NOT NULL,
                iso_country TEXT NOT NULL,
                iso_region TEXT NOT NULL,
                icao_code TEXT,
                iata_code TEXT,
                home_link TEXT
            )",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create airlines table",
            sql: "CREATE TABLE IF NOT EXISTS airlines (
                id INTEGER PRIMARY KEY NOT NULL,
                name STRING NOT NULL,
                alias STRING,
                iata STRING,
                icao STRING NOT NULL,
                callsign STRING,
                country STRING NOT NULL,
                active BOOLEAN NOT NULL
            )",
            kind: MigrationKind::Up,
        },
    ];

    #[command]
    async fn fetch_weather(icao: String, api_key: String) -> Result<String, String> {

        // Build URL with API key in header
        let client = reqwest::Client::new();
        let url = format!("https://api.checkwx.com/metar/{}/decoded", icao);
        
        match client.get(&url)
            .header("X-API-Key", api_key)
            .send()
            .await {
                Ok(response) => match response.text().await {
                    Ok(text) => Ok(text),
                    Err(e) => Err(format!("CheckWX request failed for {}: {}", icao, e)),
                },
                Err(e) => Err(format!("CheckWX request failed for {}: {}", icao, e)),
            }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![fetch_weather])
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:flylist.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
