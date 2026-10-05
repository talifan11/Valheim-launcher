// Запрет «окон-призраков» в release-сборке под Windows
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    valheim_rouge_lib::run();
}
