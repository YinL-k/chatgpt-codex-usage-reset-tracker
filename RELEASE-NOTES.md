# SakuraMeter 3.7.0.10 — Floating Agent status and Chat sending fix

Agent 状态栏改为悬浮在聊天内容底部、输入框上方，不再占用顶部布局空间。输入框增高或侧栏缩窄时自动调整位置，保留停止、确认与结果显示。

- 保留 Agent Beta：使用已登录 ChatGPT 操作当前已授权网页，支持 JSON/XML 格式选择、Activity 和动作上限。
- 包含 3.7.0.9 的 Chat 发送修复：活动更新、空闲停止通知和 Chat 模式同步不会取消正在进行的网页引用刷新及原生发送。
- 真实登录 Chrome 已验证点击发送、Enter 发送及 Agent 切回 Chat 后发送；JSON/XML 循环、传输和 Chat 引用回归通过。
- 悬浮位置在 420px 与 320px 侧栏、普通及增高输入框下通过本地浏览器检查。

此版本替代已移除的 GitHub 3.7.0.8 / 3.7.0.9 Release。商店审核状态与 GitHub 发布状态分别确认。

## English

Agent status now floats above the composer at the bottom of the conversation instead of consuming space at the top. It follows composer height and sidebar width, retaining stop, confirmation and result controls.

Includes the Chat sending fix from 3.7.0.9 and Agent Beta with JSON/XML, Activity and action limits. Signed-in Chrome verified click, Enter and Agent-to-Chat sending. Local JSON/XML loop, transport and Chat reference regressions pass, including floating geometry at 420px/320px widths and a taller composer.

This release replaces the removed GitHub 3.7.0.8 and 3.7.0.9 releases. Store review and GitHub publication are separate states.
