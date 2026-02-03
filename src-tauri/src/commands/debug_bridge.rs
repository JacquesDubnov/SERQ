use std::fs::OpenOptions;
use std::io::Write;

/// Receives log entries from the frontend debug bridge and writes them to a file.
/// The file lives at ~/.serq-debug.log so Claude Code can read it with a simple `cat` or `tail -f`.
#[tauri::command]
pub fn debug_bridge_log(entry: String) -> Result<(), String> {
    let home = std::env::var("HOME").map_err(|e| e.to_string())?;
    let log_path = format!("{}/.serq-debug.log", home);

    // Parse the JSON entry to format it nicely
    let parsed: serde_json::Value = serde_json::from_str(&entry).map_err(|e| e.to_string())?;

    let level = parsed["level"].as_str().unwrap_or("log");
    let message = parsed["message"].as_str().unwrap_or("");
    let timestamp = parsed["timestamp"].as_str().unwrap_or("");
    let source = parsed["source"].as_str();
    let stack = parsed["stack"].as_str();

    // Format: [TIMESTAMP] LEVEL: message
    let mut line = format!("[{}] {}: {}", timestamp, level.to_uppercase(), message);

    if let Some(src) = source {
        line.push_str(&format!("\n  at {}", src));
    }
    if let Some(st) = stack {
        // Indent stack trace lines
        for stack_line in st.lines() {
            line.push_str(&format!("\n  {}", stack_line));
        }
    }
    line.push('\n');

    // Append to log file (create if doesn't exist)
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .map_err(|e| format!("Failed to open log file: {}", e))?;

    file.write_all(line.as_bytes())
        .map_err(|e| format!("Failed to write to log file: {}", e))?;

    // Also rotate if file gets too large (>5MB) - truncate to last 1MB
    let metadata = std::fs::metadata(&log_path).map_err(|e| e.to_string())?;
    if metadata.len() > 5 * 1024 * 1024 {
        let content = std::fs::read_to_string(&log_path).map_err(|e| e.to_string())?;
        let keep_from = content.len().saturating_sub(1024 * 1024);
        // Find the next newline after the cut point for clean truncation
        let start = content[keep_from..].find('\n').map(|i| keep_from + i + 1).unwrap_or(keep_from);
        std::fs::write(&log_path, &content[start..]).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Clear the debug log file - callable from frontend or CLI
#[tauri::command]
pub fn debug_bridge_clear() -> Result<(), String> {
    let home = std::env::var("HOME").map_err(|e| e.to_string())?;
    let log_path = format!("{}/.serq-debug.log", home);
    std::fs::write(&log_path, "").map_err(|e| e.to_string())?;
    Ok(())
}
