use tauri::{ AppHandle, Manager };

fn show_window(app: &AppHandle) {
    let windows = app.webview_windows();

    windows
        .values()
        .next()
        .expect("Sorry, no window found.")
        .set_focus()
        .expect("Can't Bring Window to Focus.");
}

pub fn run() {
    tauri::Builder
        ::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_single_instance::init(|app, _args, _cwd| {
                let _ = show_window(app);
            })
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
