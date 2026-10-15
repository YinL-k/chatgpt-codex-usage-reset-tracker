# SakuraMeter 3.7.0.9 — Chat sending fix

修复 Agent 接入后 Chat 模式无法发送消息的问题。Agent 的活动状态、空闲停止通知与 Chat 模式同步不再取消正在进行的网页引用刷新及原生发送；只有 Agent 接管输入框时才取消 Chat 待发送任务。

- Chrome 真实登录环境验证：点击发送、Enter 发送，以及 Agent 切回 Chat 后发送，均收到正常回复。
- Chat 回归测试同时加载 Agent 模块，覆盖网页引用刷新和发送期间的状态更新，并保留 Page/Selection、去重和草稿保护检查。
- 96 项核心测试通过，JSON/XML Agent 循环及传输浏览器回归通过。
- 保留 Agent Beta 的 JSON/XML 格式选择、网页操作和 Activity 功能。

## English

Fix Chat messages failing to send when the Agent module is loaded. Passive Agent activity updates, idle cancellation and Chat-mode synchronization no longer cancel pending page-reference capture or native message delivery. Pending Chat sends are cancelled only when Agent takes ownership of the composer.

Verified in signed-in Chrome: click to send, Enter to send, and sending after switching Agent back to Chat all received normal replies. Chat browser regression now loads the Agent module and covers passive updates during capture/delivery while preserving Page/Selection, deduplication and draft protection. All 96 core tests and JSON/XML Agent loop/transport browser regressions passed.
