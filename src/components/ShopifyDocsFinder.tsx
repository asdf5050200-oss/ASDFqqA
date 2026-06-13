import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  Cpu, 
  Code, 
  Terminal, 
  ArrowRight, 
  Check, 
  Compass, 
  FileCode,
  Globe,
  RefreshCw,
  Copy,
  HelpCircle,
  Building,
  CreditCard,
  MapPin,
  DollarSign,
  Navigation,
  Bell,
  Users,
  ChevronLeft,
  FileText,
  Layers,
  Info,
  ShoppingCart,
  ShoppingBag,
  Truck,
  Percent,
  Megaphone,
  Eye,
  Settings,
  Brain,
  Shield,
  Languages,
  CheckCircle,
  BadgeAlert,
  ArrowUpRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ShopifyDocsFinderProps {
  addLog: (agent: string, action: string, details: string, type?: 'info' | 'success' | 'warning' | 'error' | 'tool') => void;
}

interface LocalDocListItem {
  id: string;
  filename: string;
  title: string;
  excerpt: string;
}

// Breathtakingly polished, detailed offline Shopify operator manuals
const BUSINESS_DIVISIONS = [
  {
    id: 'orders',
    title: '📦 订单管理 (Ordini)',
    description: '查看订单状态、批量发货、处理客户退款及恢复丢弃结账。',
    bg: 'border-slate-250 hover:border-emerald-500',
    iconColor: 'text-emerald-500',
    icon: ShoppingCart,
    items: [
      {
        id: 'ordini_view',
        name: '查看订单 (Visualizza ordini)',
        desc: '追踪所有未发货、已付款、待支付及退款中的状态细目。',
        prompt: '帮我查询最近10笔已付款但待发货的意大利或欧盟区客户订单，并按金额排序。',
        guide: `### 📖 如何在 Shopify 中高级检索并筛选订单
在您的 Shopify 后台依次点击 **Ordini（订单）** 即可查看网店的所有成交状态。

#### 1. 常用筛选过滤器：
* **Stato evasione（履约状态）**：已发货、待发货、部分发货。
* **Stato pagamento（付款状态）**：已付款（Saldato）、待付款（In attesa）、已退款（Rimborsato）。

#### 2. 处理高风险防欺诈订单：
每笔订单都有内置 AI 欺诈检测机制，在发货前务必确保订单没有任何红色欺诈风险警告，规避信用卡盗刷返还（Chargeback）风险。`
      },
      {
        id: 'ordini_process',
        name: '处理订单与确认发货 (Adempimenti)',
        desc: '标记出货、自动配舱、生成快递追踪链接及出货单打印。',
        prompt: '筛选出所有未发货的高额服装包袋订单，一键安排物流配送并生成本地出货备单。',
        guide: `### 📦 Shopify 订单发货与履约标准规护
对订单安排配送时，必须为顾客标记发货和物流追踪包。

#### 核心步骤：
1. **选择分批发货或整单发货**。
2. **填入外部追踪号 (Tracking Number)** 并选择对应物流商（如 DHL, FedEx, Poste Italiane）。
3. **勾选 “Invia notifica al cliente”**，客户将即刻收到一封高贵的发货确认邮件，包含实时地图追踪。
4. **打印配送标签 (Print Packing Slip)** 贴于包裹外部发货出库。`
      },
      {
        id: 'ordini_refund',
        name: '处理退款与退货 (Refunds & Returns)',
        desc: '为客户执行部分或全额退款操作，退货库存自动记入。',
        prompt: '协助我对订单 ORD-2026-9051 执行部分退款：返还货款35欧元，并将1件退回商品重置入米兰大仓。',
        guide: `### 🔄 处理客户退款与退换货标准业务流
本系统全自动对接欧洲高合规 GDPR 与消费者退返保护法案。

#### 1. 高合规退款操作：
* 进入指定订单，点击 **Rimborsa（退款）** 按钮。
* 设置退回的商品数量。若需要将商品重新归入销售库存，务必勾选 **“Ripristina l'inventario”（库存入库）**。
* 手动输入退款金额，可返还运费。
* 原路退回至消费者最初的信用卡、PayPal，或自动记为店铺积分。`
      },
      {
        id: 'ordini_draft',
        name: '手动创建草稿订单 (Ordini in bozza)',
        desc: '为批发商、电话客户建立定制草稿，配置手工折扣、免税和免运费。',
        prompt: '为罗马高端品牌分销商建立一个草稿订单：添加羊毛大衣50件，设置20%手工优惠并开启净额付款账期。',
        guide: `### 📝 Shopify 草稿订单 (Draft Orders) 运用指南
草稿订单是为商家手动对公交易、批发（B2B）或电话订单提供。

#### 设计场景：
* **输入大客商品和变体**。
* **添加手工折扣或减免税费**（如 B2B 凭 VAT ID 免消费税）。
* **配置付款到期日 (Payment Terms)**，支持 Net 30, Net 60 账期等。
* **发送开票收据链接(Send Invoice)** 让客户在线自助刷卡付款。`
      },
      {
        id: 'ordini_abandoned',
        name: '丢弃结账挽回 (Abandoned Checkout)',
        desc: '智能查验加购但未付账的名单，自动或延时投送召回券。',
        prompt: '自动提取过去48小时内加购未付款的客户名单，生成一封带有 9 折专属催召回连接的关切邮件。',
        guide: `### 🎯 废弃结账恢复：召回流失的 15% 顾客
很多顾客在结账最后一步（选择运费或税率）由于犹豫而流失，这被称为废弃结账（Checkout abbandonato）。

#### 自动恢复法则：
1. 在 **Impostazioni（设置）-> Checkout（结账）** 下，启用 **自动发送废弃结账邮件**。
2. 推荐设置触发延时为 **加购流失 10 小时后**。
3. 自动注入动态个性化优惠券码以最大化提升召回成交率。`
      }
    ]
  },
  {
    id: 'products',
    title: '🛍️ 商品管理 (Prodotti)',
    description: '上传并维护产品、多尺寸规格变体、库存监控及礼品卡发行。',
    bg: 'border-slate-250 hover:border-sky-500',
    iconColor: 'text-sky-500',
    icon: ShoppingBag,
    items: [
      {
        id: 'prodotti_add',
        name: '添加与编辑商品 (Catalogo)',
        desc: '富文本设置标题、高质量品牌图片、进销项单价及出海税率。',
        prompt: '上架一款由法式设计师设计的亚麻保暖羊毛大衣新品，设定原价220欧、促销售价150欧，库存50件。',
        guide: `### 🛍️ 自建并上架一款完美吸引转化的新商品
上架优质商品是电商成功的核心基石。

#### 核心属性规范配置：
* **Titolo（标题）**：包含核心关键词（如“法式复古加厚羊毛大衣”），确保出色的 SEO 自然流量。
* **Descrizione（描述）**：使用主干加细节的多层次结构阐明材质。建议借助本系统内置 AI Magic 工具一件翻译和生成。
* **Pricing（定价）**：售价（Prezzo）、划线对比价（Prezzo di confronto）用于展现直观的降价幅度，成本价（用于利润表评估，客户不可见）。`
      },
      {
        id: 'prodotti_variants',
        name: '多变体多规则生成 (Varianti)',
        desc: '自如配置颜色、尺寸、面料等矩阵变体，并管理SKU条码。',
        prompt: '给主力针织羊毛衫添加三种颜色：优雅黑、珍珠白、经典燕麦，每种颜色配置 M/L/XL 规格尺寸。',
        guide: `### 🎨 商品变体与规格矩阵 (Product Variants) 操作
当商品包含多种尺寸、颜色或多特征分级时，必须使用变体管理。

#### 最佳实践：
1. 每一款商品最多可生成高达 **3个属性维度（如：颜色、尺寸、材质）**。
2. 每个属性下可添加一系列选项（如：Black, White / S, M, L）。
3. 确保每个变体都分配了**独立的 SKU（库存保有单位）**，并录入了精准的单独条形码（EAN码），以便仓库扫码履约不出错。`
      },
      {
        id: 'prodotti_inventory',
        name: '库存水平追踪 (Inventario)',
        desc: '查看各仓货位流变，设立低水位自动告警策略防止超卖。',
        prompt: '查出全店目前可用库存小于5件的所有高危缺货商品，并推荐供应商补货数量。',
        guide: `### 📦 高效防断货库存（Inventario）监控系统
对产品的高效库存管理可以避免大促期间超卖造成的口碑和资金损失。

#### 管理策略：
* **锁定缺货规则**：勾选 “Consenti ai clienti di acquistare quando esaurito”（允许缺货继续下单）仅推荐用于能快速调拨备仓的货源。
* **大促锁定分配**：当商品被放入购物车或正在结账时，系统可自适应减少“可用库存 (Disponibile)”，将其锁定为“预留库存 (Riservato)”，维护现货公平性。`
      },
      {
        id: 'prodotti_collections',
        name: '系列/组群分类 (Collezioni)',
        desc: '根据商品价格、标签或类目全动态自动建立产品前台分类。',
        prompt: '创建一个自动智能分类系列：只要商品标签含有「冬季」且价格大于100欧元，全动态放入「冬季奢华系列」。',
        guide: `### 🏷️ 建立高效易浏览的产品系列 (Collezioni)
在独立站中，顾客是通过商品系列进行快速垂直寻宝的。

#### Shopify 提供两类系列组织法：
1. **Collezione Manuale（手动系列）**：手动挑选特定商品，适合主打的固定套餐。
2. **Collezione Automatica（自动系列）**：高度推荐！根据设定的条件（如: 商品标签、商品标题、Prezzo、库存情况等）由系统实时判定符合标准的商品动态归入。`
      },
      {
        id: 'prodotti_giftcards',
        name: '电子礼品卡 (Carte regalo)',
        desc: '创建并发行不同面值的虚拟礼品卡，可用作客户礼赠与积分兑。',
        prompt: '生成一款圣诞特别款面值50欧元、100欧和200欧的网店电子礼品卡，支持全店结账抵扣。',
        guide: `### 🎁 虚拟电子礼品卡（Carte regalo）的自营和派送
礼品卡是极为卓越的节日送礼和客服平息索赔手段。

#### 运行逻辑：
* 您可以直接添加作为数字产品销售，提供不同金额等级。
* 礼品卡购买后直接向买家邮箱投发包含唯一16位解密兑换券的安全邮件。
* 支持客人在结账付款页面与折扣码同时输入并合并抵扣，余额支持在下次结账时持续消纳。`
      }
    ]
  },
  {
    id: 'sconti',
    title: '🏷️ 折扣促销 (Sconti)',
    description: '设置优惠码、买X送Y、自动折扣以及全欧盟满额免运费。',
    bg: 'border-slate-250 hover:border-violet-500',
    iconColor: 'text-violet-500',
    icon: Percent,
    items: [
      {
        id: 'sconti_codes',
        name: '创建优惠码 (Codici sconto)',
        desc: '配置自定义降价百分比或固定金额抵扣，限制每个人限领一次。',
        prompt: '帮我设计一个高客单专享折扣码「VIPXMAS01」：金额立减50欧元，要求订单满300欧元且每个人限用1次。',
        guide: `### 🏷️ 商家优惠码 (Discount Codes) 核心参数配置
优惠码是需要客户在结账页面手动敲入的特定字母组合指令。

#### 参数设定细则：
1. **折扣类型**：Percentage（百分比折扣，如八折）、Fixed Amount（固定金额，如直接免20欧）。
2. **适用条件**：无限制、最低消费金额（Prezzo minimo）、最低采购件数。
3. **对象范围**：只限特定客户群体（推荐与 Clienti 细分联用，锁定重度复购老客）。
4. **有效期**：必须在促销到期日自动失效，防止长期低价造成毛利受损。`
      },
      {
        id: 'sconti_auto',
        name: '自动折扣 (Sconti automatici)',
        desc: '满足指定条件（如满两件）在前台结账自动生效降价，无需输入。',
        prompt: '上线一个自动折扣促销：全店订单只要金额满100欧元，前台自动立享 9 折减免。',
        guide: `### ⚡ 为什么更推荐【自动折扣 (Sconti automatici)】
自动折扣最核心的优势在于**零摩擦体验**。顾客无需记住或粘贴任何复杂的序列码，在结账页面其购物车内只要符合条件就会实时看到价格跳转。

#### 使用底线：
* Shopify 同一时刻在默认状态下仅允许激活一个「自动折扣」。
* 您可以自主配置自动折扣是否允许与客户自己手动敲入的优惠码或者免运费券进行二次叠加。建议仔细测算毛毛利率。`
      },
      {
        id: 'sconti_bogo',
        name: '买 X 送 Y 捆绑销售 (BOGO)',
        desc: '极佳的清理积压爆品方法：买两件送一件或第二件获得折扣。',
        prompt: '设置一个冬季清仓买X送Y折扣：买2件指定秋季大衣，立享赠送1件保暖手套赠品。',
        guide: `### 🎁 买X送Y (Bogo - Buy X Get Y) 清库存绝活
这是欧美电商界最常用于提升平均篮子件数（AOV / UPT）的手段。

#### 业务配置：
* **消费者购买 (Acquista)**：设置最少要采购的数量（例如：2 个 A 变体）。
* **消费者获得 (Riceve)**：可以设置让客户免费获得，或者是以特定折价获得另一个商品（例如：B 商品打半折）。
* 非常适用于季末清理滞销尺码商品，配合 AI 智脑的低库存提示堪称神器。`
      },
      {
        id: 'sconti_freeship',
        name: '全欧盟免运费 (Premium Spedizione)',
        desc: '通过满额包邮，大幅减少购物车废弃结账概率。',
        prompt: '在折扣栏发起全欧盟区客单价满80欧元自动包邮的免运费营销，排除其他高额偏远地区。',
        guide: `### 🚚 如何设置满额免运费包邮特权
高达 60% 的废弃结账发生在顾客看到运费估值的那一刻。免运费是最强大的转化引擎。

#### 配置要领：
1. 创建一个 **免运费折扣**。
2. 限定仅针对特定目的地区域（可选意大利和欧盟免邮，排除跨洋区域）。
3. 指定最低客单（例如满 99 欧元免运费）。这不仅能提高转化，更能顺理成章将 AOV 推高 15% 以上。`
      }
    ]
  },
  {
    id: 'markets',
    title: '🌍 出海与国际市场 (Markets)',
    description: '多主权市场配置独立币种、本地税率VAT一站式合规。',
    bg: 'border-slate-250 hover:border-blue-500',
    iconColor: 'text-blue-500',
    icon: Globe,
    items: [
      {
        id: 'markets_config',
        name: '多地区销售 (Mercati multipli)',
        desc: '配置欧盟、北美、亚洲等独立分销子市场。',
        prompt: '协助我查看当前多地区市场覆盖，并开启对法国及德语区主力消费市场的可见性。',
        guide: `### 🌍 Shopify Markets 多市场销售底层原理
Shopify Markets 是您跨国做 B2C / B2B 零售的最核心指挥台。

#### 它能帮您做到：
* 将世界划分为不同的子市场（如主权市场意大利，以及欧洲市场，北美市场）。
* 自主控制哪些 SKU 仅在特定国家呈现发售，避开物流限制。
* 独立定制不同市场的本土化门面首发视觉。`
      },
      {
        id: 'markets_translate',
        name: '多语言与多币种 (Lingue e valute)',
        desc: '根据顾客IP自动转化汇率及语言，提供零摩擦支付感受。',
        prompt: '自动启动多语言自动翻译覆盖：将当前的意大利语主店文案由AI转化并导出为英文。',
        guide: `### 🌐 本地化体验：多语言翻译与自动汇率
当海外买家发现独立站不支持他们的本国货币或看不懂描述时，跳出率会飙升。

#### 完美落地法则：
1. **多币种自动兑换**：开启 Shopify Payments 旗下的自动汇率适配。当法国客户访问时看到 EUR，美国客户看到 USD。
2. **翻译软件无缝对接**：安装 Shopify Translate & Adapt 官方翻译管道，将商品名称、核心卖点描述一键 AI 转换。
3. 结账时支持本地人最信任的信用卡、本地特殊支付网关（如德国 Sofort，荷兰 iDEAL）。`
      },
      {
        id: 'markets_taxes',
        name: '税务合规与欧盟 VAT OSS',
        desc: '开启一站式欧盟增值税申报备案结算防范关税纠纷。',
        prompt: '帮我审查网店增值税合规配置，在系统后台开启意大利本地 22% 的 VAT 自动核算。',
        guide: `### 🧾 欧洲及跨国电商税务：VAT 和关税合规
在欧盟做生意，税务合规是第一红线。

#### 核心合规知识产权：
* **含税价显示**：根据欧盟消费者保护法，前台零售价必须是**含增值税的价格**（Iva inclusa）。
* **VAT OSS (一站式申报机制)**：若从意大利发货至其他欧盟国家，总跨境营业额超过1万欧元阈值，可以使用 OSS（一站式）申报机制，统一按买家所在的本土增值税率（如法国 20%, 意大利 22%）扣缴。
* **起算开关**：进入 **Impostazioni -> Imposte e dazi** 下填写您的 VAT 税号，系统将在顾客结账时完全自动精确算出税费，拒绝合规罚单。`
      },
      {
        id: 'markets_domini',
        name: '域名多宿主绑定 (Sub-domains)',
        desc: '为各个国际本土市场配置二级域名和独立解析路径。',
        prompt: '我已购买了 yourstore.com，如何为法国客户单独路由显示为 fr.yourstore.com 子站点？',
        guide: `### 🌐 为多市场配置最佳品牌二级域名
一个具有本地化国家后缀的域名（如 .fr / .de）能极大增强买家信任。

#### 配置方式：
* 在 **Impostazioni -> Domini** 下将您的主域名指向 Shopify 托管。
* 针对不同的 Market（如法区），配置子域名路由：例如将法国站绑定为 \`fr.yourname.com\`。
* 当法国 IP 客人访问时，系统将无摩擦 301 重定向至特定语言二级域名下，极速提高转化。`
      }
    ]
  }
];

