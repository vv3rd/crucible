// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};

use select::document::Document;
use select::predicate::Name;
use serde::Serialize;
use tauri::Manager;

#[tauri::command]
async fn get_random_wiki_title() -> Result<String, String> {
    let response = match reqwest::get("https://en.wikipedia.org/wiki/Special:Random").await {
        Ok(response) => response,
        Err(_) => return Ok("Initiating request to wiki failed".into()),
    };

    if !response.status().is_success() {
        return Ok("Request to wiki was unsuccessful".into());
    };

    let wiki_page = response.text().await.unwrap_or_default();
    let document = Document::from(wiki_page.as_str());

    let title = match document.find(Name("h1")).next() {
        Some(title) => title,
        None => return Ok("Couldn't find wiki page title".into()),
    };

    Ok(title.text())
}

#[derive(Serialize, Debug, Clone)]
struct FoundVideo {
    id: String,
    for_query: String,
}

#[tauri::command]
fn search_youtube(app: tauri::AppHandle, search_term: &str, videos_amount: i32) {
    let args = Vec::from([
        format!("ytsearch{}:{} --get-id", videos_amount, search_term),
        "--get-id".to_string(),
    ]);
    {
        println!("[LOG] Searching for videos: \"{}\"", search_term);
    }

    let result = execute_streaming("yt-dlp", args, |line| {
        {
            println!("[LOG] got video: {}", line);
        }
        let payload = FoundVideo {
            id: line,
            for_query: search_term.to_string(),
        };
        app.emit_all("got_video", payload).unwrap();
    });

    if result.is_err() {
        {
            println!("[LOG] search command failed");
        }
        app.emit_all("search_failed", ()).unwrap();
    }
}

fn execute_streaming<F>(cmd: &str, args: Vec<String>, for_line: F) -> Result<(), ()>
where
    F: Fn(String),
{
    let command = Command::new(cmd).args(args).stdout(Stdio::piped()).spawn();

    let mut child_process = match command {
        Ok(process) => process,
        Err(err) => {
            println!("{:?}", err);
            return Err(());
        }
    };

    {
        BufReader::new(child_process.stdout.as_mut().unwrap())
            .lines()
            .flatten()
            .for_each(for_line);
    };

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_random_wiki_title,
            search_youtube
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
