## Changelog：What’s New?

### v1.7.13 - (2025-09-17)

🔥 New Features

- Add keyboard shortcuts for Save (Cmd/Ctrl+S) and Send (Cmd/Ctrl+Enter) [#38](https://github.com/EchoAPI-Team/echoapi-for-vscode-support/issues/38) [#35](https://github.com/EchoAPI-Team/echoapi-for-vscode-support/issues/35)

- Run All now supports interruption on error

⚡ Improvements

- Optimized display of response timeline and status codes for better clarity

🐞 Bug Fixes

- Fixed issue where directory search did not show both directories and their API data

- Resolved lag when importing large Postman collections

- Fixed error when importing Postman environment variables

- Resolved issues with pasting/generating cURL in specific cases [#37](https://github.com/EchoAPI-Team/echoapi-for-vscode-support/issues/37)

- The url.host / url.path are modified after export postman collection file → broken request URLs (404 Not Found). [#40](https://github.com/EchoAPI-Team/echoapi-for-vscode-support/issues/40)

- Fixed console output abnormalities

- Corrected the erroneous translation of $ to @ during send

- Other send-related issues have been addressed

<br/>

### v1.7.12 - (2025-07-10)

⚡ Improvements

- Enhanced error display for API responses, improving readability of actual request details.

🐞 Bug Fixes

- Fixed various known issues related to sending functionality.

<br/>

### v1.7.11 - (2025-07-04)

⚡ Improvements

- Enhances the interface response speed.

<br/>

### v1.7.10 - (2025-07-03)

🐞 Bug Fixes

- Fixed the issue where the Import button was missing on the Import cURL page. It's now displayed correctly.

<br/>

### v1.7.9 - (2025-07-02)

🔥 New Features

- Added context menu option to quickly reveal the current file in the file explorer.

⚡ Improvements

- Enhances the interface response speed.
- Improve the pretty formatting of Server-Sent Events (SSE) responses for a cleaner, more user-friendly display.

<br/>

### v1.7.8 - (2025-06-27)

🔥 New Features

- Support for importing and exporting Swagger 2.0 and 3.0 files.
- Support for importing APIs via Swagger URL.
- Support for importing environment configurations.
- Added context menu option to quickly reveal the current file in the file explorer.

⚡ Improvements

- Better global style customization for improved compatibility with VS Code themes, making the user experience smoother.

<br/>

### v1.7.7 - (2025-06-20)

🐞 Bug Fixes

- Fixed an issue where interface variable extraction would fail during "Run All" directory runs.
- Resolved problems caused by faulty scripts in interfaces that prevented proper copying of cURL commands.
- Improved how wait times are handled in Post-response, avoiding errors when the wait time is empty during uploads.
- Enhanced Postman import/export features, fixing issues like missing comments and response data loss during import.

⚡ Improvements

- Better global style customization for improved compatibility with VS Code themes, making the user experience smoother.

<br/>

### v1.7.6 - (2025-06-17)

🐞 Bug Fixes

- Fixed issue where requests would get stuck after updating VSCode.

<br/>

### v1.7.5 - (2025-03-25)

🐞 Bug Fixes

- Fixed an issue with manually added cookies not taking effect: Manually added cookies now work properly and are automatically sent with requests that meet the criteria.

<br/>

### v1.7.4 - (2025-02-26)

🐞 Bug Fixes

- Fixed environment information saving mechanism on Windows. Changed save mode from auto-save to manual save.

<br/>

### v1.7.3 - (2025-02-25)

🐞 Bug Fixes

- Fix real-time saving failures caused by rapid operations, and adjust the save logic to trigger after a 300ms delay upon operation completion.

<br/>

### v1.7.2 - (2025-02-20)

🔥 New Features

- Automatic Curl Command Recognition in Address Bar: You can now directly copy Curl commands into the address bar, and the system will automatically recognize and parse them into API requests, simplifying the workflow.
- Data Management Enhancement: Added a "Saved" status indicator after the open tab names to help you manage your data more conveniently and avoid information loss.

<br/>

### v1.7.1 - (2025-02-14)

🔥 New Features

- Added support for customizing the default port number for document services (Path: More - Extension Settings)

⚡ Improvements

- Introduced customizable time formats for dynamic values.
- Global parameters, global variables, and environment management now feature a real-time saving mechanism, eliminating the need to manually click the ‘Save’ button.
- Improved user interface aesthetics for a better user experience.

🐞 Bug Fixes

- Resolved the issue of duplicate script information prompts in pre- and post-scripts.
- Fixed the display issue where directory parameters were not shown in public parameters.
- Cookie Domain Variable Issue: Fixed a problem where cookies did not take effect when the domain in the cookie used a variable, causing issues during request sending.
- Form-data Request Error: Resolved an issue where using pm.setRequestBody("key", "value") in pre-request scripts resulted in an error when the body format was set to form-data.

<br/>

### v1.6.1 - (2025-01-27)

⚡ Improvements

- UI styling improvements for a better user experience.

🐞 Bug Fixes

- Fixed issue where extracting a single cookie in variable extraction didn’t work.

<br/>

### v1.6.0 - (2025-01-21)

🔥 New Features

- Support for GraphQL requests.
- Export data in Onapi and Postman formats.
- Import data in Onapi format.
- Data conflict comparison feature when pushing environments to the cloud.

⚡ Improvements

- Support for importing Thunder Client WebSocket protocols and OAuth 2.0 authentication data.
- UI styling improvements for a better user experience.

🐞 Bug Fixes

- Fixed several known issues.

<br/>

### v1.5.10 - (2025-01-09)

🔥 New Features

- Environment data now syncs with the cloud (push/pull).
- Support for OAuth 2.0 authentication.
- Socket.IO data can now be synced with the cloud (push/pull).

⚡ Improvements

- Enhanced compatibility with built-in theme colors in VS Code.

🐞 Bug Fixes

- Unable to uncheck global default Header.

<br/>

### v1.5.9 - (2025-01-03)

⚡ Improvements

- UI design and layout have been refined for a smoother, more intuitive experience.
- Clicking “HTTP1/2 Request” in the Design or Debug tab now opens the API debug window.

🐞 Bug Fixes

- Fixed an issue where “Cancel sending” had no effect in WebSocket and Socket.IO connections.
- Resolved a problem where images wouldn’t load over HTTP.
- Fixed an issue where the “size” field in the WebSocket and Socket.IO response area was missing.

<br/>

### v1.5.8 - (2024-12-31)

🔥 New Features

- Support for Socket.IO protocol debugging.

<br/>

### v1.5.7 - (2024-12-27)

🔥 New Features

- Support for debugging WebSocket interfaces.

🐞 Bug Fixes

- Fixed an issue where the methods did not refresh after saving the API design document.
- Resolved a problem with missing object fields in the form-data when generating data from the API design document to the debugging area.
- Fixed a bug where the Service URL configured in the directory settings was not displayed for the APIs under that directory.

<br/>

### v1.5.6 - (2024-12-20)

⚡ Improvements

- Enhanced the UI style and layout for a more streamlined user experience.

<br/>

### v1.5.5 - (2024-12-20)

🔥 New Features

- Bulk parameter import and export now supported using With Description, Key-Value, or Raw-Json methods.
- Pull from Debug: You can now pull debug data directly into the design document interface.
- Added the ability to add directory descriptions through the directory's 'Settings' menu.

⚡ Improvements

- Performance Enhancements: Optimized the plugin for faster and smoother performance.
- Refined UI design and layout for a more streamlined and intuitive user experience.
- Renamed the default environment to Default Environment and the default service to Default Services.

🐞 Bug Fixes

- Fixed an issue where some data wasn’t updating in real-time on certain interfaces.

<br/>

### v1.5.4 - (2024-12-13)

🔥 New Features

- **Directory Parameter Configuration**: Right-click on the interface directory and select "Edit" to access the directory parameter configuration interface. By default, interfaces will inherit parameter configurations from the directory.

⚡ Improvements

- Enhanced the UI style and layout for a more streamlined user experience.

🐞 Bug Fixes

- Resolved an issue where the "Cloud parameter error" message appeared when pushing local data to the cloud.
- Fixed a problem where debugging data generated from the design document was not applied in real-time.

<br/>

### v1.5.3 - (2024-12-11)

🐞 Bug Fixes

- Fixed the issue with the directory tree scrolling.

<br/>

### v1.5.2 - (2024-12-10)

🐞 Bug Fixes

- Fixed several minor issues to enhance system stability and performance.

<br/>

### v1.5.1 - (2024-12-05)

#### 🔥 New Features

- **Dynamic Value Setting**:
  Parameter values can now be automatically generated for request parameters based on preset rules. [Check the user documentation for a quick start guide.](https://www.echoapi.com/wiki/docs/value/dynamicvalue/)
- **Import from Thunder Client**:
  Added the ability to import data from Thunder Client. Please note that some features (e.g., OAuth 2, GraphQL, Pre Run-Pre Requests, and directory settings) are not yet fully supported. These will be progressively rolled out in future updates.
- **Custom Request Method Configuration**:
  Users can now customize the request method (e.g., SEARCH, TRACE) settings to suit their specific needs.

#### ⚡ Optimizations

- **Monaco Editor Font Size Adjustment**:
  Monaco editor now supports automatic font size adjustments based on the built-in font settings of VS Code.
- **UI Enhancements**:  
  Several additional tweaks have been made to further improve the overall user interface.

<br/>

### v1.5.0 - (2024-11-30)

#### 🔥 New Features

- **API Design**:
  We’ve introduced a new API design feature! Now you can design your APIs first, then jump straight into debugging. Create your docs using both FROM and CODE (YAML) formats, and instantly preview and share your designs. Plus, you can manually sync your design and debug data, making the workflow much more efficient.
- **Request Parameter Display Customization**：
  Introduced support for custom Display Column. By default, Parameter Type/Required and Parameter Description are tucked away in "...", presenting a more streamlined and uncluttered interface.

#### ⚡ Optimizations

- **Performance Improvements**:
  We’ve optimized the plugin for better performance, making everything run faster and more smoothly.
- **UI Enhancements**:  
  Several additional tweaks have been made to further improve the overall user interface.

<br/>

### v1.4.3 - (2024-11-15)

#### 🔥 New Features

- **Global Params Quick Access**:  
  Added a quick access button in the top right corner and the request section for easy navigation to the global parameters configuration page.

- **Request Parameter Display Customization**:  
  You can now hide the description fields of request parameters in the request area table, allowing for a more focused view by displaying only the essential fields.

#### ⚡ Optimizations

- **Global Cookie Switch**:  
  The global cookie button is now enabled by default upon plugin installation, simplifying initial setup.

- **Swagger UI Documentation**:  
  Updated and optimized the documentation style for a more user-friendly experience.

- **"Code Snippet" Button Position Adjustment**:  
  The "Code Snippet" button has been repositioned to the request area as an icon, enhancing the speed of code generation.

- **UI Enhancements**:  
  Several additional tweaks have been made to further improve the overall user interface.

<br/>

### v1.4.2 - (2024-11-13)

🔥 New Features

- **Redesigned Logo**: We've updated our logo to give it a fresh look, enhancing the visual appeal and aligning it more closely with our brand identity and core values.

<br/>

### v1.4.1 - (2024-11-08)

⚡ New Features

- Temporarily switch to any service in the current environment for debugging as needed.
- Added the ability to delete records in the Tests log for better management.

🐞 Bug Fixes

- Fixed an issue where global Header parameters were not visible.
- Addressed several known issues to improve overall stability.

<br/>

### v1.4.0 - (2024-10-31)

🔥 New Features

- **API Documentation Generation and Sharing**: Users can now generate API documentation and export it as OpenAPI format, allowing easy access and sharing of API records.
- **Code Generation**: Added support for generating code snippets in multiple programming languages (including but not limited to: Shell, C, Clojure, C#, Go, HTTP, Java, JavaScript, Kotlin, Node.js, Objective-C, OCaml, PHP, PowerShell, Python, R, Ruby, and Swift) based on API information.
- **Copy as cURL**: Added a "Copy as cURL" option in the right-click menu for easy copying of API requests in cURL format.
- **One-Click API Copy**: Introduced a one-click option to copy API details, streamlining user workflows.

⚡ Optimizations

- Enhanced State Saving: Fixed the issue where the expand/collapse state of files wasn't being saved.
- UI Improvements: Optimized the layout and design of the interface for a better user experience.

🐞 Bug Fixes

- Fixed several minor issues to enhance system stability and performance.

<br/>

### v1.3.3 - (2024-10-25)

🐞 Bug Fixes

- Fix the issue of duplicate reports in Run Collections.

<br/>

### v1.3.2 - (2024-10-25)

🐞 Bug Fixes

- Fixed an issue with exceptions occurring during Postman data import.

⚡ Optimizations

- Optimize some UI details.

<br/>

### v1.3.1 - (2024-10-24)

⚡ Optimizations

- Optimize some UI details.

<br/>

### v1.3.0 - (2024-10-23)

🔥 New Features

- Enable automated testing by right-clicking on a folder in the Requests panel or by selecting a folder in the Tests panel.
- Introduced a user feedback survey feature to help us provide better service.

⚡ Optimizations

- Enhanced compatibility with built-in theme colors in VS Code.
- Optimize some UI details.

<br/>

### v1.2.2 - (2024-10-15)

🔥 New Features

- Added: Introduced example interfaces to help users better understand the usage and parameter configuration of the interfaces.

⚡ Optimizations

- Enhanced compatibility with built-in theme colors in VS Code.
- Optimize some UI details.

🐞 Bug Fixes

- Fixed the bug with invalid API Auth types: JWT and ASAP.

<br/>

### v1.2.1 - (2024-10-12)

⚡ Optimizations

- Optimize some UI details.

<br/>

### v1.2.0 - (2024-10-11)

🔥 New Features

- VS Code Remote Development Support: Enhances flexibility for developers working remotely.
- SSE (Server-Sent Events) Support: Enables real-time data pushing from the server to the client, improving responsiveness and data freshness.

⚡ Optimizations

- Improved split-screen functionality for a better multitasking experience.
- Disabled the ability to modify key values in the path to ensure URL uniqueness.

🐞 Bug Fixes

- Fixed an issue where image previews didn't display on the first request.

<br/>

### v1.1.0 - (2024-09-29)

⚡ Optimizations

- Optimize some UI details.

<br/>

### v1.0.9 - (2024-09-27)

⚡ Optimizations

- Improved UI for better user experience.

<br/>

### v1.0.8 - (2024-09-25)

🔥 New Features

- Added support for API authentication operations.

<br/>

### v1.0.7 - (2024-09-24)

⚡ Optimizations

- Improved UI for better user experience.

<br/>

### v1.0.6 - (2024-09-24)

🐞 Bug Fixes

- Fix reference issues in the global variable hierarchy.

<br/>

### v1.0.5 - (2024-09-23)

🔥 New Features

- Supports quick import of Postman data files.

⚡ Optimizations

- Polished up various UI bits and bobs.

<br/>

### v1.0.4 - (2024-09-22)

🔥 New Features

- Supported passing binary files in the request body.

⚡ Optimizations

- Polished up various UI bits and bobs.

<br/>

### v1.0.3 - (2024-09-21)

🔥 New Features

- “Assertions and Validation” results now glow in the response area.

⚡ Optimizations

- Tuned up the field layout in the split-screen view.
- Smoother display after hitting cancel in the response area.
- Sharpened the list focus after spinning up a new API.
- Simplified the click-through for environment icons in the dropdown.
- Polished up various UI bits and bobs.

🐞 Bug Fixes

- Fixed the issue with cURL uploads failing when the data size was too large.
- Tidied up the display issue with the download icon in the response area.
- Squashed the field overlap after rearranging the layout.
- Cut down the lag when flipping through cloud projects.

<br/>

### v1.0.2 - (2024-09-20)

- Fixed code editor theme colors.
- Improved interface interactions

<br/>

### v1.0.1 - (2024-09-19)

- Optimized interface layout.

<br/>

### v1.0.0 - (2024-09-18)

- Initial Release - Official Launch
