use std::process::Command;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

/// 跨平台获取 openclaw 命令的方法
/// 在 Windows 上使用 `cmd /c openclaw` 以兼容全局 npm 路径下的 `.cmd` 脚本
pub fn openclaw_command() -> Command {
    #[cfg(target_os = "windows")]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let mut cmd = Command::new("cmd");
        cmd.arg("/c").arg("openclaw");
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd
    }
    #[cfg(not(target_os = "windows"))]
    {
        Command::new("openclaw")
    }
}
