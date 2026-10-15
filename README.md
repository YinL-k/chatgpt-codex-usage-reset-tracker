**中文** | [English](README_en.md)

<p align="center"><img src="assets/sakurameter-128.png" width="88" alt="SakuraMeter icon" /></p>

# SakuraMeter — ChatGPT Usage Tracker & Codex Reset Monitor

**ChatGPT 使用热力图 · Codex 额度与重置时间 · 全球 Reset 预测与提醒 · Side Chat**

*Track ChatGPT activity, Codex usage limits, reset times, and experimental global reset forecasts.*

[![Latest release](https://img.shields.io/github/v/release/YinL-k/chatgpt-codex-usage-reset-tracker?label=Latest%20Release)](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/releases/latest)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/hnajkeiigdkgafcobbkchpcdafddfpki)
[![Chrome 116+](https://img.shields.io/badge/Chrome-116%2B-666)](manifest.json)

**[从 Chrome Web Store 安装](https://chromewebstore.google.com/detail/hnajkeiigdkgafcobbkchpcdafddfpki)** · **[下载最新版本](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/releases/latest)** · **[报告问题 / 建议功能](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/issues)**

> **不必频繁打开用量页面。** SakuraMeter 在浏览器中汇总 ChatGPT 活动、Codex 额度窗口与重置时间，并展示实验性的全球 Codex Reset 预测。使用已有的 ChatGPT 登录会话，无需另填 API Key。
>
> **注意：** 全球 Reset 预测来自第三方公共数据，**不是** OpenAI 官方重置时间、不是你的个人额度倒计时，扩展也**不能触发 Reset**。

## 它能帮你做什么？

| 你关心的问题 | SakuraMeter 提供什么 |
| --- | --- |
| **Codex 还剩多少？什么时候恢复？** | 在 Usage 中查看账户可用的 Codex 用量百分比、额度窗口和服务端返回的个人重置时间。数据缺失时显示不可用，不编造额度。 |
| **最近会不会有全球 Codex Reset？** | 在 Overview 查看 [Codex Reset](https://codex-reset.com/) 的最近确认记录及未来 **24/48 小时**实验性概率；另提供 [LunarWerx](https://codex.lunarwerx.com/) 的 **6/24 小时**预测和阈值提醒。 |
| **我在 ChatGPT 上用了多少？** | 本地记录已确认的消息发送，查看每日趋势、全年热力图、周/月统计、活跃时段，支持活动数据导入/导出。 |
| **浏览网页时能直接问 ChatGPT 吗？** | 可选 **Side Chat** 侧边栏：引用当前网页、划词聚焦、预览/移除引用，或在输入框为空时主动点击按钮发送选区。 |
| **Pro 额度显示不完整怎么办？** | 对可获取的服务端额度与周期信息直接展示；不足时保留本地观测，支持在 Advanced 中人工校准，估算会明确标注。 |

适合需要规划 Codex 工作时间的开发者、想回顾 ChatGPT 使用习惯的高频用户，以及希望边阅读边提问的学生和研究者。

## Codex Reset：先区分两件事

| | 个人额度窗口重置 | 全球 Reset 预测与通知 |
| --- | --- | --- |
| **是什么** | 你的 ChatGPT/Codex 账户在对应用量窗口内的额度恢复时间 | 对公开报道的、不定期全球性额度重置事件作出的第三方预测 |
| **数据依据** | 已登录 ChatGPT 会话返回的用量字段 | codex-reset.com 的 **24/48h** 展望；LunarWerx 的 **6/24h** 预测与确认事件数据 |
| **可信边界** | 仅在服务端返回时显示；接口可能变化 | 概率、历史与信号均不构成官方承诺；并不预测某个账户一定何时恢复 |
| **在哪里看** | Dashboard → **Usage** | Dashboard → **Overview**；预测提醒设置在 **Usage → Advanced** |

**Reset 通知怎么工作？** 浏览器后台定期读取公开预测；当预测达到所选阈值并持续满足条件时，可显示系统通知。可选择 **Standard / Low sensitivity**，也可以完全关闭。它提醒的是**预测信号**，不是已确认发生的 Reset；不会因每条确认事件就自动推送一次。

数据来源：[Codex Reset](https://codex-reset.com/) · [LunarWerx](https://codex.lunarwerx.com/)（彼此独立，均为第三方；与个人用量数据分开）。

## 快速安装

**推荐：Chrome Web Store。** 点击上方安装链接即可安装；浏览器商店审核可能晚于 GitHub 版本，请以商店展示的版本号为准。

**手动安装最新版（Chrome / 支持兼容扩展 API 的 Chromium 浏览器）：**

1. 从 [GitHub Releases](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/releases/latest) 下载 `SakuraMeter-<version>.zip`，解压。
2. Chrome 打开 `chrome://extensions`；Microsoft Edge 打开 `edge://extensions`，开启**开发者模式**。
3. 选择**加载已解压的扩展程序 / Load unpacked**，指向解压后包含 `manifest.json` 的文件夹。
4. 打开并登录 [ChatGPT](https://chatgpt.com/)，刷新已有的 ChatGPT 标签页，然后点击扩展图标。

**开始使用：** 点击扩展图标看 Popup；进入 Dashboard 的 **Overview / Activity / Usage**；在 **Usage → Advanced** 调整 Reset 通知。要用 Side Chat，可按 `Alt + Shift + C` 或从扩展入口打开，并按需授权当前网站的页面引用。

**已有手动安装的用户：** 先备份原扩展目录并导出活动数据，随后在原加载路径替换文件、点击“重新加载”。**不要先卸载**；改用另一加载路径可能生成新扩展 ID，导致原本的本地记录和设置无法自动继承。活动 JSON 导出不包含人工计划或校准值。更多说明见 [中文安装指南](INSTALL-中文.md)。

## 界面预览

<div align="center">
<img src="https://raw.githubusercontent.com/YinL-k/chatgpt-codex-usage-reset-tracker/main/store-assets/en/preview/large-promotional.jpg?v=3a031125" alt="SakuraMeter product preview" width="820" />
</div>

<details>
<summary><strong>展开查看 6 张界面截图（深色 / 浅色）</strong></summary>

| Popup | Popup |
| :---: | :---: |
| <img src="store-assets/en/preview/01-popup-dark.jpg" alt="Popup dark theme" width="390" /> | <img src="store-assets/en/preview/02-popup-light.jpg" alt="Popup light theme" width="390" /> |
| Overview | Overview |
| <img src="store-assets/en/preview/03-overview-dark.jpg" alt="Overview dark theme" width="390" /> | <img src="store-assets/en/preview/04-overview-light.jpg" alt="Overview light theme" width="390" /> |
| Activity | Activity |
| <img src="store-assets/en/preview/05-activity-dark.jpg" alt="Activity dark theme" width="390" /> | <img src="store-assets/en/preview/06-activity-light.jpg" alt="Activity light theme" width="390" /> |

</details>

截图可能滞后于最新版本，功能以对应 Release 和扩展实际页面为准。

## 隐私与使用边界

- **本地优先：** 使用活动与趋势保存在浏览器本地；消息内容不会写入用量历史或活动导出。发送确认会在内存中短暂比较消息文本。
- **只读用量查询：** 借助已有的 ChatGPT 登录会话读取可用的额度信息；不需要 API Key，也不会为了刷新额度调用模型或发送新消息。
- **第三方公开预测：** 会向预测服务发送不携带 ChatGPT 认证信息的 GET 请求；服务提供方仍可能看到 IP 等普通连接元数据。
- **可选网页引用：** 只有启用 Side Chat 并授权网站时才读取可见正文或主动高亮的文本。你主动发送引用后，它会成为正常的 ChatGPT 消息，受你的 ChatGPT 服务与账户设置约束。
- **透明权限：** `alarms` 和 `notifications` 用于 Reset 预测检查及提醒；`sidePanel`、`scripting` 和相关主机权限支持 Side Chat。其他网站访问权限为可选。

没有开发者自建的聊天中转服务器或遥测服务。完整权限范围及潜在风险请阅读 [隐私说明](PRIVACY.md)。

## 常见问题

**Reset 预测和个人 Codex 重置时间为什么不一样？** 一个是第三方对全球不定期事件的展望，一个是你的账户在当前额度窗口中的服务端时间，两者不能互相替代。

**为什么有些百分比显示“—”或“Unavailable”？** 你可能尚未登录 ChatGPT、暂时无法读取数据，或当前账户/服务端没有提供对应字段。SakuraMeter 不会将未知数值猜成准确额度。

**装上扩展会自动替我问 ChatGPT 吗？** 不会。普通用量统计不发起模型请求；Side Chat 只有在你明确发送消息或点击“发送选区”时才提交内容。

**这个项目是 OpenAI 官方的吗？** 不是。SakuraMeter 是独立的社区项目，不隶属于 OpenAI，也未获官方背书。

## 反馈、贡献与兼容性

遇到问题或想提新功能？请在 [GitHub Issues](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/issues) 反馈，附上**浏览器版本、扩展版本、复现步骤、预期/实际结果**。请勿上传 Cookie、令牌、私人聊天或含敏感信息的截图。

- **兼容性：** 以 Chrome 116+ 为扩展声明的最低版本；其他 Chromium 浏览器需要自行验证，网页结构或私有用量接口变化也可能影响可用性。
- **验证说明：** 历史版本的自动化报告见 [TESTING.md](TESTING.md)。v3.6.0.66 的 Side Chat 改动已完成代码审查和静态语法检查，但真实登录浏览器的端到端验收仍待完成，不能将其表述为完整验证通过。
- **版本记录：** [Releases](https://github.com/YinL-k/chatgpt-codex-usage-reset-tracker/releases) · [Release notes](RELEASE.md) · [品牌资源](BRANDING.md)

**SakuraMeter 希望让 ChatGPT 与 Codex 的用量信息更清楚、更好找。** 欢迎反馈真实使用中不方便的地方；让工具对下一位用户更有用。
