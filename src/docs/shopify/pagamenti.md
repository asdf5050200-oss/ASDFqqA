# 💳 支付方式 (Pagamenti) - 全渠道收单与财务配置指南

由于欧洲市场复杂的清算通道环境，**AI Commerce OS** 原生支持基于 Adyen 与 Stripe 的全能支付底模，并在商家端设置页中提供一站式状态调节。

---

## 1. Shopify Payments & 信用卡通道
Shopify Payments 是集成度最高、费率最优的收单方案（在欧洲默认集成 Adyen / Stripe 作为其底层代收款服务）。
- **PCI-DSS 安全合规**: 消费者信用卡号不经过多租户服务器，而是直接通过 token 化交互传至 Adyen 安全终端。
- **划款周期 (Payout Split)**: 默认结算款为买家付款后 T+2 个银行工作日自动发起清分，汇入商店绑定的欧洲 IBAN 银行账户。

## 2. PayPal 独立站配置
PayPal 是欧洲消费者（尤其是德法市场）的首选电子钱包，高密地集成对于提振 15% 结账转化率至关重要。
- **接入流程**: 
  1. 在支付方式中点击开启 PayPal。
  2. 使用您的 PayPal Business 邮箱进行授权。
  3. 通过 IPN Webhook 自动对账，同步订单的“已付款 (Paid)”状态。

## 3. 第三方辅助网关
支持挂接 Stripe, Square, Adyen 等主流国际清算商：
- **Stripe API**: 针对特定出海站（例如北美市场）支持通过 Publishable Key 与 Secret Key 进行极速授权。
- **Adyen**: 欧洲奢侈品实体零售 POS + 独立站一站式网关。

## 4. 手动常规支付 (Pagamenti Manuali)
为了支持极少数大宗 B2B 采购或特定国家习惯：
- **银行转账 (Bank Wire Transfer)**: 买家结账可先下单但不扣款，获得商店提供的 IBAN 号。在收到物理汇款单据且人工/AI 核对通过后，再标记该单据为 Paid，进而推进 WMS 实盘派单。
- **货到付款 (COD - Cash on Delivery)**: 仅在南欧/中欧特定邮编配送范围支持。

## 5. 沙箱测试模式 (Modalità di Test)
- **模拟运行**: 开发或配置初期，可开启沙箱测试机制。使用 Stripe 或 PayPal 开发版模拟卡号（如 `4242 4242 4242`）完成一次全功能结账。在不产生真实汇率划欠及税赋义务的前提下，连通 WMS 订单流水、自动通知与库存扣减的联动测试。

---

> ⚠️ **风控守则 (Stuart 智体)**: 
> 任何通过 Shopify Payments / Adyen 的扣款，都会触发 Stuart 风控智体的实时评分。若订单的欺诈阻滞指数（Fraud Score）超出于 75% 安全线，AI 智体将在待审查列表中生成“挂起指令”，店长可通过在订单中心手动点击“立即拦截 / 放行”进行控制。
