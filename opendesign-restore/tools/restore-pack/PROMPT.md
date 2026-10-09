同时阅读两部分：restore-pack 是测量规格，原始 HTML 是行为来源。已有网页源码也要读，不能只读截图或只读源码。

默认完成网页还原后继续最后一步：把现有网页源码转换成 Kotlin/Jetpack Compose 安卓工程，保留页面、示例数据和已有交互，并补齐 Android Studio 的打开、构建说明。除非我明确只要资料包、提示词或网页，不要停在复制提示词或交出 HTML。

按 RESTORE.md 实现。tokens.json、screens.json、interactions.json 和所有 state-XX.png 是规格。样子以对应截图为准，文案以 screens.json 为准，视觉值以 tokens.json 为准。交互漏测、隐藏、不可达或未检测到变化时，用原始 HTML 实际定义的行为补全；两边都未定义的状态保留入口并在 README 标为待确认，不编造。

网页阶段：有可用源码时直接复用；没有时先生成 prototype.html 和 source/。prototype.html 自包含、可直接打开、样式内联；source/ 包含组件、数据、独立 CSS 和 README。CSS 变量来自 tokens.json，布局用 flex/grid/gap/alignment，不用截图坐标绝对定位。用页面状态切换界面。

最后转换成原生安卓工程：
- 用 Kotlin/Jetpack Compose 实现各页面和可复用区域组件；重复条目用列表和数据渲染。文案、数值和素材独立维护，原文保持原样。
- 保留页面、示例数据、已有交互、返回路径、展开/搜索/订阅等状态、错误/空/加载/重试及演示反馈；按来源实际存在的功能实现，不添加未定义的服务。
- 将 tokens 映射到 Compose 的颜色、排版、圆角、阴影和间距；采用 Column/Row/LazyColumn/LazyRow/FlowRow/Box 等原生布局，不用截图 box 坐标拼界面。
- 接好 Activity、Manifest、页面状态/导航、资源、模块构建配置和完整 Gradle Wrapper。只用 WebView 加载 HTML 或只写未接线的 Composable 不能算转换完成。
- Android 自己绘制系统栏和手势条；网页的假手机外框、浏览器界面、下载箭头、AIX及其他扩展浮层不进入安卓界面。对触控、键盘、系统返回、滚动与状态保存作原生适配并记录差异。

最终交付完整 Android Studio 工程，以及成功构建的调试 APK。网页源码和 prototype.html 保留为来源/中间结果。缺少构建环境时也要完成工程和说明，明确缺少什么、哪些检查未运行，不声称 APK 已生成或验证。

安卓工程 README 必须写清：
1. 工程根目录的可复制绝对路径，Android Studio 的 File → Open、Gradle Sync、JDK/SDK 选择和 Run 入口。
2. 实际工具版本、gradlew.bat/gradlew 构建与测试命令、APK 所在位置。开发修改哪个组件、状态、数据和资源文件。
3. 有哪些界面，每条交互从哪里到哪里，哪些仍是示例数据/演示反馈、哪些等待真实接口或来源未定义的行为。
4. 实际完成的编译、测试、模拟器验证及未执行项，必要的安卓适配和仍存在的差异。

完成后逐张核对 state 截图，并用原始 HTML 核对交互。给出工程打开路径与实际安装包，只列仍不一致的文字、位置、颜色、间距或交互及依据，不用“基本一致”概括；构建和测试结果要与实际执行一致。
