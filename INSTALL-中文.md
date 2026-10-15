# SakuraMeter 安装与升级（v3.6.0.66）

[返回 README](README.md) · [English README](README_en.md) · [最新 GitHub Release](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/releases/latest)

## 推荐安装：Chrome Web Store

访问 [SakuraMeter Chrome Web Store](https://chromewebstore.google.com/detail/hnajkeiigdkgafcobbkchpcdafddfpki)，按商店提示安装。

> 商店发布需要审核，因此商店中可安装的版本可能暂时低于 GitHub 最新 Release。请查看商店页面的版本号。

## 手动安装最新版

1. 从 [GitHub Releases](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/releases/latest) 下载 `SakuraMeter-<version>.zip`。
2. 解压并确认根目录包含 `manifest.json`；不要把 ZIP 文件直接拖入扩展管理器。
3. Chrome：打开 `chrome://extensions`；Edge：打开 `edge://extensions`（Edge 兼容性需要按实际版本确认）。
4. 开启“开发者模式”，点击“加载已解压的扩展程序”（Load unpacked）。
5. 选择包含 `manifest.json` 的文件夹。
6. 打开并登录 [ChatGPT](https://chatgpt.com/)；刷新已经打开的 ChatGPT 标签页，使扩展脚本生效。

Chrome 声明的最低版本为 **116**。扩展显示的 Codex 用量取决于你的 ChatGPT 登录状态、账户类型和服务端返回的数据；无法读取时应显示不可用，而不是零额度。

## 三个常用入口

- **Popup**：点击浏览器扩展图标，查看 ChatGPT 使用趋势、可用额度和摘要。
- **Dashboard → Usage**：查看个人 Codex 用量百分比和服务端提供的额度窗口重置时间。
- **Dashboard → Overview**：查看第三方的全球 Codex Reset 最近确认时间与未来 **24/48 小时**概率；另有 LunarWerx 的 **6/24 小时**预测。
- **Dashboard → Usage → Advanced**：开启/关闭 Reset 预测提醒，切换 **Standard / Low sensitivity**。
- **Side Chat**：使用扩展入口或 `Alt + Shift + C` 打开侧栏；仅在你授权网站后读取页面引用。划词后可预览引用，或点击“发送选区”主动提交。

**请勿混淆：** 个人额度的重置时间来自你的账户；全球 Reset 预测来自第三方 [codex-reset.com](https://codex-reset.com/) 和 [LunarWerx](https://codex.lunarwerx.com/)。预测不是 OpenAI 官方保证，也不会让 SakuraMeter 主动重置任何额度。通知提示的是概率信号，而不是确认事件发生的保证。

## 已安装用户升级，如何保留数据？

如果你使用“加载已解压的扩展程序”安装：

1. 先导出活动数据，并备份原来的扩展目录。
2. 将新版本文件覆盖到**同一个已加载目录**。
3. 回到扩展管理页，对原扩展点击“重新加载”。
4. 刷新 ChatGPT 标签页。

**不要先卸载旧扩展。** 使用不同路径重新加载可能生成新的扩展 ID，本地历史、人工计划和校准信息不会自动迁移。活动 JSON 导出主要用于日期统计，**不包含**人工计划与校准数据。

如果通过 Chrome Web Store 安装，优先使用商店的正常更新流程，不需要开发者模式。不要在未确认扩展 ID 和数据存储的情况下混用商店版与手动版。

## 权限与隐私提示

- `alarms` 和 `notifications`：后台检查全球 Reset 预测并在达到设定条件时提醒。
- 已登录 ChatGPT 会话：普通用量刷新使用只读查询，不触发模型生成，也不需要额外 API Key。
- 第三方预测：使用不携带 ChatGPT 认证信息的 GET 请求；服务方仍可能收到 IP 等网络连接元数据。
- Side Chat：只有启用侧栏并授权网站时才读取可见页面文字。你明确点击发送后，附带引用的文字会作为普通 ChatGPT 消息提交。

如果收到的预测信息过期或不可用，请检查网络连通性并稍后重试；它**不等于**预测为零或已确认发生 Reset。

详见 [README](README.md)、[隐私说明](PRIVACY.md) 和 [问题反馈](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/issues)。v3.6.0.66 的 Side Chat 更新尚未完成真实登录浏览器的端到端验收，请以实际使用反馈为准。
