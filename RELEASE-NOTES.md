# SakuraMeter 3.7.0.12 — Side Chat reliability and window binding

- 修复带页面上下文发送时，文字与格式化上下文偶尔滞留输入框的问题；等待发送按钮就绪，未确认发送时恢复原始草稿并提示，避免自动重复发送。
- 修复暂停页面上下文无反馈及重连后状态丢失；暂停停止读取网页和选区，新消息不附带这些内容。
- 改善页面引用过期、刷新或发送后消失的恢复能力，保留明确的恢复入口。
- 重新整理中英文设置，说明页面引用、去重和暂停的作用，修正开关及滚动时关闭按钮的显示。
- 开场过渡结束后，粉色边缘光保持静止。
- Side Chat 固定在显式打开它的浏览器窗口；通过另一窗口的扩展按钮或快捷键移动绑定。
- 合并重复文案、消息发送、刷新和停止采集逻辑，清理无效判断与重复动画操作，保持现有业务行为。

验证：102 项 Node 回归测试、四组受控浏览器回归（发送恢复、页面采集与设置、静态光条与布局、Agent 传输）及发布工具检查通过。真实登录会话中的偶发现象和 Windows 原生跨窗口交互仍需实际使用确认。

## English

Improves Side Chat sending reliability, pause persistence, page-reference recovery and single-window ownership. Settings now explain page inclusion, deduplication and pause clearly in English and Chinese. The pink edge glow remains static after the opening transition. Redundant strings and shared control logic were consolidated without changing business rules.

Sending waits for the native button to become ready. If sending cannot be confirmed, the original draft is restored with a prompt to check the conversation before retrying; the extension does not automatically resend.

Validation: 102 Node tests, four controlled browser regression suites and release-tooling checks passed. Intermittent behavior in real signed-in ChatGPT sessions and native Windows multi-window interactions still require field verification.
