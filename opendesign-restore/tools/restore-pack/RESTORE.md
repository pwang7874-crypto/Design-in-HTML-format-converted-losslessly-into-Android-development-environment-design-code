# Restore brief

Read this measured specification and the original HTML behavior source together. Restore maintainable web source, then convert the existing web source into a native Kotlin/Jetpack Compose Android project while preserving pages, demo data and existing interactions.

## Coverage

- 8 measured states were saved as state-00.png onward. Check the original HTML for pages and behaviors omitted by automatic probing.
- interactions.json can contain visible, hidden, unreachable and unchanged controls. Source-defined behavior remains authoritative when a measurement missed it.

## Rules

- Keep text and demo values from screens.json and the original HTML. Do not rewrite, translate or invent product content.
- Screenshots determine appearance; tokens.json determines visual values. Use reusable components and separate data/copy files.
- Web layout uses recorded flex/grid/gap and alignment. Box coordinates are acceptance checks, not absolute-position layout.
- Preserve source-defined interaction, feedback, delays, loading/error/empty/retry states and navigation. Undeclared behavior stays marked pending in README.
- Browser interface, fake device chrome and extension overlays are not native application UI.

## Web source stage

- Reuse existing usable web source. Otherwise create prototype.html and source/ containing components, separate data, CSS and README.
- The web prototype opens directly, inlines its styles, uses the CSS variables from tokens.json and switches views by state.

## Final stage: native Android conversion

- Convert the existing web source into a Kotlin/Jetpack Compose Android project. Preserve every defined page, demo dataset and existing interaction.
- Deliver a complete Android Studio project with Activity/Manifest, modules, Gradle Wrapper, Compose components, navigation/state, local resources and README.
- Implement native Compose UI; loading HTML in a WebView alone does not complete this stage.
- Map visual tokens into Compose, use flow/list/box layout, and adapt browser pointer behavior to Android touch/focus. Record necessary platform differences.
- README must give the absolute project-root path, File > Open instructions, Gradle Sync/JDK/SDK setup, build/run commands and actual APK location.
- Describe every screen and interaction path, code/data maintenance points, demo behavior, missing real APIs and pending source-undefined states.
- Run an appropriate debug build and available checks. Use a suitable emulator for startup and key paths when available. Do not claim checks that did not run.
- Final deliverables are the Android source project and a successfully built debug APK. Keep web files as intermediate/reference artifacts.
- If the build environment is unavailable, finish the project and instructions and report the actual build limitation. Do not claim an APK exists.
- An explicit request for only measurements, prompts or web output limits the scope; otherwise continue through the Android stage.

## Final verification

Compare all recorded state screenshots and source-defined interactions. Report remaining text, position, color, spacing and interaction differences with evidence, plus actual build/test results and opening paths.

Source file: 她动 HER MOVE · 女性健身.html