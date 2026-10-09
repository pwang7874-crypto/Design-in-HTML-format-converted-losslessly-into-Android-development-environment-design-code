# Open Design 还原与 Android 转换 Skill

本仓库提供 `opendesign-restore` 技能：把从 Open Design 保存的 HTML 原型提取成可维护的网页源码，再转换成 Kotlin/Jetpack Compose Android Studio 工程。

## 它能做什么

- 从 Open Design HTML 提取页面截图、视觉 tokens、页面状态和交互记录。
- 清理浏览器或扩展浮层，保留原型页面、中文文案、示例数据和交互。
- 生成可直接打开的 `prototype.html`，以及便于继续开发的 `source/` 源码目录。
- 将网页界面转换成原生 Kotlin/Jetpack Compose 页面。
- 输出 Android Studio 工程、构建说明和调试 APK（环境可用时）。

## 目录

- [`opendesign-restore/SKILL.md`](opendesign-restore/SKILL.md)：技能主说明。
- `opendesign-restore/references/android-conversion.md`：Android 转换和验证要求。
- `opendesign-restore/tools/`：HTML 测量、浏览器运行和 restore-pack 工具。

## 使用方式

在 Codex 中安装或引用此技能后，可以说“调用 opendesign-restore”，或单独输入 `open design` 触发调用确认。准备一个从 Open Design 另存的 HTML 文件，并让同名的 `_files` 资源文件夹留在旁边。

技能会先生成 `restore-pack`。继续还原网页后，若确认进行 Android 转换，会生成完整的 Android Studio 工程。

在 Android Studio 中打开时，请使用 **File → Open** 选择生成的 Android 工程根目录，例如 `HER_MOVE_Android` 文件夹；不要只打开 `app/` 文件夹、Gradle 文件或单个 Kotlin 文件。

## 运行前提

- Windows PowerShell（技能提供 `.ps1` 和 `.bat` 脚本）。
- Node.js 和技能内置的 Playwright 依赖。
- Android 转换需要 Android Studio、Android SDK、JDK 和可用的 Gradle 环境。

网页和 Android 端默认使用原型中的示例数据。真实接口、账号、服务端同步和原型未定义的功能需要后续接入。
