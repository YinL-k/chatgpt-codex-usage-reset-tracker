# SakuraMeter 3.7.0.11 — Agent status below the Side Chat logo

修正 Agent 状态悬浮窗位置：固定在顶部 Side Chat Logo 正下方，覆盖聊天内容，不再放在输入框上方，也不挤占聊天布局空间。

- 保留停止、确认、结果显示与 Activity；支持深浅主题、320px/420px 侧栏及增高输入框。
- 包含 Chat 模式点击、Enter 和 Agent 切回 Chat 后的发送修复。
- 保留 Agent Beta 的 JSON/XML 格式选择、网页操作和动作上限。

验证：JSON/XML 本地浏览器循环、悬浮窗位置和传输回归通过；Chat 发送沿用此前真实登录 Chrome 的点击、回车、切换模式验证。

## English

Agent status now floats directly below the Side Chat logo at the top of the conversation, without consuming layout space. Stop, confirmation, results and Activity remain available. Local browser checks cover 320px/420px widths, a taller composer, and JSON/XML Agent loops and transport.

Includes the Chat sending repair and Agent Beta with JSON/XML format selection and action limits. Signed-in Chrome previously verified click, Enter and sending after switching Agent back to Chat.