// Modern Shopify Settings (Offline MD files mapped here)
const SETTINGS_TOPICS = [
  { id: 'dettagli_negozio', title: '🏪 商店详情 (Info negozio)', desc: '商店基本名称、行业属性、核定结算本位币及真实对公地址。' },
  { id: 'pagamenti', title: '💳 支付网关 (Pagamenti)', desc: '集成 Shopify Payments, Stripe, PayPal 以便打款以及支持全币种支付。' },
  { id: 'spedizione_consegna', title: '🚚 配送与费率 (Spedizioni)', desc: '划定配送区域，意大利和欧盟区运费矩阵，自提或本地配送。' },
  { id: 'imposte_dazi', title: '🧾 增值税合规 (Tasse e dazi)', desc: '欧盟一站式 VAT OSS 税率合规，关税起征点及境外直邮含税申报。' },
  { id: 'sedi_magazzini', title: '📍 地点与多仓 (Sedi magazzino)', desc: '米兰、罗马多地仓库库存分配，设置优先级。' },
  { id: 'notifiche_email', title: '📧 自动邮件模板 (Notifiche)', desc: '订单付款成功、出货物流追踪、退款确认的 HTML 模板。' },
  { id: 'domini_brand', title: '🌐 域名与品牌 (Domini & Brand)', desc: '主域名映射, Logo与色盘，提高页面整体品牌统一性。' },
  { id: 'utenti_autorizzazioni', title: '🔒 用户角色与权限 (Staff)', desc: '邀请运营和仓库员工登录，并限制仅浏览订单。' },
  { id: 'checkout_politiche', title: '🛡️ 结账退款政策 (Checkout)', desc: '自动生成退货政策、GDPR隐私协定、结账字段配置。' },
  { id: 'carte_regalo_metafields', title: '📦 自定义元字段 (Metafield)', desc: '在商品和订单层级扩展私有参数和自定义多轨属性。' }
];

