use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ServiceStatus {
    pub label: String,
    pub pid: Option<u32>,
    pub running: bool,
    pub description: String,
    /// CLI 工具是否已安装（Windows/Linux: openclaw CLI）
    pub cli_installed: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VersionInfo {
    pub current: Option<String>,
    pub latest: Option<String>,
    pub update_available: bool,
    pub source: String,
}
