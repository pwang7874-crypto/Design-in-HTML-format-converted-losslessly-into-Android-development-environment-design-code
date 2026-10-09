---
name: opendesign-restore
description: 从 Open Design 保存的 HTML 提取 restore-pack、清除扩展浮层并还原可维护的网页源码，最后转换为 Kotlin/Jetpack Compose 安卓工程，保留页面、示例数据和已有交互，补齐 Android Studio 打开与构建说明。也用于继续本流程中的现有网页源码转换。用户单独输入关键词 “open design” 时，先询问是否调用此 skill。
---

# Open Design 原型还原与安卓转换

## 关键词触发

当用户消息去除前后空白后正好是 `open design`（大小写不敏感）时，先询问用户是否要调用本 skill，再等待明确回答。询问可直接使用：“检测到关键词 `open design`。要调用 `opendesign-restore` skill 吗？”只有用户明确同意后才开始本 skill 流程；用户拒绝时结束，不执行提取、网页还原或安卓转换。普通句子中包含这两个词时不触发此询问，按句子的实际请求处理。

完整流程是「弹出文件选择 → 提取测量资料 → 询问后还原网页 → 询问后做安卓测试」。每一步都要真的执行，不要只回复步骤。用户明确只要资料包、提示词或网页时，按其指定范围结束。

## 第一步：读完这个 skill 立刻弹文件选择窗口

用户已明确要求调用本 skill，或已同意上面的关键词调用询问后，第一个流程动作就是弹出文件选择窗口，让用户选从 Open Design 另存的 HTML。不要重复询问是否调用、不要先要路径、不要先解释流程。仅输入关键词而未确认时，先执行“关键词触发”中的询问，不弹窗。

只有用户已经在消息里给了 HTML 绝对路径时才跳过弹窗，直接用那个路径。

在 Windows PowerShell 里执行，不带 `-html`：

```powershell
powershell -NoProfile -STA -ExecutionPolicy Bypass -File "<SKILL_DIR>\tools\run.ps1"
```

`<SKILL_DIR>` 是本 `SKILL.md` 所在目录。程序弹出系统文件选择窗口，标题是 “Select the HTML saved from Open Design”。

- 用户选好文件后，程序继续完成提取，不要中断。
- 用户关掉窗口没选文件时，程序输出 `No file selected.` 并退出。这时停下来问用户要 HTML 的绝对路径，不要反复弹窗。
- 没有图形界面、弹不出窗口的环境里，直接向用户要 HTML 的绝对路径，拿到后带 `-html "<绝对路径>"` 重跑上面的命令。
- 第一次报找不到浏览器，先运行 `<SKILL_DIR>\tools\install-browsers.ps1`，看到 `Done` 后再重跑。

HTML 和它同名的 `_files` 文件夹必须留在原目录，不要把 HTML 单独复制出来。

程序会替换掉旧的 `<SKILL_DIR>\tools\restore-pack`，写出 `RESTORE.md`、`tokens.json`、`screens.json`、`interactions.json`、`PROMPT.md` 和 `state-00.png` 起的每张界面截图，并把 `PROMPT.md` 复制到剪贴板。

## 第二步：拿到资料后，先问再还原

提取完成后，先用一两句话告诉用户结果：restore-pack 的位置、到达了几个界面、提示词已复制到剪贴板。然后停下来问用户要不要继续还原。

问的时候说清楚还原会产出的固定交付，两份都交：

- `prototype.html`：浏览器直接打开，交互可用，样式内联，CSS 变量来自 `tokens.json`。
- `source/`：组件、数据文件、独立 CSS 和 README。开发改这一份，不改 `prototype.html`。

用户同意才做还原，用户拒绝或没表态就停在资料包，不要自行开始写代码。

还原时同时读测量资料和原始 HTML。截图决定样子，`screens.json` 决定文案，`tokens.json` 决定视觉值。交互先看 `interactions.json`，漏记、标成隐藏、不可达或没检测到变化时，以原始 HTML 里该控件实际写明的行为为准。两边都没定义的状态保留入口并在 README 标为待确认，不编造。

两份代码共用这些规则：一个界面区域一个组件，重复出现的条目抽成组件用数据渲染，不逐项手写。文案和数值放进数据文件，原文保持原样，不改写、不翻译、不新增。`tokens.json` 的 CSS 变量放进 `:root`，组件只引用变量。布局用记录到的 flex、grid、gap 和 alignment，box 坐标只用来对照截图，禁止 `position:absolute`，禁止按坐标写死宽高。用页面状态切换界面，不做成跳转到 html 文件。浏览器界面、下载箭头、AIX 和其他扩展浮层不属于原型。

`source/README.md` 写清三件事：有哪些界面，每条交互从哪到哪，哪些是示例数据、哪些等真实接口。

完成后逐张对照 state 截图，并用原始 HTML 核对每条交互。回复时只列仍然不一致的地方，说明是文字、位置、颜色、间距还是交互，并给出依据。

## 第三步：还原之后，先问再做安卓测试

网页还原交完后，停下来问用户要不要在安卓开发环境里做还原测试。问清楚两件事：这台电脑有没有安卓开发环境，以及要不要由你来做。

用户确认有环境并且要你做，才进入安卓转换。先读 [安卓转换说明](references/android-conversion.md)，再把网页源码转成 Kotlin/Jetpack Compose 工程，用 Android Studio 打开并跑起来核对。默认交付是完整的 Android Studio 工程和经过成功构建的调试 APK，网页文件作为来源保留。

下面任一情况都不做安卓转换，改为给出安卓开发环境的小白指导：

- 用户说没有安卓开发环境。
- 用户说先不用你做、自己来，或暂时不做。
- 用户没有正面回答。

小白指导写在回复里，不另建文件，按这个顺序讲，每步都写用户能直接照做的操作：

1. 安装 Android Studio。给官网下载页，说明一路 Next 用默认选项即可，勾选 Android SDK、Android SDK Platform、Android Virtual Device。
2. 安装 JDK。说明 Android Studio 自带 JDK，不需要单独安装。
3. 准备模拟器。打开 Device Manager，Create Device，选一个主流手机，系统镜像选最新的稳定版，下载完成后点运行，看到手机画面算成功。
4. 打开工程。File → Open，选工程根目录，不是 `app/` 也不是某个 Kotlin 文件，等 Gradle Sync 完成。
5. 运行。顶部选中刚建的模拟器，点 Run，应用装到模拟器里打开。
6. 对照检查。按还原出的界面清单逐个点一遍，看文字、位置、颜色和交互是否和截图一致，不一致的记下来。

指导末尾注明：等环境装好，再说一声就能继续帮你做安卓转换。

## 不能变的规则

`restore-pack` 是测量规格，原始 HTML 是行为来源，两份都要读。自动提取没覆盖到的界面或交互要补查，不能把漏测当成不存在。`tools/restore-pack` 会被下一次测量替换，最终工程和交付文件不能放在里面。

## 最终回复必须说明 Android Studio 打开位置

完成安卓转换后，结束回复必须给出实际查验过的 Android 工程根目录绝对路径，并明确告诉用户：在 Android Studio 里通过 **File → Open** 打开这个工程根目录文件夹。不要让用户只打开 `app/` 文件夹、某个 `build.gradle.kts` 文件或单个 Kotlin 文件。若工程根目录或 APK 路径无法确定，先从交付目录实际查验，不要编造路径。