// The 12 AI Features
const AI_TWELVE_FEATURES = [
  { id: 'feature_sidekick', name: '🧠 Sidekick Copilot 经营助手', desc: '支持商家通过自然语言提问经营数据、调配订单库、自动上下架产品并分析营收，即问即执行。', testPrompt: '帮我汇总本月累计销售并查找退单率最高的是哪几款大衣商品？' },
  { id: 'feature_magic', name: '✍️ AI Magic 文字文案生成', desc: '在商品编辑页、博客及邮件页，智能生成契合奢华、专业等语气风格的本土描述。', testPrompt: '以「意式奢华」的语气为一款冬季羊绒大衣生成一个高级感满满的商品介绍。' },
  { id: 'feature_image', name: '🖼️ AI 智能创意抠图背景生成', desc: '一键自动扣除杂乱的产品背景，将毛坯图放入高端咖啡店、阳光下等意式美学场景中。', testPrompt: '我想为羊毛外套替换多款带有米兰冬季街道和雪地的高端商业画报背景图。' },
  { id: 'feature_predict', name: '📊 需求预测与高位库存水位预警', desc: '趋势拟合与关联关系提取，预测未来15天的库存消耗和缺口，防止超卖或积压。', testPrompt: '扫描高位库存红线：检测是否有任何SKU的库存周转天数（DSI）已经超过了90天？' },
  { id: 'feature_search', name: '🔍 AI 本地化语义网店搜索', desc: '前台买家即使打错别字、输入模糊同义词也可瞬间理解其意图，个性化提高意向成交。', testPrompt: '配置优化前台搜索引擎，使搜「高冷外套」能够自动展现「多色羽绒大衣」商品。' },
  { id: 'feature_recommend', name: '🛒 智能个性化搭配推荐 (Upsell)', desc: '通过发掘篮子关联规则，在加购和结账环节自适应向买家推荐围巾、手套等关联周边。', testPrompt: '分析热销大衣，推荐在产品详情页下方自动推荐适合与之搭配的冬季针织保暖配件。' },
  { id: 'feature_email', name: '📧 AI 营销自动化邮件管线', desc: '自适应识别加购未结账行为，定时投放个性化暖心邮件，挽回约 15% 潜在订单。', testPrompt: '一键部署「废弃结账恢复自动化通知」：对流失超10小时的加购用户发送关怀邮件。' },
  { id: 'feature_inbox', name: '💬 Shopify Inbox 自助智能客服', desc: '7x24 小时无人值守，全自动从订单库提货，回答用户关于「我的快递到哪了」的问询。', testPrompt: '启用在线店铺智能客服机器人，配置常见 FAQ 比如支持退换货的标准时限是多少天。' },
  { id: 'feature_translate', name: '🌐 出海 Markets 全自动翻译机', desc: '一键部署欧盟出海：将独立站极速完美翻译为地道的英文、德文、法语、西班牙文。', testPrompt: '帮我将当前主力产品的详情文案全部智能翻译并上架发布为法文和英文本地页面。' },
  { id: 'feature_agentico', name: '🤖 Agentico 代理交互结账渠道', desc: '未来商业范式：向合规的第三方购物大模型代理开放 API，由 AI 直接代顾客挑选下单。', testPrompt: '为我们店铺开启 Agentico 辅助购物连接，供欧洲客户用 AI 助理直接调取下单。' },
  { id: 'feature_fraud', name: '🛡️ 盗卡欺诈与黑产拒付智能安防', desc: '基于神经网络多维交叉分析发卡地、IP跳段等，自动标注中高欺诈风险，拦截可疑交易。', testPrompt: '查验昨天产生的单笔超大额订单的欺诈风险等级，并分析 IP 与发卡行地址比对结果。' },
  { id: 'feature_logistics', name: '📦 物流智能配舱及拼单优选', desc: '智能分析买家地址和货物重量，配比各快递商运费，对意大利本地车队自动优化配送路径。', testPrompt: '计算出一笔发往罗马及米兰的批量物流最优拼单调运配舱，以使整体费率降到最低。' }
];

