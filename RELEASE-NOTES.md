# SakuraMeter 3.7.0.8 — Agent Beta

新增 Agent Beta：在 Side Chat 输入框加号旁切换 Chat / Agent，使用已登录的 ChatGPT 网页会话操作当前已授权网页，无需另配模型 API Key。

- JSON / XML 回复格式可选；支持读取、点击、填写、选择和滚动，执行后返回观察，直到结束或需要用户回复。
- 统一模式下拉菜单、居中的 SVG 箭头，以及紧邻 Agent 的 Activity；支持停止、动作上限和识别到的重要操作确认。
- 修复 Agent 消息只填充不发送、首次创建会话被误判切换、新版 ChatGPT 回复返回后不执行的问题。
- 允许独立主标签页中的 ChatGPT 网站及子域名作为操作目标。
- 补充中英文功能描述和 Agent 数据使用说明。

验证：登录 Chrome 中完成 JSON 两次滚动、观察和结束的真实循环；JSON/XML 本地浏览器回归通过。Agent 为 Beta，暂不支持 iframe、文件上传或需要跨域、新标签页、下载的链接；自动消息消耗 ChatGPT 账户额度。

## English

Agent Beta uses your signed-in ChatGPT web session to operate the authorized active webpage without a separate model API key. Switch modes beside the plus button, choose JSON/XML, follow Activity, stop tasks and confirm recognized consequential actions.

This release fixes composer sending, initial conversation routing and reply detection on the updated ChatGPT interface. Independent main-tab ChatGPT pages and subdomains are now allowed. A signed-in Chrome JSON loop completed scroll down, observe, scroll up and finish; local JSON/XML browser regressions also pass. Frames, uploads and links requiring cross-origin navigation, a new tab or a download remain unsupported. Automated messages use your ChatGPT allowance.
