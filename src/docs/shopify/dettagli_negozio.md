# 🏪 商店详情 (Dettagli del negozio) - 官方操作与配置指南

本模块用于管理商店的基本信息、行政联系人、地理位置、基本货币规则、税务所在地以及所属的商业行业。这是多租户隔离层的主要行政入口，它决定了后续的货币计算与税务结算区。

---

## 1. 核心属性配置规则
在 **AI Commerce OS** 的多租户 SaaS 架构下，每个商户必须正确声明下述物理属性：
- **商店名称 (Store Name)**: 用于向消费者显示的品牌化法人字号。可通过常规设置一键自定义。
- **联系邮箱 (Contact Email)**: 用于接收订单通知、异常退款账单、Stripe/Adyen 划款凭证。
- **联系电话 (Contact Phone)**: 用于承运商物理揽件及紧急行政沟通。

## 2. 行政物理地址 (Indirizzo del negozio)
物理地址不仅用于账单头信息，更决定了您的**默认出税所在地**。
- **欧洲保税仓预设**: 
  - 巴黎二号旗舰仓 (Rue de la Paix, Paris, France)
  - 米兰奢侈品集散部 (Via Monte Napoleone, Milano, Italy)
  - 柏林大区保税一仓 (Friedrichstraße, Berlin, Germany)
  - 鹿特丹自由港保税二仓 (Coolsingel, Rotterdam, Netherlands)
- **税率影响因素**: 不同的物理库房地址在欧盟增值税改革 (MOSS) 法案下，对于跨国销售的 VAT 豁免及退税有决定性影响。

## 3. 本位货币与时区 (Valuta e Fuso Orario)
- **结算货币 (Currency)**:
  - 默认使用欧元 (`EUR`) 作为独立站及 Adyen 物理结算币种。
  - 支持 `GBP`、`USD` 和跨境 `CNY` 双向结算。
- **物理时区 (Timezone)**:
  - 默认为巴黎/罗马时区 (`Europe/Paris`, UTC+1)。它决定了财务账单对账单的切分界限，以及 AI 智体夜间巡检 WMS 物理库存的定时周期。

---

> 💡 **AI 智体审核贴士**: 
> 我们的精算师智体 Sophia 会每日自动校验商店的增值税号 (VAT Number) 实效性（通过欧洲 VIES 系统接口）。若发现失效，将自动发送 Slack 警报阻止高金额免税发货，在“常规模板中”可一键重置此校验。