export default function ShopifyDocsFinder({ addLog }: ShopifyDocsFinderProps) {
  // Navigation: 'help_center' | 'settings_help' | 'ai_magic' | 'dev_guide'
  const [activeMajorTab, setActiveMajorTab] = useState<'help_center' | 'settings_help' | 'ai_magic' | 'dev_guide'>('help_center');

  // Help Center division navigation states
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
  const [selectedSubItem, setSelectedSubItem] = useState<any | null>(null);

  // Settings documents states
  const [localDocs, setLocalDocs] = useState<LocalDocListItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocContent, setSelectedDocContent] = useState<string>('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localSearchLoading, setLocalSearchLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  // Dev Guide states
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('graphql');
  const [devLoading, setDevLoading] = useState(false);
  const [devResult, setDevResult] = useState<string>('');
  const [isSimulated, setIsSimulated] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const QUICK_PRESETS = [
    { title: '查找 GraphQL 商品创建 Mutation', query: 'mutation productCreate to spawn active variants in Shopify Admin API', cat: 'graphql' },
    { title: '查看 Node.js Webhook 验签代码', query: 'Verify Shopify webhook HMAC SHA256 signatures in Express router middleware', cat: 'webhooks' },
    { title: '展示 Liquid 库存降级色块警告', query: 'Best Dawn theme dynamic variant inventory indicator badge snippet with colors', cat: 'liquid' },
    { title: '获取 GraphQL 批量数据调取 (Bulk Query)', query: 'Using massive Bulk Operations API query using GraphQL for complete catalog export', cat: 'graphql' }
  ];

  useEffect(() => {
    fetchLocalDocs();
  }, []);

  const fetchLocalDocs = async (search = '') => {
    setLocalSearchLoading(true);
    try {
      const url = search ? `/api/shopify-local-docs?search=${encodeURIComponent(search)}` : '/api/shopify-local-docs';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLocalDocs(data.docs);
      }
    } catch (err) {
      console.error('Failed to retrieve local settings docs', err);
    } finally {
      setLocalSearchLoading(false);
    }
  };

  const handleLocalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLocalDocs(localSearchQuery);
    if (activeMajorTab !== 'settings_help') {
      setActiveMajorTab('settings_help');
    }
    setSelectedDocId(null);
  };

  const loadSpecificDoc = async (id: string) => {
    setDocLoading(true);
    setSelectedDocId(id);
    addLog('Doc Navigator', '阅览店铺后台设置指南', `载入离线文件: [${id}]`, 'info');
    try {
      const res = await fetch(`/api/shopify-local-docs/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedDocContent(data.content);
      } else {
        setSelectedDocContent(`### 🛑 无法载入本地离线文档\n所请求的文件 \`${id}.md\` 不存在或已被写盘隔离保护。`);
      }
    } catch (err) {
      setSelectedDocContent('### 🛑 网络连接超时\n未能成功调用服务器离线资产接口，请确保后端服务容器就绪。');
    } finally {
      setDocLoading(false);
    }
  };

  // Triggers real, synchronised natural language prompt dispatching down to the Sidekick Copilot component!
  const triggerSidekickAction = (promptText: string, executeNow: boolean) => {
    addLog('Shopify Manual Hub', '激发 Sidekick 远程调用', `已注入提示词: "${promptText}"`, 'success');
    
    // Dispatch global CustomEvent to be captured by AICommandCenter
    const event = new CustomEvent('sidekick-prompt', {
      detail: {
        prompt: promptText,
        execute: executeNow
      }
    });
    window.dispatchEvent(event);

    // Provide visual toast/alert inside components or highlight chat drawer
    const chatDrawer = document.getElementById('ai-command-center-sidebar');
    if (chatDrawer) {
      chatDrawer.classList.add('ring-2', 'ring-[#07C2E3]', 'scale-[1.01]');
      setTimeout(() => {
        chatDrawer.classList.remove('ring-2', 'ring-[#07C2E3]', 'scale-[1.01]');
      }, 1500);
    }
  };

  const handleSearchDevDocs = async (e?: React.FormEvent, customQuery?: string, customCat?: string) => {
    if (e) e.preventDefault();
    const finalQuery = (customQuery || query).trim();
    const finalCat = customCat || category;
    if (!finalQuery) return;

    setDevLoading(true);
    setDevResult('');
    addLog('Developer Terminal', '网店调试中枢', `正在咨询云端大模型并汇总 API 设计纲领: "${finalQuery}"`, 'info');

    try {
      const response = await fetch('/api/gemini/shopify-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery, category: finalCat })
      });

      if (!response.ok) {
        throw new Error('API server validation failure');
      }

      const data = await response.json();
      setDevResult(data.text || data.content || '// Return structure completed');
      setIsSimulated(!!data.simulated);
      addLog('Gemini Docs Assistant', '规范加载完成', `拉取到最新 GraphQL API 资源规格。`, 'success');
    } catch (err: any) {
      console.error(err);
      setDevResult('### 🛑 调取模型服务故障\n请验证全局变量 `GEMINI_API_KEY` 是否有效，并在 Settings 里查看对应认证令牌。');
    } finally {
      setDevLoading(false);
    }
  };

  const executePreset = (p: typeof QUICK_PRESETS[0]) => {
    setQuery(p.query);
    setCategory(p.cat);
    handleSearchDevDocs(undefined, p.query, p.cat);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-left font-sans animate-fadeIn">
      
      {/* Immersive Help Center Header Banner matching Shopify Green Style */}
      <div className="bg-[#0b1b17] border border-[#143d32] text-white rounded-3xl p-6 md:p-8 relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#133c30] via-[#0b1b17] to-[#040908]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#008060]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#008060]/20 border border-[#008060]/30 rounded-full px-3 py-1 text-[10px] font-bold text-[#07C2E3] uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#07C2E3]" />
            <span>help.shopify.com 极客拟真版</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white font-display">
            Shopify 智能帮助探索中心 <span className="text-[#07C2E3]">SaaS Portal</span>
          </h1>
          
          <p className="text-slate-300 text-xs md:text-sm font-normal leading-relaxed">
            为您预置了 <b>40+ 类核心店铺运营划分</b> 与 <b>10 大后台离线设置规范</b>。点击任意手册卡片，即可一键将自然语言提示词同步至右侧 <b>Sidekick Copilot</b> 会话中运行，真正达到「无缝连接，即点即达」！
          </p>

          {/* Quick Search bar exactly styled like help.shopify.com */}
          <form onSubmit={handleLocalSearch} className="relative w-full max-w-xl group">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#07C2E3] transition-colors" />
            <input
              type="text"
              value={localSearchQuery}
              onChange={e => setLocalSearchQuery(e.target.value)}
              placeholder="键入核心名词检索 (如: 支付, 改价格, 邮费, 欧盟一站式增值税, 低库存预警)..."
              className="w-full bg-slate-900/90 hover:bg-slate-900 border border-[#1c433a] focus:border-[#07C2E3] rounded-2xl pl-12 pr-28 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#07C2E3] hover:bg-[#06B2D0] text-slate-950 font-black py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>查阅手册</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* Floating localization badge */}
        <div className="absolute right-6 top-6 hidden lg:flex items-center gap-1.5 bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-405" />
          <span className="text-[10px] text-slate-300 font-bold">Locale:</span>
          <span className="text-[10.5px] font-mono text-[#07C2E3] font-black">Italiano/简体中文</span>
        </div>
      </div>

      {/* Primary Navigation System Tab Menu Bar */}
      <div className="flex flex-wrap items-center bg-[#101216] border border-[#1b1e24] p-1.5 rounded-2xl gap-1">
        <button
          onClick={() => {
            setActiveMajorTab('help_center');
            setSelectedDivisionId(null);
            setSelectedSubItem(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeMajorTab === 'help_center' 
              ? 'bg-[#008060] text-white shadow-lg shadow-[#008060]/10' 
              : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>📖 Shopify 商家业务手册</span>
        </button>

        <button
          onClick={() => {
            setActiveMajorTab('settings_help');
            setSelectedDocId(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeMajorTab === 'settings_help' 
              ? 'bg-[#00d060]/80 text-slate-950 shadow-lg' 
              : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>⚙️ 店铺后台设置指南 (Impostazioni)</span>
        </button>

        <button
          onClick={() => {
            setActiveMajorTab('ai_magic');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeMajorTab === 'ai_magic' 
              ? 'bg-[#07C2E3] text-slate-950 shadow-lg shadow-[#07C2E3]/15' 
              : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>🤖 12 大 AI 经营功能特色指南</span>
        </button>

        <button
          onClick={() => {
            setActiveMajorTab('dev_guide');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeMajorTab === 'dev_guide' 
              ? 'bg-slate-800 text-white shadow-lg' 
              : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>🔬 API 开发者指南 (GraphQL)</span>
        </button>
      </div>

      {/* ========================================================== */}
      {/* 📖 TAB 1: Shopify 商家日常业务管理手册 */}
      {/* ========================================================== */}
      {activeMajorTab === 'help_center' && (
        <div className="space-y-6">
          {!selectedDivisionId ? (
            // Category grids showing e-commerce departments
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
                  📖 选择业务分部查阅实操步骤 (Seleziona dipartimento business)
                </h3>
                <span className="text-[10px] text-[#07C2E3] font-mono font-bold">40+ Standard Handbooks loaded</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BUSINESS_DIVISIONS.map(div => {
                  const DivIcon = div.icon;
                  return (
                    <button
                      key={div.id}
                      onClick={() => setSelectedDivisionId(div.id)}
                      className="p-5 bg-[#0e1013] border border-[#1b1d24] hover:border-[#07C2E3] rounded-2xl text-left transition-all hover:shadow-lg flex gap-4 cursor-pointer group min-w-0"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${div.iconColor}`}>
                        <DivIcon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-extrabold text-[#07C2E3] text-[13.5px] group-hover:text-white transition-colors">{div.title}</p>
                          <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-[#07C2E3] transition-colors" />
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed font-normal truncate-2-lines">{div.description}</p>
                        <div className="flex items-center gap-1.5 pt-2">
                          <span className="text-[9px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-500">{div.items.length} 个功能子项</span>
                          <span className="text-[9.5px] font-bold text-slate-400 group-hover:underline">点击展开说明书</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Detailed sub-topics panel of a chosen Division
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
              
              {/* Left hand sub-topics navigation rail */}
              <div className="lg:col-span-4 bg-[#0d0f12] border border-[#1b1d24] rounded-2xl p-4 space-y-4 shrink-0">
                <button
                  onClick={() => {
                    setSelectedDivisionId(null);
                    setSelectedSubItem(null);
                  }}
                  className="w-full flex items-center gap-1.5 text-slate-400 hover:text-white font-bold text-xs py-2 px-3 border border-slate-800 hover:border-slate-700 bg-slate-950/50 rounded-xl cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>返回大分类选择 &larr;</span>
                </button>

                <div className="border-t border-slate-800/60 pt-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">功能业务子分类 ({BUSINESS_DIVISIONS.find(d => d.id === selectedDivisionId)?.items.length}项)</p>
                  
                  {BUSINESS_DIVISIONS.find(d => d.id === selectedDivisionId)?.items.map(it => {
                    const isSelected = selectedSubItem?.id === it.id;
                    return (
                      <button
                        key={it.id}
                        onClick={() => setSelectedSubItem(it)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex flex-col gap-0.5 cursor-pointer border ${
                          isSelected 
                            ? 'bg-[#008060]/15 border-[#008060] text-white font-bold' 
                            : 'bg-slate-950/30 border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-white'
                        }`}
                      >
                        <span className={`text-[12px] font-black ${isSelected ? 'text-[#07C2E3]' : 'text-slate-300'}`}>{it.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal truncate">{it.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right hand Manual Viewer and live chatbot command syncing CTAs */}
              <div className="lg:col-span-8 space-y-5">
                {selectedSubItem ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[500px] flex flex-col justify-between">
                    
                    {/* Document details */}
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center justify-between border-b border-rose-100/10 pb-3.5 gap-2">
                        <div className="space-y-0.5 text-left">
                          <span className="text-[10px] uppercase font-black tracking-widest text-[#008060] font-mono leading-none bg-[#008060]/10 px-2 py-0.5 rounded">OFFLINE MANUAL</span>
                          <h2 className="text-lg font-black text-slate-900 font-display pt-1">{selectedSubItem.name}</h2>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(selectedSubItem.guide)}
                            className="bg-slate-50 border hover:bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg py-1.5 px-3 flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{hasCopied ? '已复制！' : '复制本文内容'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Markdown body */}
                      <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-xs max-h-[450px] overflow-y-auto pr-2 select-all">
                        <div className="markdown-body">
                          <ReactMarkdown>{selectedSubItem.guide}</ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    {/* Highly interactive CTA Box to copy phrase to chat Copilot */}
                    <div className="bg-slate-950 border border-[#008060]/40 rounded-2xl p-4.5 mt-6 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-[#07C2E3]/20 flex items-center justify-center text-[#07C2E3]">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-[11.5px] font-black text-white">AI 意图协同连证区 (Chiedi a Sidekick)</p>
                      </div>

                      <p className="text-slate-400 text-[10.5px] leading-relaxed">
                        一键点击下方按钮，系统将自动把本章节对于该模块的自然语言询问及实操指令，投放至右侧 <b>Sidekick Copilot</b> 并自动提交，由 AI 从底层数据库级执行！
                      </p>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <code className="text-[11px] font-mono text-[#07C2E3] break-all leading-normal max-w-lg">
                          "{selectedSubItem.prompt}"
                        </code>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => triggerSidekickAction(selectedSubItem.prompt, false)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10.5px] font-bold py-1.5 px-3 rounded-lg border border-slate-700 cursor-pointer"
                          >
                            仅填入
                          </button>
                          <button
                            onClick={() => triggerSidekickAction(selectedSubItem.prompt, true)}
                            className="bg-[#07C2E3] hover:bg-[#06B2D0] text-slate-950 text-[10.5px] font-black py-1.5 px-3.5 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <span>立即运行</span>
                            <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-[#0e1013] border border-[#1b1d24] rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[500px]">
                    <Compass className="w-16 h-16 text-slate-750 animate-pulse" />
                    <div className="space-y-1">
                      <p className="text-white font-extrabold text-sm">手部选区未定 (Navigazione Libera)</p>
                      <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed">
                        请在左侧侧边栏中选择您所关注的特定店铺运营细项。阅读精准官方文档，并可通过一键动作让 Sidekick 为完成。
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* ⚙️ TAB 2: Shopify 店铺后台设置指南 (10 MD Files) */}
      {/* ========================================================== */}
      {activeMajorTab === 'settings_help' && (
        <div className="space-y-6 text-left">
          {selectedDocId ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[550px] flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <button
                    onClick={() => setSelectedDocId(null)}
                    className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer border border-slate-200 hover:border-slate-350 rounded-lg py-1.5 px-3 bg-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>返回设置指南索引 (Torna)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(selectedDocContent)}
                      className="p-1.5 px-3 bg-slate-50 border hover:bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{hasCopied ? '已复制！' : '复制 Markdown'}</span>
                    </button>
                    <span className="bg-[#07C2E3]/15 text-[#07C2E3] font-mono text-[9px] font-black px-2 py-1 rounded border border-[#07C2E3]/20">
                      SETTINGS MAN: LOCAL FILE
                    </span>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none text-slate-800 text-xs overflow-y-auto max-h-[550px] leading-relaxed select-all">
                  {docLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-3">
                      <RefreshCw className="w-7 h-7 text-[#07C2E3] animate-spin" />
                      <p className="text-xs text-slate-400 font-bold animate-pulse">正在从本地检索盘装载说明书...</p>
                    </div>
                  ) : (
                    <div className="markdown-body">
                      <ReactMarkdown>{selectedDocContent}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-500 mr-1" />
                  <span>此设置文件已对齐欧盟高规税务及隐私政策。您可以立即运行测试。</span>
                </div>
                <button
                  onClick={() => setSelectedDocId(null)}
                  className="text-[#07C2E3] hover:underline font-black text-right"
                >
                  返回设置索引中心 &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
                  📂 本地离线 10 大核心设置手册 (Impostazioni Negozio)
                </h3>
                {localSearchLoading && <RefreshCw className="w-4 h-4 text-[#07C2E3] animate-spin" />}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SETTINGS_TOPICS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => loadSpecificDoc(item.id)}
                    className="p-5 bg-[#0a0c0e] border border-slate-800 hover:border-[#07C2E3] rounded-2xl text-left transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between group h-40"
                  >
                    <div className="space-y-1.5 text-left w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#07C2E3] font-bold">id: {item.id}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#07C2E3]" />
                      </div>
                      <h4 className="font-extrabold text-[12.5px] text-white group-hover:text-[#07C2E3]">{item.title}</h4>
                      <p className="text-[10.5px] text-slate-450 leading-relaxed font-normal truncate-3-lines">{item.desc}</p>
                    </div>

                    <div className="border-t border-slate-900 pt-2 w-full mt-2 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-slate-500 font-bold">Standard Spec</span>
                      <span className="text-[9.5px] font-bold text-[#07C2E3] group-hover:underline">阅读详情手册 &rarr;</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* 🤖 TAB 3: 12 大 AI 经营功能特色指南 (12 AI Features) */}
      {/* ========================================================== */}
      {activeMajorTab === 'ai_magic' && (
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
              🤖 AI Commerce OS 全栈 12 大智能运营硬核能力全览
            </h3>
            <span className="text-[10px] bg-[#07C2E3]/15 text-[#07C2E3] font-mono font-bold px-2.5 py-0.5 rounded-full border border-[#07C2E3]/20">Auto-Execute Powered</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AI_TWELVE_FEATURES.map((feat, idx) => (
              <div
                key={feat.id}
                className="p-5 bg-[#0a0c0f] border border-[#171b22] rounded-2xl flex flex-col justify-between space-y-4 hover:border-[#07C2E3]/40 transition-all shadow-md group"
              >
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[#07C2E3] font-mono text-[10.5px] font-black">CAPABILITY_0{idx + 1}</span>
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                      FREE / 免费
                    </span>
                  </div>

                  <h4 className="font-extrabold text-[13px] text-white group-hover:text-[#07C2E3] transition-colors">{feat.name}</h4>
                  <p className="text-slate-450 text-[10.5px] leading-relaxed font-normal">{feat.desc}</p>
                </div>

                {/* AI sync trigger form inside the card */}
                <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 space-y-2 text-left">
                  <p className="text-[9.5px] text-slate-500 font-mono">典型询问提示词示例 (Prompt):</p>
                  <p className="text-[10.5px] text-slate-300 italic font-mono truncate leading-normal">
                    "{feat.testPrompt}"
                  </p>
                  
                  <button
                    onClick={() => triggerSidekickAction(feat.testPrompt, true)}
                    className="w-full bg-[#07C2E3]/10 hover:bg-[#07C2E3] hover:text-slate-950 text-[#07C2E3] text-[10px] font-black py-1.5 rounded-lg border border-[#07C2E3]/35 hover:border-transparent transition-all cursor-pointer flex items-center justify-center gap-1 mt-1"
                  >
                    <span>💬 立即派发并执行此 AI 能力</span>
                    <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 🔬 TAB 4: API 开发者指南 (Original developer console) */}
      {/* ========================================================== */}
      {activeMajorTab === 'dev_guide' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start text-left">
        
          {/* Left inputs */}
          <div className="xl:col-span-4 bg-[#0a0c0f] border border-[#1b1e24] rounded-2xl p-5 shadow-sm space-y-5 shrink-0">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Compass className="w-4 h-4 text-[#07C2E3]" /> API调试交互控台
            </h4>

            <form onSubmit={(e) => handleSearchDevDocs(e)} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">接口规范分类 (Category)</label>
                <div className="flex gap-1.5">
                  {[
                    { key: 'graphql', label: 'GraphQL API', icon: Code },
                    { key: 'webhooks', label: 'Webhook (HMAC)', icon: Globe },
                    { key: 'liquid', label: 'Liquid 模板', icon: FileCode },
                  ].map(cat => {
                    const isSelected = category === cat.key;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setCategory(cat.key)}
                        className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#07C2E3]/15 border-[#07C2E3] text-white font-black shadow-sm' 
                            : 'bg-slate-900 border-transparent text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span className="text-[9px] font-bold">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">自定义提问 / GraphQL Schema</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={query} 
                    onChange={e => setQuery(e.target.value)}
                    placeholder="例如: mutation to create product with inventory..."
                    className="w-full bg-[#111317] border border-slate-800 rounded-xl pl-3 pr-8 py-2.5 text-xs text-[#07C2E3] placeholder-slate-600 font-mono focus:bg-slate-950 focus:outline-none focus:border-[#07C2E3] transition-all" 
                  />
                  
                  <button
                    type="submit"
                    disabled={devLoading || !query.trim()}
                    className="absolute right-1.5 top-1.5 p-1.5 bg-[#07C2E3] text-slate-950 hover:bg-[#06B2D0] rounded-lg disabled:opacity-30 transition-opacity cursor-pointer"
                  >
                    {devLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-2 border-t border-slate-800/80 pt-4 text-xs font-sans">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">推荐开发查询预置样本:</span>
              <div className="space-y-1.5">
                {QUICK_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => executePreset(p)}
                    className="w-full text-left p-2.5 bg-[#101217] hover:bg-[#07C2E3]/10 text-slate-400 hover:text-white rounded-lg text-[10.5px] font-semibold border border-translate transition-all flex items-start gap-1.5 cursor-pointer italic"
                  >
                    <Sparkles className="w-3 h-3 text-[#07C2E3] mt-0.5 shrink-0" />
                    <span>{p.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right outputs */}
          <div className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm min-h-[500px] flex flex-col justify-between">
            <div className="space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="text-left">
                  <h4 className="font-extrabold text-slate-900 text-sm font-display flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-indigo-600" /> Shopify 开发者中心数据板 (Developer Hub Result)
                  </h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">格式化 MD 模板，支持直接复制配合 Chrome API 端点进行本地跑通。</p>
                </div>

                {devResult && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleCopy(devResult)}
                      className="p-1 px-2.5 bg-slate-50 border hover:bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      {hasCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600">已复制!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>一键复制</span>
                        </>
                      )}
                    </button>

                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${isSimulated ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {isSimulated ? 'Simulated Fallback' : 'Gemini Active'}
                    </span>
                  </div>
                )}
              </div>

              {/* MD Output rendering content */}
              <div className="text-slate-800 font-normal leading-relaxed text-xs overflow-y-auto max-h-[500px] p-2 prose prose-slate">
                {devLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <RefreshCw className="w-8 h-8 text-[#07C2E3] animate-spin" />
                    <p className="text-xs text-slate-450 font-bold animate-pulse">Gemini 正在编译提取最新文档与代码规格...</p>
                  </div>
                ) : devResult ? (
                  <div className="markdown-body">
                    <ReactMarkdown>{devResult}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 text-slate-400">
                    <Code className="w-12 h-12 text-slate-300" />
                    <div className="space-y-1">
                      <p className="font-bold text-slate-700">API 查询返回终端空闲</p>
                      <p className="text-[10.5px] max-w-sm">键入指令或点击左下侧预设样本调取 Gemini 实时生成最地道可跑通的 Schema 代码块。</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span>LLM Engine: <b className="text-slate-550 mr-2">gemini-2.5-flash</b></span>
              <span>API Compatibility: <b className="text-slate-550 font-bold">Admin API v2026-04 (Latest)</b></span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
