# 🌐 域名与品牌 (Domini e Brand) - 出海绑定与企业VI统筹指南

独立站区别于平台电商的最核心标志，在于企业拥配自主的顶级出海域名（如 `.eu`, `.it`, `.com`）并沉淀长期品牌视觉资产 (Brand Assets)。

---

## 1. 域名挂接与指向解析 (Puntando i DNS)
在 AI Commerce OS 全局域名面板中，连接已有域名的两种最核心方法：
- **连接已有域名 (Connect existing domain)**:
  - 登录您在 GoDaddy, Namecheap 或阿里云的账户，添加下述解析记录：
    - **A 记录 (A Record)**: 指向 AI Commerce OS 欧洲区域主路由 IP（查看域名设置页底部的实时提示 IP）。
    - **CNAME 记录**: 指向 `multitenant-shop.aurora-retail.eu`。
- **主域名设置 (Primary Domain)**:
  - 可以选择将 `www.xxx.eu` 或顶级空域名设为主域名，其他历史别名别称（如 `luxe-fashion.it`）设为 Alias 别名，且会自动建立 301 永久重定向，保证 SEO 权重的单向积聚。
- **自动 SSL 证书颁发**:
  - DNS A 记录检查就绪并同步后，系统网关将在 45 分钟内通过 Let's Encrypt 自动下发安全锁 Free SSL 证书，并自动将 HTTP 强制升级为极速更安全的 HTTPS 协议。

## 2. 品牌视觉统筹 (Componenti di Brand)
为保证前台在线商店、消费者收到的付款邮件、多渠道社交分流卡片展现统一、高级的品牌色彩心智，主账户可以通过品牌模块上传下角 VI 规定：
- **品牌 Logo**: 支持上传透明底 PNG/SVG 标识。
- **主色 (brandColorPrimary)**: 
  - AI Commerce OS 推荐高档名利主色 `#07C2E3`，支持一键选取和更改。
- **辅助色 (brandColorSecondary)**:
  - 用于 Hover 悬停、小角警报及按钮高亮显示。
- **品牌口号与社交分享图 (Social Meta Image)**:
  - 自定义主句（如：_“Premium European Craftsmanship, Delivered Interactively”_），这会完美渲染在前台页底和社交卡片 Meta-Tags 中。

---

&nbsp;
> 🎨 **商品设计师 Sofia 智体提醒**: 
> 一旦在此处修改了品牌主色、网站 Logo、辅助文本，前台商城的主 UI 主题、付款按钮色、发票底板、客服欢迎文案的主色调都会自适应更新，无需修改任何前端 HTML 代码，实现“一色倾城、一呼百应”的完美统括。
