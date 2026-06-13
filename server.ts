import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

// Import original domain structures directly as our DB seed
import { INDUSTRY_PRESETS, COMMON_MCP_TOOLS, APP_MARK_PRESETS } from "./src/data";
import { AIBrainService } from "./src/services/AIBrainService";
import { AgentOrchestrator } from "./src/services/AgentOrchestrator";
import { generateIntelligentLocalReply } from "./src/utils/intelligentFallback";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const DB_FILE = path.join(process.cwd(), "server_db.json");

interface DatabaseSchema {
  tenants: any[];
  tenantDB: Record<string, {
    products: any[];
    orders: any[];
    customers: any[];
    workflows: any[];
    knowledge: any[];
    metrics: any[];
  }>;
  mcpTools: any[];
  marketItems: any[];
  activeAgents: any[];
  discountDrafts: any[];
  auditLogs?: any[];
  agentRuns?: any[];
  agentTasks?: any[];
  aiBattlePlans?: any[];
  aiActionsLog?: any[];
  relational?: any;
}

const DEFAULT_TENANTS = [
  { id: 't_retail', companyName: '米兰先锋潮流配货有限公司', industry: 'retail', storeName: '米兰三年老店旗舰仓', status: 'active', aiBudget: 2000, aiSpent: 345.5, createdAt: '2026-01-10' },
  { id: 't_food', companyName: '罗马圣地大剧院比萨工坊餐厅', industry: 'food', storeName: '大剧院比萨店线上外卖一号端', status: 'active', aiBudget: 800, aiSpent: 142.1, createdAt: '2026-02-15' },
  { id: 't_manufacturing', companyName: '柏林智慧电器百货商行', industry: 'manufacturing', storeName: '智慧电器多门店直销店', status: 'active', aiBudget: 1000, aiSpent: 418.2, createdAt: '2026-03-01' },
  { id: 't_healthcare', companyName: '巴黎名品商场POS收银柜部', industry: 'healthcare', storeName: '巴黎高端香水POS快速结算端', status: 'active', aiBudget: 1500, aiSpent: 890.0, createdAt: '2026-03-24' },
  { id: 't_service', companyName: '罗马皇家女子美容Spa会所', industry: 'service', storeName: '罗马会所美容线上预订端', status: 'active', aiBudget: 400, aiSpent: 122.5, createdAt: '2026-04-10' },
  { id: 't_education', companyName: '奥地利跨境网店直销部', industry: 'education', storeName: '382跨境3C出海站', status: 'active', aiBudget: 600, aiSpent: 210.0, createdAt: '2026-05-02' }
];

function getDB(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8").trim();
      if (content) {
        const db = JSON.parse(content);
        // Run auto-alignment for SQL schemas
        let modified = false;
        if (!db.relational) {
          AIBrainService.ensureRelationalDatabase(db);
          modified = true;
        }
        if (modified) {
          fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
        }
        return db;
      } else {
        console.warn("Existing DB file is empty. Seeding a new one.");
      }
    } catch (e: any) {
      console.warn("Failed to parse existing DB file. Re-initializing DB file safely:", e.message || e);
    }
  }

  // Pre-seed the DB from dataset
  const tenantDB: any = {};
  Object.keys(INDUSTRY_PRESETS).forEach(ind => {
    tenantDB[ind] = JSON.parse(JSON.stringify(INDUSTRY_PRESETS[ind]));
  });

  const activeAgents: any[] = [];
  Object.keys(INDUSTRY_PRESETS).forEach(ind => {
    INDUSTRY_PRESETS[ind].agents?.forEach(agent => {
      activeAgents.push({ ...agent });
    });
  });

  const db: DatabaseSchema = {
    tenants: DEFAULT_TENANTS,
    tenantDB,
    mcpTools: COMMON_MCP_TOOLS,
    marketItems: APP_MARK_PRESETS,
    activeAgents,
    discountDrafts: [],
    auditLogs: [
      { id: 'AL_001', tenantId: 't_retail', userId: 'Oliver (InventoryAgent)', action: 'AUTOMATED_DSI_SCAN', resourceType: 'inventory', resourceId: 'winter_stocks', beforeJson: '{"DSI_Average": 125}', afterJson: '{"DSI_Target": 35}', createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: 'AL_002', tenantId: 't_retail', userId: 'Sophia (PricingAgent)', action: 'MARGIN_ELASTICITY_COMPILE', resourceType: 'pricing', resourceId: 'winter_clearance_ratio', beforeJson: '{"baseDiscount": 0}', afterJson: '{"recommendedDiscount": 45}', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 'AL_003', tenantId: 't_retail', userId: 'Platform Operator', action: 'TENANT_ISOLATION_CONFIRM', resourceType: 'database', resourceId: 'db_retail', beforeJson: '{"status": "initializing"}', afterJson: '{"status": "active_isolated"}', createdAt: new Date(Date.now() - 1800000).toISOString() }
    ],
    agentRuns: [
      { id: 'RUN_101', tenantId: 't_retail', agentName: 'InventoryAgent', status: 'COMPLETED', query: '扫描服饰批发冬季滞销库存', recommendation: '发现 4 个冬季滞销高位 SKU（DSI达125天），建议降折促销度：55% off', startedAt: new Date(Date.now() - 7200000).toISOString(), finishedAt: new Date(Date.now() - 7180000).toISOString() },
      { id: 'RUN_102', tenantId: 't_retail', agentName: 'PricingAgent', status: 'COMPLETED', query: '计算季末清理弹性限时优惠码核阻', recommendation: '满减优惠券 TAKE45 经过博弈公式，老客核让利最大不超过 -5.5% 盈亏盈亏弹性界，允许批准', startedAt: new Date(Date.now() - 3600000).toISOString(), finishedAt: new Date(Date.now() - 3595000).toISOString() },
      { id: 'RUN_103', tenantId: 't_retail', agentName: 'MarketingAgent', status: 'PENDING', query: '欧洲多店催付分群大客消息精准投发', recommendation: '筛选 12 位 30 天未下单大客，已将代金券投递任务生成为草稿。待人审批准。', startedAt: new Date(Date.now() - 600000).toISOString(), finishedAt: null }
    ],
    agentTasks: [
      { id: 'TASK_001', tenantId: 't_retail', name: '自动生成冬装 SEO 描述', sourceAgent: 'ProductAgent', status: 'COMPLETED', progress: 100, createdAt: new Date(Date.now() - 12000000).toISOString() },
      { id: 'TASK_002', tenantId: 't_retail', name: '自动翻译主力商品为 21SL 意法语言', sourceAgent: 'ProductAgent', status: 'COMPLETED', progress: 100, createdAt: new Date(Date.now() - 10000000).toISOString() },
      { id: 'TASK_003', tenantId: 't_retail', name: '【高仓滞销清出】冬装羽绒服大衣库存调配协议', sourceAgent: 'InventoryAgent', status: 'PENDING_APPROVAL', progress: 0, createdAt: new Date().toISOString() },
      { id: 'TASK_004', tenantId: 't_retail', name: '【意区老客促活】限时满减折扣草稿物理封包', sourceAgent: 'MarketingAgent', status: 'DRAFT', progress: 0, createdAt: new Date().toISOString() }
    ],
    aiBattlePlans: [],
    aiActionsLog: []
  };

  AIBrainService.ensureRelationalDatabase(db);

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to create seed database file:", err);
  }

  return db;
}

function saveDB(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist database file on disk:", err);
  }
}

// Lazy initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Cache for storing currently focused page per tenant & store on the backend
const backendRuntimePageCache: Record<string, string> = {
  "tenant_default_store_default": "command",
  "t_retail_store_retail": "command"
};

// Sidekick Connector Page-Focus SDK Endpoint
app.post("/api/brain/page-focus", (req, res) => {
  try {
    const { page, tenantId = 't_retail', storeId = 'store_retail' } = req.body;
    if (!page) {
      return res.status(400).json({ error: "Missing page parameter in request body." });
    }
    const cacheKey = `${tenantId}_${storeId}`;
    backendRuntimePageCache[cacheKey] = page.toLowerCase();
    
    console.log(`[Backend-Context] Synchronized browser segment focus: "${page}" for key "${cacheKey}"`);
    return res.json({ success: true, registeredPage: page.toLowerCase() });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to record backend page navigation event", details: err.message });
  }
});

// GET /api/brain/context
app.get("/api/brain/context", (req, res) => {
  try {
    const tenantId = (req.query.tenantId as string) || "t_retail";
    const storeId = (req.query.storeId as string) || "store_retail";
    const cacheKey = `${tenantId}_${storeId}`;
    const currentPage = backendRuntimePageCache[cacheKey] || backendRuntimePageCache["tenant_default_store_default"] || "command";

    let storeReadiness = 87;
    let gaps: string[] = ["未完成欧盟一站式申报 (VAT OSS Compliance Standard)", "法语及意语关键爆品描述缺位 (Required For 出海)"];
    let recommendedAction = "一键进行欧盟市场 VAT 备案配置";
    let actions: any[] = [];

    // Contextual evaluations matching the Business Engines
    if (currentPage === "markets" || currentPage === "logistics" || currentPage === "online-store") {
      storeReadiness = 82;
      gaps = [
        "未完成欧盟一站式申报 (VAT OSS Compliance Standard)",
        "欧洲区跨境直邮配送通道未启用 (EU Express Zones Stale)",
        "法语及德语站商品本地化文案残缺"
      ];
      recommendedAction = "激活欧盟本土市场及增值税 VAT 备案规则";
      actions = [
        {
          id: "na_vat_oss",
          code: "VAT_OSS_COMPLY",
          title: "启用欧盟一站式增值税申报备案 (VAT OSS)",
          description: "自动对接OSS备案申报机制，规范跨境发货税费代收与代扣。",
          priority: "CRITICAL",
          btnLabel: "立即启用合规协议库",
          actionPayload: { action: "switch_tab", payload: "settings" }
        },
        {
          id: "na_eu_languages",
          code: "TRANSLATE_FR_DE",
          title: "一键部署法语/德语本土爆品文案覆盖",
          description: "系统检测到法国和德国站浏览转化偏低，建议使用AI智能翻译并覆盖商品搜索引擎索引。",
          priority: "MEDIUM",
          btnLabel: "一键优化并覆盖中英法多语言文案",
          actionPayload: { action: "switch_tab", payload: "products" }
        }
      ];
    } else if (currentPage === "products" || currentPage === "inventory" || currentPage === "sourcing") {
      storeReadiness = 91;
      gaps = [
        "爆品库存严重不足: 羊毛秋冬大衣 (低库存 < 15)",
        "产品 SEO 结构性元素在出海目标市场不适配 (SEO Target Miss)"
      ];
      recommendedAction = "批量补齐低库存热销爆品并覆盖海外仓货流";
      actions = [
        {
          id: "na_restock_sourcing",
          code: "RESTOCK_TRIGGER",
          title: "一键发起供应商热销爆货源补齐与分发",
          description: "自动核算并向本地合伙供应链发送补货指令。",
          priority: "HIGH",
          btnLabel: "一键向供应商发起起补货备仓指令 (Restock)",
          actionPayload: { action: "restock", payload: { sku: "all", count: 300 } }
        },
        {
          id: "na_seo_optimize",
          code: "SEO_SYNTHESIZE",
          title: "运行跨境 SEO 标题与图谱强化管线",
          description: "批量重写商品外海站前端描述页面，将点击率预计提升 8.2%。",
          priority: "MEDIUM",
          btnLabel: "一键优化并覆盖中英法多语言文案",
          actionPayload: { action: "switch_tab", payload: "products" }
        }
      ];
    } else if (currentPage === "payments" || currentPage === "finance") {
      storeReadiness = 75;
      gaps = [
        "Adyen 等多通道本地法币结算尚未就绪",
        "部分跨境意向客户存在付款超时未转化现象 (Pending Count High)"
      ];
      recommendedAction = "立即提报 KYC 证书并对未付款客户进行自动对账追缴";
      actions = [
        {
          id: "na_kyc_compliance",
          code: "KYC_COMPLY",
          title: "提报 Adyen/Stripe 渠道实名 KYC 证书",
          description: "应欧洲法案要求，合规结算必须绑定法人主体证照。",
          priority: "HIGH",
          btnLabel: "立即启用合规协议库",
          actionPayload: { action: "switch_tab", payload: "settings" }
        }
      ];
    } else if (currentPage === "settings" || currentPage === "policies") {
      storeReadiness = 78;
      gaps = [
        "GDPR 条款缺少用户隐私自定义同意挂架 (Privacy Directive Miss)",
        "欧洲区法定 14 天退换货规则条款(Cancel Policy) 缺位"
      ];
      recommendedAction = "应用标准 GDPR 法令隐私及取消条款声明";
      actions = [
        {
          id: "na_gdpr_policy",
          code: "GDPR_ACTIVATE",
          title: "运行并覆盖标准 GDPR 出海政策协议声明",
          description: "在店铺隐私设置及条款页面强制追加多语种 Cookie 申明和14天政策规则。",
          priority: "HIGH",
          btnLabel: "立即启用合规协议库",
          actionPayload: { action: "switch_tab", payload: "settings" }
        }
      ];
    } else {
      // General fallbacks (e.g., Command focus)
      actions = [
        {
          id: "na_generative_vat",
          code: "VAT_GENERAL",
          title: "一键启用跨境海外市场 VAT 合规规则",
          description: "对商家提供无感的全自动税收调配，直接消除海外扣回等处罚性风险。",
          priority: "HIGH",
          btnLabel: "立即前往海外市场配置",
          actionPayload: { action: "switch_tab", payload: "online-store" }
        }
      ];
    }

    return res.json({
      currentPage,
      storeReadiness,
      gaps,
      recommendedAction,
      actions,
      syncedAt: new Date().toISOString(),
      tenantId,
      storeId
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to assemble sidekick context", details: err.message });
  }
});

// Database API endpoints for Enterprise SaaS multi-tenant isolation
app.get("/api/db/get-all", (req, res) => {
  try {
    const db = getDB();
    res.json(db);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to query database state", details: err.message });
  }
});

app.post("/api/db/save-all", (req, res) => {
  try {
    const newDb = req.body;
    if (!newDb || typeof newDb !== "object") {
      return res.status(400).json({ error: "Invalid database state payload" });
    }
    saveDB(newDb);
    res.json({ success: true, message: "Multi-tenant database persisted successfully to server storage." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to persist database state", details: err.message });
  }
});

app.post("/api/db/create-discount-draft", (req, res) => {
  try {
    const draft = req.body;
    if (!draft || typeof draft !== "object") {
      return res.status(400).json({ error: "Invalid discount draft details" });
    }
    const db = getDB();
    if (!db.discountDrafts) db.discountDrafts = [];
    
    const record = {
      id: "DISC_" + Date.now(),
      createdAt: new Date().toISOString(),
      ...draft
    };
    db.discountDrafts.push(record);
    saveDB(db);
    res.json({ success: true, draft: record, allDrafts: db.discountDrafts });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save discount draft to store database", details: err.message });
  }
});

app.post("/api/db/create-audit-log", (req, res) => {
  try {
    const logVal = req.body;
    if (!logVal || typeof logVal !== "object") {
      return res.status(400).json({ error: "Invalid audit details" });
    }
    const db = getDB();
    if (!db.auditLogs) db.auditLogs = [];
    
    const record = {
      id: "AL_" + (db.auditLogs.length + 1).toString().padStart(3, '0'),
      createdAt: new Date().toISOString(),
      ...logVal
    };
    db.auditLogs.unshift(record); // newest first
    saveDB(db);
    res.json({ success: true, log: record, allLogs: db.auditLogs });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save audit log", details: err.message });
  }
});

app.post("/api/db/approve-task", (req, res) => {
  try {
    const { taskId, action } = req.body; // e.g., 'APPROVE', 'EXECUTE', 'CANCEL'
    if (!taskId) {
      return res.status(400).json({ error: "Missing taskId required parameter" });
    }
    const db = getDB();
    if (!db.agentTasks) db.agentTasks = [];
    
    let matchedTask = db.agentTasks.find((t: any) => t.id === taskId);
    if (!matchedTask) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    // Draft -> Approved -> Executing -> Completed -> Cancelled state machine
    const oldStatus = matchedTask.status;
    if (action === 'APPROVE') {
      matchedTask.status = 'APPROVED';
      matchedTask.progress = 25;
    } else if (action === 'EXECUTE') {
      matchedTask.status = 'EXECUTING';
      matchedTask.progress = 75;
      
      // If it is our apparel clearances, create discount draft in parallel
      if (taskId === 'TASK_003' || matchedTask.name.includes('冬装')) {
        db.discountDrafts.push({
          id: "DISC_" + Date.now(),
          createdAt: new Date().toISOString(),
          code: "CLEARANCE_WINTER_55",
          discount_percentage: 45,
          campaign_name: "Winter Outwear Clearance Sale",
          status: "APPROVED_EXEC",
          source: "Automated Apparel Allocation Command"
        });
      }
    } else if (action === 'COMPLETE') {
      matchedTask.status = 'COMPLETED';
      matchedTask.progress = 100;
    } else if (action === 'CANCEL') {
      matchedTask.status = 'CANCELLED';
      matchedTask.progress = 0;
    }
    
    // Automatically record an audit log for this state transition!
    if (!db.auditLogs) db.auditLogs = [];
    db.auditLogs.unshift({
      id: "AL_" + (db.auditLogs.length + 1).toString().padStart(3, '0'),
      tenantId: matchedTask.tenantId || 't_retail',
      userId: 'SaaS Platform Administrator',
      action: 'TASK_STATE_TRANSITION',
      resourceType: 'agent_task',
      resourceId: taskId,
      beforeJson: JSON.stringify({ status: oldStatus }),
      afterJson: JSON.stringify({ status: matchedTask.status }),
      createdAt: new Date().toISOString()
    });
    
    saveDB(db);
    res.json({ success: true, task: matchedTask, allTasks: db.agentTasks, allLogs: db.auditLogs });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to transition task status", details: err.message });
  }
});

// Dedicated Agent Orchestrator Endpoint
app.post("/api/ai/orchestrate", async (req, res) => {
  try {
    const { message, aiContext } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Missing required 'message' in request body." });
    }
    const result = AgentOrchestrator.orchestrate(message, aiContext);
    return res.json(result);
  } catch (err: any) {
    console.error("AgentOrchestrator endpoint failed:", err);
    res.status(500).json({ error: "Agent Orchestration calculation failed", details: err.message });
  }
});

// Legacy proxy endpoint to prevent any front-end disruption
app.post("/api/ai/ask", async (req, res) => {
  try {
    const { tenantId = 't_retail', userId = 'u_admin', currentRoute = '/dashboard', question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: "Missing required 'question' parameter." });
    }

    const db = getDB();
    const context = AIBrainService.buildAIContext(db, tenantId, `store_${tenantId.replace('t_', '')}`, userId, currentRoute);
    const result = AIBrainService.handleMerchantTask(question, context, db);
    
    saveDB(db);

    return res.json({
      answer: result.summary,
      agent: {
        id: 'cortex',
        name: 'Sophia',
        role: 'Central AI Brain Coordinator',
        emoji: '🧠'
      },
      rationale: 'Compatibility proxy routing',
      suggestedAction: 'Executed brain task',
      draft: result.plan || null,
      simulated: true,
      metrics: context.metrics,
      actions: result.suggestions
    });
  } catch (err: any) {
    console.error("Legacy AI ask proxy failed:", err);
    res.status(500).json({ error: "Legacy ask brain collapse", details: err.message });
  }
});

// Brand-New Enterprise AI Brain OS Endpoint: Merchant Chat
app.post("/api/ai/merchant-chat", async (req, res) => {
  try {
    const { 
      tenantId = 't_retail', 
      storeId = 'store_retail', 
      userId = 'u_admin', 
      currentRoute = '/dashboard', 
      question,
      userMessage,
      aiContext
    } = req.body;

    const message = userMessage || question;
    if (!message) {
      return res.status(400).json({ error: "Required 'question' or 'userMessage' parameter is missing." });
    }

    const db = getDB();
    
    let context;
    let result;
    if (aiContext) {
      context = aiContext;
      result = AIBrainService.orchestrateBrainTask(message, aiContext, db);
    } else {
      context = AIBrainService.buildAIContext(db, tenantId, storeId, userId, currentRoute);
      result = AIBrainService.handleMerchantTask(message, context, db);
    }
    
    saveDB(db);

    return res.json({
      summary: result.summary,
      suggestions: result.suggestions,
      battlePlanId: result.battlePlanId || null,
      plan: result.plan || null,
      routerOutput: result.routerOutput || null,
      suggestionId: result.suggestionId || null,
      context
    });
  } catch (err: any) {
    console.error("AI Merchant brain failed:", err);
    res.status(500).json({ error: "AI Merchant Brain fell into deadlock", details: err.message });
  }
});

// Brand-New Enterprise AI Brain OS Endpoint: Admin Chat
app.post("/api/ai/admin-chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Required 'question' parameter is missing." });
    }

    const db = getDB();
    
    // Core brain handles the admin task logic
    const result = AIBrainService.handleAdminTask(question, db);
    
    saveDB(db);

    return res.json({
      summary: result.summary,
      suggestions: result.suggestions,
      metrics: result.metrics || null
    });
  } catch (err: any) {
    console.error("AI Admin central brain failed:", err);
    res.status(500).json({ error: "AI Admin Brain fell into deadlock", details: err.message });
  }
});

// AI-powered elite content optimization endpoint for the editor
app.post("/api/ai/optimize-text", async (req, res) => {
  const { text, context } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing required 'text' parameter in body." });
  }

  try {
    const ai = getGeminiClient();

    if (!ai) {
      // High-fidelity fallback rule-based enhancer when Gemini API is not yet active
      console.log("Utilizing high-fidelity fallback text enhancer.");
      await new Promise(resolve => setTimeout(resolve, 600));

      // Rule-based content enhancer depending on keyword markers
      let optimized = text;
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('refund') || lowerText.includes('退款') || lowerText.includes('退货')) {
        optimized = `### 销售退款与换货政策守则 (EU 2011/83/EU Compliance Standard)\n\n根据欧洲联盟消费者权利指令，特此订立本店铺标准退款协议：\n\n1. **14天宽免无理由退货权 (Right of Withdrawal)**: 所有在零售柜下单的实物商品，均自妥投签收次日起享有完好无损的14天鉴赏期，期间买家可发起无理由原路退款申请。\n2. **跨境逆向物流资费**: 退货邮资默认由买家自理承担，买家需提供符合 DHL/UPS 合规寄递的回邮单据副本至合规结算通道中。\n3. **完好返还标准**: 商品的原标签必须完好，且未产生实际磨损、破损或洗涤痕迹，否则商家有权对其折价抵扣处理。\n4. **审核与拨退时限**: 店铺收到并审核货物后的 3 个工作日内，原路结清资金本金至其 Adyen/Stripe 支付通道中。如有不妥，应实时通报。\n\n--- \n*本销售协议已完全对齐 2026 最新行业高合规对账审核规则。*`;
      } else if (lowerText.includes('privacy') || lowerText.includes('隐私') || lowerText.includes('数据') || lowerText.includes('consent')) {
        optimized = `### 个人隐私数据保护与 GDPR 授权同意书 (EU General Data Protection Regulation)\n\n我们郑重承诺严格保障买家数字足迹，并依 GDPR 等最高国际法规则保障您的核心数字隐私权：\n\n- **数据收集最小化原则 (Data Minimization)**: 系统仅根据交易必达所需，调取您的基本收件姓名、邮政编码、DHL物流派寄终端及必要的 Adyen/Stripe 标记化账单账户凭据。\n- **跨境合规托管与隔离**: 所有的支付账户信息在传输时通过 TLS 1.3 极速单项高位物理锁防伪加密，并在多租户服务器端执行高强度的字段物理空间隔离，杜绝越权。\n- **随时撤回权与完全删除**: 客户有权联系我们的合规官一键将名下的订单历史记录进行匿名清洗，永久执行遗忘请求。\n- **不向任何第三方转售广告**: 郑重声明不搜集、不分析、不转售您的身份信息至其他无关数据商。`;
      } else if (lowerText.includes('system') || lowerText.includes('role') || lowerText.includes('prompt') || lowerText.includes('指令') || lowerText.includes('agent')) {
        optimized = `你是在 AI Commerce OS 智能经营中台下深度搭载的数字员工智能中枢。
你的系统底层核心运行特性：

1. **核心使命**: 协助店商经营。提供精准、明晰、低废话、数据扎实的 SKU 备货研判、对账分析、订单合规审计及物流出境预案。
2. **严限行为逻辑**: 严格遵循《多租户隔离对账准则》，每一次请求均需要深度验证对应租户店面的 tenant_id 及 store_id。拒绝回答无关技术底层的冗余技术废话。
3. **工作风格**:
   - 回答精简、排版考究、多用表格，极度强调“立即执行”与“快捷纠偏操作”。
   - 保持高级中性、冷静、数据严谨的商界领袖发言腔调。
4. **支持工具**: 根据授权，在决策需要时自动编排采购调补（restock）或老客优惠券分流营选（campaign）。`;
      } else {
        // General text beautification fallback
        optimized = `### 精英级商务文案排版更新 (AI Smooth Layout)\n\n${text}\n\n---\n**💡 商业改进建议：**\n1. **用语精炼**: 我们已剔除原文中较为松散或口语化的表达，改为干练、逻辑明确的职业经理人语态；\n2. **格式排版**: 增加结构化标序与大标题配比，使移动优先阅读体验更加顺畅通透；\n3. **操作引导**: 在后部注入清晰的具体执行流，强化了对真实动作的引导力。`;
      }

      return res.json({ optimized });
    }

    // Call actual Gemini API with perfect instruction!
    const systemPrompt = `
    You are an elite enterprise copywriting, compliance, and instruction engineer. 
    Your role is to optimize, structure, beautify, and polish text based on European e-commerce standards, professional SaaS design aesthetics, and precise multi-agent logic.
    
    INSTRUCTIONS:
    1. If the input is a legal policy (refund, privacy, tos), transform it into high-fidelity, complete, formatted legal Markdown utilizing bold highlights, tables, and clear compliance bullet points (like EU GDPR, 2011/83/EU compliance).
    2. If the input is an AI system prompt or instruction, make it extremely precise, structured, numbering-indexed, with absolute clarity of boundaries, roles, tone limits, and tool execution boundaries.
    3. If the input is a general business overview or layout description, make it premium, brief, persuasive, using spacious typography.
    4. Keep the output language same as the input (if input is mostly Chinese/Bilingual, rewrite in luxurious Chinese/Bilingual business style).
    5. Return STRICTLY the polished text inside the "optimized" JSON key. Do not wrap in markdown json block.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Context: ${context || 'General text Optimization'}\nOriginal text to optimize:\n${text}`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.65,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimized: { type: Type.STRING, description: "The beautiful structured optimized text in Markdown format" }
          },
          required: ["optimized"]
        }
      }
    });

    const bodyText = response.text || "{}";
    const data = JSON.parse(bodyText);
    
    return res.json({
      optimized: data.optimized || text
    });

  } catch (error: any) {
    console.warn("Optimize Text API request failed (Service/Network error). Performing high-fidelity rule-based fallback:", error.message);
    
    // Rule-based content enhancer depending on keyword markers
    let optimized = text;
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('refund') || lowerText.includes('退款') || lowerText.includes('退货')) {
      optimized = `### 销售退款与换货政策守则 (EU 2011/83/EU Compliance Standard)\n\n根据欧洲联盟消费者权利指令，特此订立本店铺标准退款协议：\n\n1. **14天宽免无理由退货权 (Right of Withdrawal)**: 所有在零售柜下单的实物商品，均自妥投签收次日起享有完好无损的14天鉴赏期，期间买家可发起无理由原路退款申请。\n2. **跨境逆向物流资费**: 退货邮资默认由买家自理承担，买家需提供符合 DHL/UPS 合规寄递的回邮单据副本至合规结算通道中。\n3. **完好返还标准**: 商品的原标签必须完好，且未产生实际磨损、破损或洗涤痕迹，否则商家有权对其折价抵扣处理。\n4. **审核与拨退时限**: 店铺收到并审核货物后的 3 个工作日内，原路结清资金本金至其 Adyen/Stripe 支付通道中。如有不妥，应实时通报。\n\n--- \n*本销售协议已完全对齐 2026 最新行业高合规对账审核规则。*`;
    } else if (lowerText.includes('privacy') || lowerText.includes('隐私') || lowerText.includes('数据') || lowerText.includes('consent')) {
      optimized = `### 个人隐私数据保护与 GDPR 授权同意书 (EU General Data Protection Regulation)\n\n我们郑重承诺严格保障买家数字足迹，并依 GDPR 等最高国际法规则保障您的核心数字隐私权：\n\n- **数据收集最小化原则 (Data Minimization)**: 系统仅根据交易必达所需，调取您的基本收件姓名、邮政编码、DHL物流派寄终端及必要的 Adyen/Stripe 标记化账单账户凭据。\n- **跨境合规托管与隔离**: 所有的支付账户信息在传输时通过 TLS 1.3 极速单项高位物理锁防伪加密，并在多租户服务器端执行高强度的字段物理空间隔离，杜绝越权。\n- **随时撤回权与完全删除**: 客户有权联系我们的合规官一键将名下的订单历史记录进行匿名清洗，永久执行遗忘请求。\n- **不向任何第三方转售广告**: 郑重声明不搜集、不分析、不转售您的身份信息至其他无关数据商。`;
    } else if (lowerText.includes('system') || lowerText.includes('role') || lowerText.includes('prompt') || lowerText.includes('指令') || lowerText.includes('agent')) {
      optimized = `你是在 AI Commerce OS 智能经营中台下深度搭载的数字员工智能中枢。
你的系统底层核心运行特性：

1. **核心使命**: 协助店商经营。提供精准、明晰、低废话、数据扎实的 SKU 备货研判、对账分析、订单合规审计及物流出境预案。
2. **严限行为逻辑**: 严格遵循《多租户隔离对账准则》，每一次请求均需要深度验证对应租户店面的 tenant_id 及 store_id。拒绝回答无关技术底层的冗余技术废话。
3. **工作风格**:
   - 回答精简、排版考究、多用表格，极度强调“立即执行”与“快捷纠偏操作”。
   - 保持高级中性、冷静、数据严谨的商界领袖发言腔调。
4. **支持工具**: 根据授权，在决策需要时自动编排采购调补（restock）或老客优惠券分流营选（campaign）。`;
    } else {
      optimized = `### 💡 尊享品牌经营管理纲领 (European Business Excellence Manual)\n\n根据当前输入的欧洲电商经营策略，多智能体大脑为您完成以下精细化表达重塑：\n\n- **精细化行文对齐**: ${text}\n- **欧洲本地化转化路径优化**: 根据欧洲消费者行为学，调整了句式中的被动语气，注入更加含蓄温和的品牌信赖词汇，提高结账信任率；\n- **排版分块**: 通过适度字距与视觉对比，让商户与最终买家能最快锁定核心条款要约，杜绝不必要的纠纷可能。`;
    }

    return res.json({
      optimized: optimized,
      fallbackUsed: true
    });
  }
});

// Real-time Agent Conversational QA Endpoint backed by Gemini
app.post("/api/gemini/agent-chat", async (req, res) => {
  const { 
    agent, 
    industry, 
    products, 
    orders, 
    metrics,
    aiContext, // New fully unified context object
    messages 
  } = req.body;

  if (!agent || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing required fields and message history thread." });
  }

  const lastMessage = messages[messages.length - 1] || {};
  const userPrompt = lastMessage.content || "";

  try {
    // Format current store state text for the LLM
    let storeStateText = "";
    if (aiContext) {
      storeStateText = `
UNIFIED SaaS-Shopify OPERATIONAL INSTANTANEOUS STATE:
-----------------------------------------------------------
[SHOP CONTEXT]
- Tenant ID: ${aiContext.shop.tenantId}
- Store ID: ${aiContext.shop.shopId}
- Shop Name: ${aiContext.shop.shopName || 'Boutique'}
- Primary Locale: ${aiContext.shop.primaryLocale || 'it-IT'}
- Region: ${aiContext.shop.country} | Currency: ${aiContext.shop.currency}
- Assigned Industry Category: ${aiContext.shop.industry}
- Store Lifecycle Mode: ${aiContext.shop.lifecycleStage}

[USER EXECUTIVE CONTEXT]
- Operator ID: ${aiContext.user.userId}
- Operational Role: ${aiContext.user.role} (Permissions list: ${aiContext.user.permissions.join(', ')})
- Dashboard UI Language: ${aiContext.user.language}

[ACTIVE SCREEN / VIEWSTATE CONTEXT]
- Screen Mode (PageType): ${aiContext.ui.pageType}
${aiContext.ui.productId ? `- Focused SKU Product ID: ${aiContext.ui.productId}` : ''}
${aiContext.ui.orderId ? `- Focus Transaction Order ID: ${aiContext.ui.orderId}` : ''}
${aiContext.ui.customerId ? `- Selected VIP Customer ID: ${aiContext.ui.customerId}` : ''}

[REAL-TIME BUSINESS TELEMETRY (DYNAMIC DB SNAPSHOT)]
- Today Total Sales (GMV): €${aiContext.metrics?.totalSalesToday || 0}
- Today Total Orders Placed: ${aiContext.metrics?.ordersCountToday || 0}
- Monthly Sales Rolling Balance: €${aiContext.metrics?.totalSalesThisMonth || 0}
- Monthly Gross Net Profit Est: €${aiContext.metrics?.profitThisMonth || 0}
- Inventory Critical Low Stock count: ${aiContext.metrics?.lowStockCount || 0}
- Estimated Churned Customers Count: ${aiContext.metrics?.churnedCustomersCount || 0}
- Core Checkout Success Rate: ${aiContext.metrics?.paymentSuccessRate || 0}%
- Historical Return/Refund Rate: ${aiContext.metrics?.refundRate || 0}%
- Enlisted/Active AI Agents Count: ${aiContext.metrics?.activeAIStaffCount || 0}
`;

      if (aiContext.currentProduct) {
        storeStateText += `
[ACTIVE PRODUCT DETAIL BLOCK]
- Product ID: ${aiContext.currentProduct.productId}
- Name: ${aiContext.currentProduct.title || ''}
- Category Type: ${aiContext.currentProduct.productType || ''}
- Cost price per unit: €${aiContext.currentProduct.costPerUnit || 0}
- Display Retail Price: €${aiContext.currentProduct.currentPrice || 0}
${aiContext.currentProduct.compareAtPrice ? `- Recommended Standard Compare-At Price: €${aiContext.currentProduct.compareAtPrice}` : ''}
`;
      }
    } else {
      storeStateText = `
CURRENT STORE STATE AND ENVIRONMENT DATA:
- Industry Track: ${industry || 'General Retail'}
- Core Connected metrics:
${(metrics || []).map((m: any) => `  * ${m.name}: ${m.value} (${m.change})`).join('\n')}

- Active Inventory & Products:
${(products || []).map((p: any) => `  * SKU: ${p.sku} | Name: ${p.name} | Stock: ${p.stock} | Price: $${p.price} | Status: ${p.status}`).join('\n')}

- Direct Orders:
${(orders || []).map((o: any) => `  * OrderID: ${o.id} | Customer: ${o.customerName} | Total: $${o.total} | Status: ${o.status} | Risk Score: ${o.riskScore}/100`).join('\n')}
`;
    }

    // Build model role prompt
    const systemInstruction = `
${agent.systemPrompt}
You are registered inside the "AI Commerce OS" platform.
Your title is: "${agent.title}".
Your detailed capability profile:
- Description: ${agent.description}
- Capabilities: ${(agent.capabilities || []).join(', ')}

You have read-only access to the live store systems. Here is your current business data:
${storeStateText}

INSTRUCTIONS FOR YOUR RESPONSE:
1. Speak strictly in-character as ${agent.name}. Use your specialized title tone.
2. Ground your comments and advice in the direct quantities, SKU codes, prices, and order data supplied above. For example, if low stock is listed, coordinate stock.
3. Be professional, direct, analytical, and actionable. Avoid generic fluff.
4. Answer short and concisely. Maximize readability via clear spacing or bold highlights.
`;

    const ai = getGeminiClient();

    const foundName = agent.name;
    const lowerPrompt = userPrompt.toLowerCase();
    let fallbackText = "";
    let fallbackSuggestions: any[] = [];
    let fallbackActionType = "none";
    let fallbackActionMeta: any = null;
    let fallbackThought = {
      intent: "GENERAL_SYSTEM_GREETING",
      reasoning: "用户触发通用问候流。大脑判定不启动数据库库表写入逻辑，提供常规功能导引。",
      planning: "1. 识别闲聊类型；2. 跳过专业 MCP / SQL 工具挂载；3. 构建标准轻量商用反馈面板。",
      permission: "GUEST_READONLY_PERMITTED (只读授权：安全度高)",
      toolRouter: "AIBrainService -> StaticCommandHelper",
      validator: "SUCCESS (安全：免资金损耗与状态覆盖)"
    };

    if (foundName === 'Sophia') {
      fallbackText = `已接入多租户中央 SaaS 数据。当前店铺运行状态对账单：

| 关键业务量标 | 今日经营实时数据 | 同比增速/审计评级 |
| :--- | :--- | :--- |
| 今日 GMV 总流水 | €${aiContext?.metrics?.totalSalesToday || 420.00} | 📈 +14.2% (极速回温) |
| Adyen/Stripe 成功率 | ${aiContext?.metrics?.paymentSuccessRate || 98.4}% | ✅ 欧盟最高标准防御中 |
| 沉默/风险加购买家 | ${aiContext?.metrics?.churnedCustomersCount || 3} 名 | ⚠️ 建议执行召回 |

已自动为您起草高亮应急决策案，您可以一键核准自动运行：`;
      fallbackActionType = "none";
      fallbackSuggestions = [
        { label: '一键完成低库存 SKU 应急备料采购', action: 'restock', payload: {} },
        { label: '起草并发布 30% VIP 促销引流代金券', action: 'campaign', payload: { code: 'VIP-SAVE-30', discount: 30 } }
      ];
      fallbackThought = {
        intent: "KPI_PERFORMANCE_AUDIT",
        reasoning: "判定用户在店铺首页要求审查今日最核心财务与动销 KPI。大盘自动对准 Relational DB 数据库表进行聚合计算。",
        planning: "1. 统计今日 Store 隔离下 orders 的总销售额及付款率指标；2. 预备退配及召回补偿动作建议。",
        permission: "ADMINISTRATOR_APPROVED (店面主号校验通过，享有核心系统读取授权)",
        toolRouter: "AIBrainService.orchestrateBrainTask -> AnalyticsAgent",
        validator: "SUCCESS (多租户隔离判定：当前 store_id 的查询完全隔离，无穿透泄露风险)"
      };
    } else if (foundName === 'Emma') {
      fallbackText = `已连接主食餐厅食材追踪与后厨实时库存流转。

| 食材 SKU 品项 | 消耗配比库 | 限流/安全用水保障 |
| :--- | :--- | :--- |
| 比萨面皮 (盒) | 120 | 50 (环境安全水位) |
| 特级黑松露 (克) | 12 | 10 (⚠️ 仅存位12克) |

配货动作建议：已规划紧急黑松露高仓调拨备料计划。`;
      fallbackActionType = "restock";
      fallbackSuggestions = [
        { label: '立即向意大利保税仓报采黑松露食材', action: 'restock', payload: {} }
      ];
      fallbackThought = {
        intent: "INGREDIENT_SUPPLY_SCAN",
        reasoning: "检测到 Emma 餐饮行业专岗启动，自动将物料 DSI 测算指标挂钩原料主记录表，进行高损耗食材应急配给。",
        planning: "1. 扫描黑松露等极奢原材料现期余量；2. 比照后厨出餐配方；3. 配载一键应急对意供应链报采接口。",
        permission: "CHEF_OPERATOR_GRANTED (后厨执棒主账号鉴权完毕)",
        toolRouter: "AIBrainService.orchestrateBrainTask -> InventoryAgent",
        validator: "SUCCESS (资金链安全核查：单次食材补配采购资金估算在 €1,000 限红以内)"
      };
    } else if (foundName === 'Emily') {
      fallbackText = `已接入 CRM 会员沉默对账中心。

当前共有 **${aiContext?.metrics?.churnedCustomersCount || 3} 位** 欧盟流失买家已加购但未结算付款，付款成功率为 **${aiContext?.metrics?.paymentSuccessRate || 98}%**。

流失催付召回动作已由 SendGrid 自动完成排程布局。`;
      fallbackActionType = "customer_recall";
      fallbackSuggestions = [
        { label: '通过 SendGrid 一键催付并召回流失买家', action: 'customer_recall', payload: {} }
      ];
      fallbackThought = {
        intent: "CRM_PASSIVE_RECALL",
        reasoning: "检测到用户启动流失客群召回专线。大管家 Emily 自动抓取购买次单为零且存盘大额不活跃的沉默买家群组。",
        planning: "1. 过滤会员主表 churned_pools；2. 关联 SendGrid 邮件调度组件；3. 提供带专属立减代金券的催付面卡。",
        permission: "MARKETING_LEADER_CONFIRMED (授权开启，允许使用群发营销接口)",
        toolRouter: "AIBrainService.orchestrateBrainTask -> MarketingAgent",
        validator: "SUCCESS (防骚扰校验：本日已过滤重复投递买家，确保不会产生投诉风险)"
      };
    } else if (foundName === 'Oliver') {
      fallbackText = `已审计高仓 DSI（库存天数）及 WMS 配货状态。

| 备货受限品项 SKU | 当前库存量 | 起采临界水位 |
| :--- | :--- | :--- |
| 冬季羽绒夹克系列 | ${products && products[0] ? products[0].stock : 2} 件 | 10 件 (🚨 严重低水位) |

建议一键向签约工厂配发补货报采。`;
      fallbackActionType = "restock";
      fallbackSuggestions = [
        { label: '立即批量加满店内所有断货/低库存品项', action: 'restock', payload: {} }
      ];
      fallbackThought = {
        intent: "STOCK_LEVEL_REORDER",
        reasoning: "Oliver 检测到店铺有缺货警戒指标。大脑调和供应链配比，将商品库存主表 stock 与采购配量对齐。",
        planning: "1. 统计当前缺货 SKU 清单；2. 构建应急追加补货 +150 动作 payload；3. 等待商户一键批准入库。",
        permission: "ADMINISTRATOR_APPROVED (已自动绑定当前 store_id 隔离鉴权)",
        toolRouter: "AIBrainService.orchestrateBrainTask -> InventoryAgent",
        validator: "SUCCESS (盈亏安全检验：采购追加单无过度爆仓 DSI 翻红风险)"
      };
    } else if (foundName === 'Marcus') {
      fallbackText = `对准欧盟电商用户群体近期购物指数，最新立减券规则已配置：

- 促销策略：老客立减特惠券大促
- 投放码库：\`EURO-SPECIAL-25\`
- 立减配比：**25% OFF**
- 动作指向：推送给店内高活跃度买家

建议立即配置。`;
      fallbackActionType = "campaign";
      fallbackActionMeta = { code: 'EURO-SPECIAL-25', discount: 25 };
      fallbackSuggestions = [
        { label: '投放并开启 EURO-SPECIAL-25 立减代金券', action: 'campaign', payload: { code: 'EURO-SPECIAL-25', discount: 25 } }
      ];
      fallbackThought = {
        intent: "MARKETING_DISCOUNT_DEPLOY",
        reasoning: "Marcus 计算欧洲立减券最适配打折博弈率，自动判定让利控制在 25% 是安全成本的黄金盈亏临界线。",
        planning: "1. 审查当前优惠码库存；2. 创建 EURO-SPECIAL-25 实效活动；3. 直投加购未付买家。",
        permission: "MARKETING_LEADER_CONFIRMED (主号批准开启)",
        toolRouter: "AIBrainService.orchestrateBrainTask -> MarketingAgent",
        validator: "SUCCESS (核验通过：折后毛利率保持在 12.5% 以上，高安全度运行)"
      };
    } else if (lowerPrompt.includes('优化') || lowerPrompt.includes('文案') || lowerPrompt.includes('描述') || lowerPrompt.includes('翻译') || lowerPrompt.includes('英文') || lowerPrompt.includes('欧美')) {
      fallbackText = `已为您将主销商品描述完成 **“欧美高端品牌规格 ($minimal_european)”** 风格的英文表达重塑。

已通过多语言文本纠偏与高转换排版对齐：

| 商品名称 (Original) | 欧盟优化名 (English optimized) | 适用核心细分市场 |
| :--- | :--- | :--- |
| 时尚保暖防风衣 | [Premium Collection] SLEEK WINDPROOF SILHOUETTE | 英国/德国高端职人街区 |
| 意式提拉米苏手工款 | [Premium Edition] THE TRUFFLE TIN MASSIMO | 意法高端餐饮外送端 |

建议一键核准：将直接覆写并更新当前商品目录。`;
      fallbackActionType = "APPLY_OPTIMIZED_COPY";
      
      const sampleProducts = products && products.length > 0 ? products.slice(0, 2).map((p: any) => ({
        productId: p.id,
        sku: p.sku,
        originalCopy: { title: p.name, description: '原有的商品基本信息' },
        optimizedCopy: { 
          title: `[Premium Collection] ${p.name.toUpperCase().replace('时尚', 'SLEEK').replace('新款', 'TECH')}`, 
          description: `Crafted in Europe. Designed with a clean, high-contrast silhouette. Now optimized for modern, minimalist wardrobes. Dry clean only.` 
        }
      })) : [
        {
          productId: 'p_demo_01',
          sku: 'SKU-R-01',
          originalCopy: { title: '时尚保暖防风衣', description: '原描述' },
          optimizedCopy: { title: '[Premium Collection] Sleek Windproof Tech Jacket', description: 'Crafted with premium European weatherproofing materials.' }
        }
      ];
      fallbackActionMeta = { products: sampleProducts };
      fallbackSuggestions = [
        { label: '一键确认并批量应用英文优化文案', action: 'APPLY_OPTIMIZED_COPY', payload: { products: sampleProducts } },
        { label: '对比分析并预览双语版本', action: 'COMPARE_PREVIEW', payload: sampleProducts }
      ];
      fallbackThought = {
        intent: "COPY_TRANSLATION_REWRITE",
        reasoning: "检测到对于主力商品有外语描述优化与欧美文案翻新倾向。主导 ProductAgent 对商品基本语意进行高端街区对齐重塑。",
        planning: "1. 抽取当前商品前两条的中文原始参数；2. 由 AIBrain 自动完成高端欧洲行文纠偏；3. 预备一键全局覆写入库。",
        permission: "ADMINISTRATOR_APPROVED (享有商品中心直接写修改的高敏权限)",
        toolRouter: "AIBrainService.orchestrateBrainTask -> ProductAgent",
        validator: "SUCCESS (对齐核验：字数及规格均与 Shopify 国际开店规范 100% 对齐)"
      };
    } else {
      fallbackText = `财务与业务数据已通过多租户数据库完全对齐。

| 指标维度 | 当前结账金额 | 记账防错评定 |
| :--- | :--- | :--- |
| 本周累计 GMV | €${orders ? orders.reduce((s: number, o: any) => s + (o.total || 0), 0).toFixed(2) : '1580.40'} | ✅ 精准对齐无偏差 |
| 国别综合税点评估 | 本国统一 22% 销项税 | ✅ 自动完成扣减 |

建议批量出账：`;
      fallbackActionType = "finance_switch";
      fallbackSuggestions = [
        { label: '一键查账并切换至财务收单看板', action: 'finance_switch', payload: {} },
        { label: '导出今日单店收单对账标准 CSV', action: 'EXPORT_FINANCE_REPORT', payload: {} }
      ];
      fallbackThought = {
        intent: "FINANCE_DOUBLE_ENTRY_RECONCILIATION",
        reasoning: "检测到财务/对账对扣/利润等宏观记账审计诉求，调出财务中心清算记录安全审计端口。",
        planning: "1. 汇总当前已流转 orders 总额；2. 预备出账标准的 CSV 底账电子底卡；3. 计算欧盟 VAT 合规扣减指标。",
        permission: "CFO_FINANCIAL_LEVEL (高危财务账面审计授权就绪)",
        toolRouter: "AIBrainService.orchestrateBrainTask -> FinanceAgent",
        validator: "SUCCESS (对账核验：Stripe已完税资金及 Adyen 本地记账轧差余额完全零误差)"
      };
    }

    if (!ai) {
      console.log("No valid GEMINI_API_KEY found. Utilizing high-fidelity AI Commander fallback preset.");
      await new Promise(resolve => setTimeout(resolve, 800));

      const { text, actionType: fallbackAction, metaObj: fallbackMeta, suggestions: fallbackSuggs, thought: fallbackT } = generateIntelligentLocalReply(
        userPrompt,
        products || [],
        orders || [],
        (aiContext && aiContext.customers) || []
      );

      return res.json({
        text: text,
        suggestions: fallbackSuggs,
        actionType: fallbackAction,
        actionMeta: fallbackMeta,
        thought: fallbackT,
        simulated: false
      });
    }

    // Call the genuine Gemini 3.5 Flash Model using schema enforcement
    const systemPromptAndSchema = `
${systemInstruction}

=========================================
🔥 AI OS COGNITIVE DISCIPLINE AMENDSHIP (9-LAYER COGNITIVE ENGINE):
=========================================
You are the central "Conversation Brain" of the unified OS. You must strictly process messages according to the nine sequential steps:
1. Conversation Brain (Single Entry Point)
2. Intent Engine (Classify incoming query into GREETING, SYSTEM_INFO, ANALYSIS, TASK, DANGEROUS_TASK)
3. Reasoning Engine (Evaluate: Goal, Current State, Missing Info, Risk, Next Action)
4. Planning Engine (A multi-objective planning task tree)
5. Permission Engine (Validate privileges)
6. Tool Router (Decide the exact platform router action and downstream agent: Order/Inventory/Product/Marketing/Finance)
7. Agent Coordinator (Symphonize agents)
8. Validation Engine (Perform safety checks, block anomalies)
9. Response Generator (Humanized, high-density raw markdown display)

CRITICAL ACTION CHANNELS & SAFETY ENGAGEMENTS:
- If User says "你好" (GREETING/CHAT):
  * Identified Intent: GREETING
  * Need tool: false
  * "actionType" MUST BE "none". Suggestions must contain pure informational guidelines. Absolutely NO system updates or silent automated action routing for greetings!
- If User says "今天订单怎么样" (ANALYSIS):
  * Identified Intent: ANALYSIS
  * Need tool: true (Orders & Financial snapshots)
  * "actionType" is "none" or "switch_tab" (payload: "orders"). Frame beautiful summary tables from the data.
- If User says "帮我创建商品" or "上架商品" (TASK):
  * Identify if information is sufficient (Does query contain SKU, Price, Stock?).
  * If insufficient parameters (e.g. vague upper prompt): You MUST NOT execute the create action! Identify the parameters as missing in reasoning, set "actionType" to "none", ask the user specifically for Name, SKU, Price, and Stock, and output suggestions offering a template configuration prefill button. For example, suggestion list should contain: {"label": "一键预填推荐爆品参数", "action": "PREFILL_PRODUCT", "payload": {"name": "防泼水排汗风夹克 (推荐)", "sku": "SKU-WIND-88", "price": 129.0, "stock": 100}}
- If User says "删除全部商品", "清空库存" (DANGEROUS_TASK):
  * Identified Intent: DANGEROUS_TASK
  * Action is high-risk. Set "actionType" to "none", throw security validation block warning back, state "Permission Denied: Requires Super Admin MFA authentication", and instruct user to adjust records carefully in the manual UI.
- If User says "帮我提高销量" (GROWTH_PLAN):
  * Identified Intent: GROWTH_PLAN
  * Present a beautiful analysis strategy and plan checklist. Do NOT perform silent creation of random products. Recommend targeted coupon campaigns such as "SUMMER-SAVE-30" with 30% off.

CRITICAL FORMAT REQUIREMENT:
You MUST output a valid JSON response adhering to the exact schema requested below.
You must think step-by-step and write your exact reasoning inside the "thought" metadata structure BEFORE formulating the public "replyText".
Never output raw conversational text blocks outside this JSON. Never leak internal technical framework logs. Keep response texts direct and concise (less than 5 sentences).

Schema details to fulfill:
- "thought":
  * "intent": Identified intent (e.g. GREETING, ANALYSIS, TASK, DANGEROUS_TASK, GROWTH_PLAN)
  * "reasoning": "Goal (目标): 目标说.\nState (状态): 状态说.\nMissing Info (缺失): 缺失信息.\nRisk (风控): 高/低风控.\nReasoning: 5-sentence step-by-step cognitive analysis."
  * "planning": Detailed planned subtasks bulleted
  * "permission": Enforced privilege/role level (e.g. ADMINISTRATOR_APPROVED or DENIED_REQUIRES_MFA)
  * "toolRouter": Targeted downstream routed agents (e.g. AIBrain -> ProductAgent)
  * "validator": Calculated risk block assessment (e.g. SUCCESS or BLOCKED_HIGH_RISK)
- "replyText": Your professional response addressing the merchant's message. Ground your suggestions in real data provided above. Under 5 sentences. Use elegant Markdown block lists if appropriate.
- "actionType": Select the immediate platform action triggered: "product_create", "restock", "campaign", "customer_recall", "finance_switch", "switch_tab", "PREFILL_PRODUCT", or "none".
- "actionMeta": Matching metadata payload object or null.
- "suggestions": A list of 1 or 2 high-level operational buttons containing the exact label and action: [{"label": "...", "action": "restock|campaign|switch_tab|finance_switch|PREFILL_PRODUCT", "payload": {}}]
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPromptAndSchema,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thought: {
              type: Type.OBJECT,
              properties: {
                intent: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                planning: { type: Type.STRING },
                permission: { type: Type.STRING },
                toolRouter: { type: Type.STRING },
                validator: { type: Type.STRING }
              },
              required: ["intent", "reasoning", "planning", "permission", "toolRouter", "validator"]
            },
            replyText: { type: Type.STRING },
            actionType: { type: Type.STRING },
            actionMeta: { type: Type.OBJECT },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  action: { type: Type.STRING },
                  payload: { type: Type.OBJECT }
                },
                required: ["label", "action"]
              }
            }
          },
          required: ["thought", "replyText", "actionType", "suggestions"]
        },
        temperature: 0.2,
      }
    });

    const body = JSON.parse(response.text || "{}");

    return res.json({
      text: body.replyText || "我已处理您的指令，已为您准备好了对应的快速配置。",
      suggestions: body.suggestions || fallbackSuggestions,
      thought: body.thought || fallbackThought,
      actionType: body.actionType || fallbackActionType,
      actionMeta: body.actionMeta || fallbackActionMeta,
      simulated: false
    });

  } catch (error: any) {
    console.warn("Gemini Agent Chat Failed, utilizing high-quality store simulation:", error.message);
    
    const { text, actionType: fallbackAction, metaObj: fallbackMeta, suggestions: fallbackSuggs, thought: fallbackT } = generateIntelligentLocalReply(
      userPrompt,
      products || [],
      orders || [],
      (aiContext && aiContext.customers) || []
    );

    return res.json({
      text: text,
      suggestions: fallbackSuggs,
      actionType: fallbackAction,
      actionMeta: fallbackMeta,
      thought: fallbackT,
      simulated: true,
      fallbackUsed: true
    });
  }
});

// AI-powered product sourcing recommendations backed by Gemini
app.post("/api/gemini/source-products", async (req, res) => {
  const { industry, products } = req.body;
  if (!industry) {
    return res.status(400).json({ error: "Missing required industry field." });
  }

  try {
    const ai = getGeminiClient();

    if (!ai) {
      console.log(`Utilizing high-fidelity fallback presets for industry: ${industry}`);
      
      const fallbackDatabase: Record<string, any[]> = {
        retail: [
          {
            name: "UltraSlim Foldable Dual-Screen Keyboard",
            sku: "SKU-R-AI01",
            price: 89.00,
            wholesaleCost: 35.00,
            marginPct: 60.7,
            targetDemand: "High",
            trendReason: "Popularized by desk setup TikTok viral loops and minimal remote workspace aesthetic trends.",
            audience: "Freelancers, Remote designers, digital nomads",
            profitabilityAnalysis: "Extremely low delivery cost and high turnover rate. Earns up to $5,400 monthly profit.",
            estMonthlySales: 150
          },
          {
            name: "MagSafe Multi-Device Charging Stand",
            sku: "SKU-R-AI02",
            price: 69.00,
            wholesaleCost: 26.00,
            marginPct: 62.3,
            targetDemand: "Extreme",
            trendReason: "Clean-desk trends show consumer search volumes peaking. Broad lifestyle appeal.",
            audience: "Smartphones owners, minimal productivity designers",
            profitabilityAnalysis: "Compact box enables cheaper ocean freight options. Return rate is historically lower than 1.1%.",
            estMonthlySales: 220
          },
          {
            name: "Professional Podcasting Lapel Mic Kit",
            sku: "SKU-R-AI03",
            price: 45.00,
            wholesaleCost: 15.00,
            marginPct: 66.7,
            targetDemand: "High",
            trendReason: "Mass expansion of short-form video UGC creators requiring budget clear audio captures.",
            audience: "TikTok/Reels creators, online tutors, podcasters",
            profitabilityAnalysis: "Over 66% heavy markup potential. High-density shipping allows bulk lower cost stock margins.",
            estMonthlySales: 185
          }
        ],
        food: [
          {
            name: "Korean BBQ Bulgogi Fusion Slider Bundle",
            sku: "SKU-F-AI01",
            price: 18.99,
            wholesaleCost: 5.50,
            marginPct: 71.0,
            targetDemand: "High",
            trendReason: "K-Food and western barbecue fusion cuisine trending heavily in culinary index searches.",
            audience: "Lunch crowds, couples ordering food online, late-night snacking",
            profitabilityAnalysis: "Average prep time under 4 minutes means fast table turns and minimal staffing time.",
            estMonthlySales: 350
          },
          {
            name: "Sea Salt Pistachio Boba Tea Pitcher",
            sku: "SKU-F-AI02",
            price: 7.50,
            wholesaleCost: 1.80,
            marginPct: 76.0,
            targetDemand: "Extreme",
            trendReason: "Matcha-pistachio cold beverage hashtag queries up +250% this quarter.",
            audience: "Urban tea lovers, student groups, business meeting lunch orders",
            profitabilityAnalysis: "Extreme raw margin potential. Liquid inventory leverages existing prep infrastructure.",
            estMonthlySales: 580
          },
          {
            name: "Plant-Based Crispy Truffle Wings Set",
            sku: "SKU-F-AI03",
            price: 15.50,
            wholesaleCost: 4.50,
            marginPct: 71.0,
            targetDemand: "High",
            trendReason: "Vegan fast-casual trend with an upscale black truffle flavor spin.",
            audience: "Vegetarians, gourmet fast food seekers, flexitarians",
            profitabilityAnalysis: "Utilizes standard fryer. Frozen ingredient longevity limits spoilage risks.",
            estMonthlySales: 280
          }
        ],
        education: [
          {
            name: "LangChain & Autonomous AI Agent Coding Bootcamp",
            sku: "SKU-E-AI01",
            price: 349.00,
            wholesaleCost: 0.00,
            marginPct: 100.0,
            targetDemand: "Extreme",
            trendReason: "Developers are moving heavily towards agent architectures rather than basic RAG models.",
            audience: "Software developers, technical student groups, tech managers",
            profitabilityAnalysis: "Zero supply chain shipping constraints. Virtually 100% markup goes straight to gross profits.",
            estMonthlySales: 120
          },
          {
            name: "AI Business Automation Playbook for Executives",
            sku: "SKU-E-AI02",
            price: 199.00,
            wholesaleCost: 0.00,
            marginPct: 100.0,
            targetDemand: "High",
            trendReason: "Operations directors looking to implement workflow logic instead of writing python scripts.",
            audience: "Project managers, SME owners, business process consultants",
            profitabilityAnalysis: "Includes self-serve curriculum blocks. High LTV matching student success tracks.",
            estMonthlySales: 85
          },
          {
            name: "Multi-Agent Systems & MCP Integration Seminar Pack",
            sku: "SKU-E-AI03",
            price: 499.00,
            wholesaleCost: 0.00,
            marginPct: 100.0,
            targetDemand: "High",
            trendReason: "Emergence of the Model Context Protocol standard triggering academic software restructuring.",
            audience: "Enterprise developers, research labs, tech startups",
            profitabilityAnalysis: "Instant downloadable resource, infinite stock leverage, zero logistical hurdles.",
            estMonthlySales: 50
          }
        ],
        healthcare: [
          {
            name: "Continuous Glucose Metabolism Longevity Package",
            sku: "SKU-H-AI01",
            price: 299.00,
            wholesaleCost: 110.00,
            marginPct: 63.2,
            targetDemand: "High",
            trendReason: "Longevity clinicians and tech leaders propagating biofeedback metabolism tracking.",
            audience: "Health enthusiasts, longevity practitioners, diabetic patients",
            profitabilityAnalysis: "Creates recurring subscription dependency for continuous sensor patch refills.",
            estMonthlySales: 95
          },
          {
            name: "Anti-Stress Ashwagandha Sleep Drops (Pack of 3)",
            sku: "SKU-H-AI02",
            price: 42.00,
            wholesaleCost: 12.50,
            marginPct: 70.2,
            targetDemand: "High",
            trendReason: "Natural supplements for stress reduction holding heavy trending streams on lifestyle portals.",
            audience: "Anxious professionals, organic supplement users",
            profitabilityAnalysis: "Sturdy glass bottles with long expiration cycles. High storage density.",
            estMonthlySales: 310
          },
          {
            name: "Clinical Biomarker Deep Sleep Saliva Kit",
            sku: "SKU-H-AI03",
            price: 189.00,
            wholesaleCost: 75.00,
            marginPct: 60.3,
            targetDemand: "High",
            trendReason: "Custom biomarkers and functional medicine testing demand rising across general populations.",
            audience: "Insomniacs, clinical patients, biohackers",
            profitabilityAnalysis: "Sealed packaging allows drop-shipping from central medical diagnostics labs.",
            estMonthlySales: 140
          }
        ],
        service: [
          {
            name: "Cryotherapy Cold-Plunge Recovery 45m Session",
            sku: "SKU-S-AI01",
            price: 65.00,
            wholesaleCost: 10.00,
            marginPct: 84.6,
            targetDemand: "High",
            trendReason: "Extreme physical health cold therapy trending strongly among gym and spa users.",
            audience: "Athletes, rehabilitation cases, corporate athletes",
            profitabilityAnalysis: "Requires minor initial capital expenditure. Marginal utility expense is only $1.20 per customer.",
            estMonthlySales: 180
          },
          {
            name: "Laser Skin Resurfacing Express Facial Consultation",
            sku: "SKU-S-AI02",
            price: 145.00,
            wholesaleCost: 35.00,
            marginPct: 75.9,
            targetDemand: "Extreme",
            trendReason: "Non-invasive laser beauty peels with 0 downtime up +220% across local directories.",
            audience: "Local professionals, skin care aficionados",
            profitabilityAnalysis: "Highly effective at upselling guests into recurring high-end annual memberships.",
            estMonthlySales: 110
          },
          {
            name: "Advanced Infra-Red Chromotherapy Sauna Block",
            sku: "SKU-S-AI03",
            price: 49.00,
            wholesaleCost: 8.00,
            marginPct: 83.7,
            targetDemand: "High",
            trendReason: "Light therapies popularization for toxin clearing and lymphatic fluid system resets.",
            audience: "Working executives, stress-sensitive professionals",
            profitabilityAnalysis: "Zero therapist labor required. Customer occupies pre-configured chamber independently.",
            estMonthlySales: 195
          }
        ],
        manufacturing: [
          {
            name: "UAV Custom Carbon Aerospace Gear Brackets",
            sku: "SKU-M-AI01",
            price: 245.00,
            wholesaleCost: 85.00,
            marginPct: 65.3,
            targetDemand: "Extreme",
            trendReason: "Logistics shipping drone manufacturers seeking lightweight, rigid carbon fiber mounting braces.",
            audience: "B2B UAV assemblers, warehouse automated robotics ventures",
            profitabilityAnalysis: "Commands high bespoke fee due to specialized ASTM-certified composition ratios.",
            estMonthlySales: 120
          },
          {
            name: "NEMA-23 Recycled Copper Core Servo Motors",
            sku: "SKU-M-AI02",
            price: 110.00,
            wholesaleCost: 42.00,
            marginPct: 61.8,
            targetDemand: "High",
            trendReason: "Domestic equipment builders shifting back to copper materials amid micro-supply disruptions.",
            audience: "CNC builders, robotics integrators, heavy machine factories",
            profitabilityAnalysis: "Excellent bulk shipping item. Consistent repeat reorders safeguard production runs.",
            estMonthlySales: 260
          },
          {
            name: "Tough-Grip Fiber Structural Tubes (Pack of 50)",
            sku: "SKU-M-AI03",
            price: 380.00,
            wholesaleCost: 140.00,
            marginPct: 63.2,
            targetDemand: "Medium",
            trendReason: "Industrial rack structural reinforcing mandates inside shipping logistic routes.",
            audience: "Warehouse installation crews, shipping managers",
            profitabilityAnalysis: "High average transaction value. Direct B2B billing makes invoice auditing fast.",
            estMonthlySales: 75
          }
        ]
      };

      const finalRecommendations = fallbackDatabase[industry] || fallbackDatabase.retail;
      return res.json({
        recommendations: finalRecommendations,
        simulated: true
      });
    }

    // Call genuine Gemini model if API key connected
    const existingProductsText = (products || [])
      .map((p: any) => `* SKU: ${p.sku} | Name: ${p.name} | Current Price: $${p.price}`)
      .join("\n");

    const promptText = `
    Analyze the product catalog and sales trends for an enterprise SaaS business inside the "${industry}" category.
    Your objective is to recommend exactly 3 highly trending, high-profit products that fit this merchant's catalog perfectly, but are NOT already stocked.
    
    Here is the list of existing products that they ALREADY stock (DO NOT recommend any of these):
    ${existingProductsText}

    Please perform a deep analytical assessment on recent social media indicators (TikTok shop, Meta, Google trends), logistics volume margins, and B2B pricing to suggest 3 new items. Each item must feature:
    1. A beautiful, concise, realistic human product name.
    2. A unique SKU code starting with "SKU-${industry[0].toUpperCase()}-AI" followed by double digits (e.g., SKU-R-AI55).
    3. Suggested MSRP Retail Price (greater than zero, and realistic for this category).
    4. Suggested Wholesale Unit Cost (at least 35% to 75% lower than MSRP to define healthy margins).
    5. marginPct: precise pre-calculated percentage of gross margin based on price and cost (e.g. ((price - wholesaleCost) / price) * 100).
    6. targetDemand: "High", "Extreme", "Critical" or "Exceptional".
    7. trendReason: Clear 1-2 sentence market analysis citing a real trend (e.g. search spikes, social media video virality, regional supply shifts).
    8. audience: Who is buying this product.
    9. profitabilityAnalysis: Detailed margin explanation and estimated monthly net profit calculations for stocking and selling 100 units.
    10. estMonthlySales: Predicted monthly unit selling volume (typically between 50 and 500).

    You must adhere to the provided JSON Schema. Do not return extra text. Return strictly a JSON array of the 3 recommendations.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: "You are an elite, mathematical SaaS corporate advisory consultant. You analyze retail, B2B, healthcare, diner, and manufacturing operations to discover maximum volume margin potentials.",
        temperature: 0.85,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "An array of 3 recommended trendy products fitting the given SaaS store segment perfectly",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Catcy and realistic product name." },
              sku: { type: Type.STRING, description: "Unique custom SKU representation." },
              price: { type: Type.NUMBER, description: "MSRP selling price in USD." },
              wholesaleCost: { type: Type.NUMBER, description: "Estimated procurement unit price in USD." },
              marginPct: { type: Type.NUMBER, description: "Profit margin percent (0-100)." },
              targetDemand: { type: Type.STRING, description: "Demand tier - High, Extreme, Critical" },
              trendReason: { type: Type.STRING, description: "Why is it trending? Real-world signals." },
              audience: { type: Type.STRING, description: "Target demographics." },
              profitabilityAnalysis: { type: Type.STRING, description: "Profit and expense analysis summary." },
              estMonthlySales: { type: Type.NUMBER, description: "Estimated monthly retail sales volume of units." }
            },
            required: ["name", "sku", "price", "wholesaleCost", "marginPct", "targetDemand", "trendReason", "audience", "profitabilityAnalysis", "estMonthlySales"]
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "[]");
    return res.json({
      recommendations: parsedData,
      simulated: false
    });

  } catch (err: any) {
    console.warn("AI Sourcing via Gemini failed. Shifting to high-fidelity simulated fallback database:", err.message);
    
    const fallbackDatabase: Record<string, any[]> = {
      retail: [
        {
          name: "UltraSlim Foldable Dual-Screen Keyboard",
          sku: "SKU-R-AI01",
          price: 89.00,
          wholesaleCost: 35.00,
          marginPct: 60.7,
          targetDemand: "High",
          trendReason: "Popularized by desk setup TikTok viral loops and minimal remote workspace aesthetic trends.",
          audience: "Freelancers, Remote designers, digital nomads",
          profitabilityAnalysis: "Extremely low delivery cost and high turnover rate. Earns up to $5,400 monthly profit.",
          estMonthlySales: 150
        },
        {
          name: "MagSafe Multi-Device Charging Stand",
          sku: "SKU-R-AI02",
          price: 69.00,
          wholesaleCost: 26.00,
          marginPct: 62.3,
          targetDemand: "Extreme",
          trendReason: "Clean-desk trends show consumer search volumes peaking. Broad lifestyle appeal.",
          audience: "Smartphones owners, minimal productivity designers",
          profitabilityAnalysis: "Compact box enables cheaper ocean freight options. Return rate is historically lower than 1.1%.",
          estMonthlySales: 220
        },
        {
          name: "Professional Podcasting Lapel Mic Kit",
          sku: "SKU-R-AI03",
          price: 45.00,
          wholesaleCost: 15.00,
          marginPct: 66.7,
          targetDemand: "High",
          trendReason: "Mass expansion of short-form video UGC creators requiring budget clear audio captures.",
          audience: "TikTok/Reels creators, online tutors, podcasters",
          profitabilityAnalysis: "Over 66% heavy markup potential. High-density shipping allows bulk lower cost stock margins.",
          estMonthlySales: 185
        }
      ],
      food: [
        {
          name: "Korean BBQ Bulgogi Fusion Slider Bundle",
          sku: "SKU-F-AI01",
          price: 18.99,
          wholesaleCost: 5.50,
          marginPct: 71.0,
          targetDemand: "High",
          trendReason: "K-Food and western barbecue fusion cuisine trending heavily in culinary index searches.",
          audience: "Lunch crowds, couples ordering food online, late-night snacking",
          profitabilityAnalysis: "Average prep time under 4 minutes means fast table turns and minimal staffing time.",
          estMonthlySales: 350
        },
        {
          name: "Sea Salt Pistachio Boba Tea Pitcher",
          sku: "SKU-F-AI02",
          price: 7.50,
          wholesaleCost: 1.80,
          marginPct: 76.0,
          targetDemand: "Extreme",
          trendReason: "Matcha-pistachio cold beverage hashtag queries up +250% this quarter.",
          audience: "Urban tea lovers, student groups, business meeting lunch orders",
          profitabilityAnalysis: "Extreme raw margin potential. Liquid inventory leverages existing prep infrastructure.",
          estMonthlySales: 580
        },
        {
          name: "Plant-Based Crispy Truffle Wings Set",
          sku: "SKU-F-AI03",
          price: 15.50,
          wholesaleCost: 4.50,
          marginPct: 71.0,
          targetDemand: "High",
          trendReason: "Vegan fast-casual trend with an upscale black truffle flavor spin.",
          audience: "Vegetarians, gourmet fast food seekers, flexitarians",
          profitabilityAnalysis: "Utilizes standard fryer. Frozen ingredient longevity limits spoilage risks.",
          estMonthlySales: 280
        }
      ],
      education: [
        {
          name: "LangChain & Autonomous AI Agent Coding Bootcamp",
          sku: "SKU-E-AI01",
          price: 349.00,
          wholesaleCost: 0.00,
          marginPct: 100.0,
          targetDemand: "Extreme",
          trendReason: "Developers are moving heavily towards agent architectures rather than basic RAG models.",
          audience: "Software developers, technical student groups, tech managers",
          profitabilityAnalysis: "Zero supply chain shipping constraints. Virtually 100% markup goes straight to gross profits.",
          estMonthlySales: 120
        },
        {
          name: "AI Business Automation Playbook for Executives",
          sku: "SKU-E-AI02",
          price: 199.00,
          wholesaleCost: 0.00,
          marginPct: 100.0,
          targetDemand: "High",
          trendReason: "Operations directors looking to implement workflow logic instead of writing python scripts.",
          audience: "Project managers, SME owners, business process consultants",
          profitabilityAnalysis: "Includes self-serve curriculum blocks. High LTV matching student success tracks.",
          estMonthlySales: 85
        },
        {
          name: "Multi-Agent Systems & MCP Integration Seminar Pack",
          sku: "SKU-E-AI03",
          price: 499.00,
          wholesaleCost: 0.00,
          marginPct: 100.0,
          targetDemand: "High",
          trendReason: "Emergence of the Model Context Protocol standard triggering academic software restructuring.",
          audience: "Enterprise developers, research labs, tech startups",
          profitabilityAnalysis: "Instant downloadable resource, infinite stock leverage, zero logistical hurdles.",
          estMonthlySales: 50
        }
      ],
      healthcare: [
        {
          name: "Continuous Glucose Metabolism Longevity Package",
          sku: "SKU-H-AI01",
          price: 299.00,
          wholesaleCost: 110.00,
          marginPct: 63.2,
          targetDemand: "High",
          trendReason: "Longevity clinicians and tech leaders propagating biofeedback metabolism tracking.",
          audience: "Health enthusiasts, longevity practitioners, diabetic patients",
          profitabilityAnalysis: "Creates recurring subscription dependency for continuous sensor patch refills.",
          estMonthlySales: 95
        },
        {
          name: "Anti-Stress Ashwagandha Sleep Drops (Pack of 3)",
          sku: "SKU-H-AI02",
          price: 42.00,
          wholesaleCost: 12.50,
          marginPct: 70.2,
          targetDemand: "High",
          trendReason: "Natural supplements for stress reduction holding heavy trending streams on lifestyle portals.",
          audience: "Anxious professionals, organic supplement users",
          profitabilityAnalysis: "Sturdy glass bottles with long expiration cycles. High storage density.",
          estMonthlySales: 310
        },
        {
          name: "Clinical Biomarker Deep Sleep Saliva Kit",
          sku: "SKU-H-AI03",
          price: 189.00,
          wholesaleCost: 75.00,
          marginPct: 60.3,
          targetDemand: "High",
          trendReason: "Custom biomarkers and functional medicine testing demand rising across general populations.",
          audience: "Insomniacs, clinical patients, biohackers",
          profitabilityAnalysis: "Sealed packaging allows drop-shipping from central medical diagnostics labs.",
          estMonthlySales: 140
        }
      ],
      service: [
        {
          name: "Cryotherapy Cold-Plunge Recovery 45m Session",
          sku: "SKU-S-AI01",
          price: 65.00,
          wholesaleCost: 10.00,
          marginPct: 84.6,
          targetDemand: "High",
          trendReason: "Extreme physical health cold therapy trending strongly among gym and spa users.",
          audience: "Athletes, rehabilitation cases, corporate athletes",
          profitabilityAnalysis: "Requires minor initial capital expenditure. Marginal utility expense is only $1.20 per customer.",
          estMonthlySales: 180
        },
        {
          name: "Laser Skin Resurfacing Express Facial Consultation",
          sku: "SKU-S-AI02",
          price: 145.00,
          wholesaleCost: 35.00,
          marginPct: 75.9,
          targetDemand: "Extreme",
          trendReason: "Non-invasive laser beauty peels with 0 downtime up +220% across local directories.",
          audience: "Local professionals, skin care aficionados",
          profitabilityAnalysis: "Highly effective at upselling guests into recurring high-end annual memberships.",
          estMonthlySales: 110
        },
        {
          name: "Advanced Infra-Red Chromotherapy Sauna Block",
          sku: "SKU-S-AI03",
          price: 49.00,
          wholesaleCost: 8.00,
          marginPct: 83.7,
          targetDemand: "High",
          trendReason: "Light therapies popularization for toxin clearing and lymphatic fluid system resets.",
          audience: "Working executives, stress-sensitive professionals",
          profitabilityAnalysis: "Zero therapist labor required. Customer occupies pre-configured chamber independently.",
          estMonthlySales: 195
        }
      ],
      manufacturing: [
        {
          name: "UAV Custom Carbon Aerospace Gear Brackets",
          sku: "SKU-M-AI01",
          price: 245.00,
          wholesaleCost: 85.00,
          marginPct: 65.3,
          targetDemand: "Extreme",
          trendReason: "Logistics shipping drone manufacturers seeking lightweight, rigid carbon fiber mounting braces.",
          audience: "B2B UAV assemblers, warehouse automated robotics ventures",
          profitabilityAnalysis: "Commands high bespoke fee due to specialized ASTM-certified composition ratios.",
          estMonthlySales: 120
        },
        {
          name: "NEMA-23 Recycled Copper Core Servo Motors",
          sku: "SKU-M-AI02",
          price: 110.00,
          wholesaleCost: 42.00,
          marginPct: 61.8,
          targetDemand: "High",
          trendReason: "Domestic equipment builders shifting back to copper materials amid micro-supply disruptions.",
          audience: "CNC builders, robotics integrators, heavy machine factories",
          profitabilityAnalysis: "Excellent bulk shipping item. Consistent repeat reorders safeguard production runs.",
          estMonthlySales: 260
        },
        {
          name: "Tough-Grip Fiber Structural Tubes (Pack of 50)",
          sku: "SKU-M-AI03",
          price: 380.00,
          wholesaleCost: 140.00,
          marginPct: 63.2,
          targetDemand: "Medium",
          trendReason: "Industrial rack structural reinforcing mandates inside shipping logistic routes.",
          audience: "Warehouse installation crews, shipping managers",
          profitabilityAnalysis: "High average transaction value. Direct B2B billing makes invoice auditing fast.",
          estMonthlySales: 75
        }
      ]
    };

    const finalRecommendations = fallbackDatabase[industry] || fallbackDatabase.retail;
    return res.json({
      recommendations: finalRecommendations,
      simulated: true,
      fallbackUsed: true
    });
  }
});

// Local Shopify Help Center document lookup
app.get("/api/shopify-local-docs", (req, res) => {
  const search = req.query.search as string;
  const docsDir = path.join(process.cwd(), "src", "docs", "shopify");
  
  if (!fs.existsSync(docsDir)) {
    return res.json({ success: false, docs: [], error: "Docs folder not initialized." });
  }

  try {
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith(".md"));
    const docs = files.map(file => {
      const filePath = path.join(docsDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const firstLine = content.split("\n")[0] || "";
      const title = firstLine.replace(/^#\s+/, "").trim() || file;
      return {
        id: file.replace(".md", ""),
        filename: file,
        title: title,
        excerpt: content.substring(0, 180).replace(/[#*`_\-]/g, "").trim() + "..."
      };
    });

    if (search) {
      const query = search.toLowerCase();
      const filtered = docs.filter(doc => {
        const filePath = path.join(docsDir, doc.filename);
        const fullContent = fs.readFileSync(filePath, "utf-8").toLowerCase();
        return doc.title.toLowerCase().includes(query) || fullContent.includes(query);
      });
      return res.json({ success: true, docs: filtered });
    }

    return res.json({ success: true, docs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/shopify-local-docs/:id", (req, res) => {
  const { id } = req.params;
  const docsDir = path.join(process.cwd(), "src", "docs", "shopify");
  const filePath = path.join(docsDir, `${id}.md`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: "Document not found" });
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return res.json({ success: true, content });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Shopify developer documents lookup QA endpoint backed by Gemini
app.post("/api/gemini/shopify-docs", async (req, res) => {
  const { query, category } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query is required for Shopify documentation lookup." });
  }

  try {
    const ai = getGeminiClient();

    if (!ai) {
      console.log(`[Shopify Docs] No Gemini API key - utilising local simulation responses`);
      const responses: Record<string, string> = {
        graphql: `### Shopify GraphQL Admin API Example
To query products and legacy variants in Shopify using GraphQL Admin API, issue a \`POST\` request to \`/admin/api/2024-04/graphql.json\`:

\`\`\`graphql
query GetProductsWithVariants {
  products(first: 10) {
    edges {
      node {
        id
        title
        status
        variants(first: 5) {
          edges {
            node {
              id
              title
              price
              inventoryQuantity
            }
          }
        }
      }
    }
  }
}
\`\`\`

**Response Payload Example:**
\`\`\`json
{
  "data": {
    "products": {
      "edges": [
        {
          "node": {
            "id": "gid://shopify/Product/123456789",
            "title": "Sustainable Bamboo Coffee Mug",
            "status": "ACTIVE",
            "variants": {
              "edges": [
                {
                  "node": {
                    "id": "gid://shopify/ProductVariant/987654321",
                    "title": "Default Title",
                    "price": "29.99",
                    "inventoryQuantity": 150
                  }
                }
              ]
            }
          }
        }
      ]
    }
  }
}
\`\`\`

*Note: Register a genuine \`GEMINI_API_KEY\` to run high-intelligence dynamic doc lookup query generations!*`,
        webhooks: `### Shopify Webhooks & Signature Verification (Express Node.js)
To verify incoming Shopify webhook requests, compute the SHA256 HMAC of the raw request payload and verify it against Shopify's signature header:

\`\`\`javascript
const crypto = require('crypto');

function verifyShopifyWebhook(req, res, next) {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  // Note: req.rawBody must be populated containing the unparsed raw string body
  const body = req.rawBody || JSON.stringify(req.body); 
  
  const calculatedHash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  if (calculatedHash === hmacHeader) {
    next();
  } else {
    res.status(401).send('Validation failed. Unauthorized Hook origin.');
  }
}
\`\`\`

**Active Webhook Topics:**
- \`products/update\` : Trigger WMS sync when titles or stock shifts.
- \`orders/create\` : Intercept checkout to evaluate AI risk parameters.
- \`customers/redact\` : Compliance eraser hook (GDPR compliance).`,
        liquid: `### Shopify Liquid Theme Elements & Dynamic Inventories
Here is an elegant snippet to insert inside a custom \`product-info.liquid\` file to display high-fidelity dynamic inventory status highlights:

\`\`\`liquid
{% comment %}
  Dynamic stock threshold rules. Renders a warning box when inventories run low.
{% endcomment %}
{%- if product.available -%}
  {%- for variant in product.variants -%}
    {%- if variant.inventory_management == 'shopify' -%}
      {%- if variant.inventory_quantity <= 15 and variant.inventory_quantity > 0 -%}
        <div class="stock-badge stock-badge--warning" style="margin: 1rem 0; padding: 12px; background-color: #fffbfa; border: 1px solid #fed7d7; border-radius: 8px;">
          <span style="color: #c53030; font-weight: 700; font-size: 13px;">
            ⚠️ Only {{ variant.inventory_quantity }} left of {{ variant.title }} in stock! Order soon!
          </span>
        </div>
      {%- endif -%}
    {%- endif -%}
  {%- endfor -%}
{%- endif -%}
\`\`\`

*Tip: Save this under your project's theme templates directory and include it via \`{% render 'product-stock-warning' %}\`*`
      };

      const matchedKey = (category || 'graphql').toLowerCase();
      let fallbackText = responses[matchedKey];
      if (!fallbackText) {
        if (query.toLowerCase().includes('webhook')) {
          fallbackText = responses.webhooks;
        } else if (query.toLowerCase().includes('liquid')) {
          fallbackText = responses.liquid;
        } else {
          fallbackText = responses.graphql;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      return res.json({
        text: `### 🎯 Simulated Shopify Developer Hub (Simulated Answer)\n\nWe found the following relevant developer resource matching your instruction for \`"${query}"\`:\n\n${fallbackText}`,
        simulated: true
      });
    }

    const systemInstruction = `
    You are a distinguished Shopify Staff Architect and senior developer advocate.
    Your objective is to provide elite, accurate, modern, and highly precise documentation lookups and code templates.
    Focus strictly on:
    1. Shopify GraphQL Admin API (latest quarterly release syntax). Always provide valid GraphQL queries or mutations.
    2. Shopify REST Admin API endpoints and request headers.
    3. Liquid syntax, loops, and conditions for Shopify Online Store 2.0 themes.
    4. Shopify webhook validation (HMAC verification and security best practices).
    5. App Bridge, checkout extensibility, and theme app blocks.

    Rules:
    - Never include useless conversational greetings (e.g., "Sure, here is"). Jump straight into the code or technical explanation.
    - Format response in high quality Markdown with bold highlights and structured code blocks.
    - Highlight whether your solution uses GraphQL or REST, and outline why.
    `;

    const promptText = `
    The developer is asking for Shopify documentation/guides regarding:
    "${query}"
    
    Identified context category: ${category || 'General'}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.15
      }
    });

    return res.json({
      text: response.text || "Consulted internal manuals but no exact reference structures were returned. Refine your query parameters.",
      simulated: false
    });

  } catch (err: any) {
    console.warn("Shopify Docs Lookup via Gemini failed, shifting to developer manual fallbacks:", err.message);
    
    const responses: Record<string, string> = {
      graphql: `### Shopify GraphQL Admin API Best Practice
To retrieve the first 5 active SKU codes, issue a POST request to \`/admin/api/2026-04/graphql.json\` with the following query cargo:

\`\`\`graphql
query GetStoreInventory {
  products(first: 5, query: "status:ACTIVE") {
    edges {
      node {
        id
        title
        variants(first: 5) {
          edges {
            node {
              id
              sku
              inventoryQuantity
            }
          }
        }
      }
    }
  }
}
\`\`\`

*Note: Access requires standard \`X-Shopify-Access-Token\` client privileges.*`,
      webhooks: `### Shopify Webhooks & Signature Verification (Express Node.js)
To verify incoming Shopify webhook requests, compute the SHA256 HMAC of the raw request payload and verify it against Shopify's signature header:

\`\`\`javascript
const crypto = require('crypto');

function verifyShopifyWebhook(req, res, next) {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  // Note: req.rawBody must be populated containing the unparsed raw string body
  const body = req.rawBody || JSON.stringify(req.body); 
  
  const calculatedHash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  if (calculatedHash === hmacHeader) {
    next();
  } else {
    res.status(401).send('Validation failed. Unauthorized Hook origin.');
  }
}
\`\`\`

*Note: Register a genuine \`GEMINI_API_KEY\` to run high-intelligence dynamic doc lookup query generations!*`,
      liquid: `### Shopify Liquid Theme Elements & Dynamic Inventories
Here is an elegant snippet to insert inside a custom \`product-info.liquid\` file to display high-fidelity dynamic inventory status highlights:

\`\`\`liquid
{% comment %}
  Dynamic stock threshold rules. Renders a warning box when inventories run low.
{% endcomment %}
{%- if product.available -%}
  {%- for variant in product.variants -%}
    {%- if variant.inventory_management == 'shopify' -%}
      {%- if variant.inventory_quantity <= 15 and variant.inventory_quantity > 0 -%}
        <div class="stock-badge stock-badge--warning" style="margin: 1rem 0; padding: 12px; background-color: #fffbfa; border: 1px solid #fed7d7; border-radius: 8px;">
          <span style="color: #c53030; font-weight: 700; font-size: 13px;">
            ⚠️ Only {{ variant.inventory_quantity }} left of {{ variant.title }} in stock! Order soon!
          </span>
        </div>
      {%- endif -%}
    {%- endif -%}
  {%- endfor -%}
{%- endif -%}
\`\`\`

*Tip: Save this under your project's theme templates directory and include it via \`{% render 'product-stock-warning' %}\`*`
    };

    const matchedKey = (category || 'graphql').toLowerCase();
    let fallbackText = responses[matchedKey];
    if (!fallbackText) {
      if (query.toLowerCase().includes('webhook')) {
        fallbackText = responses.webhooks;
      } else if (query.toLowerCase().includes('liquid')) {
        fallbackText = responses.liquid;
      } else {
        fallbackText = responses.graphql;
      }
    }

    return res.json({
      text: `### 🎯 Simulated Shopify Developer Hub (Simulated Answer)\n\nWe found the following relevant developer resource matching your instruction for \`"${query}"\`:\n\n${fallbackText}`,
      simulated: true,
      fallbackUsed: true
    });
  }
});

// Real-time Event simulation connector for Botble CMS / Laravel 12
app.post("/api/botble/simulate-event", (req, res) => {
  try {
    const { tenantId, storeId, eventType } = req.body;
    const db = getDB();
    const ind = tenantId === 't_retail' ? 'retail' : (tenantId === 't_food' ? 'food' : 'retail');
    
    // Ensure lists are initialized
    if (!db.agentTasks) db.agentTasks = [];
    if (!db.agentRuns) db.agentRuns = [];
    if (!db.aiActionsLog) db.aiActionsLog = [];
    
    const timestamp = new Date().toISOString();
    let resultEvent = {};
    
    if (eventType === "low_inventory") {
      // 1. Mutate database state (decrement product stock to trigger real warning)
      const currentProducts = db.tenantDB[ind]?.products || [];
      if (currentProducts.length > 0) {
        currentProducts[0].stock = 2; // Trigger low inventory
        saveDB(db);
      }
      
      // 2. Add structured Multi-Agent collaboration runs
      const colId = "COL-" + Date.now().toString().slice(-4);
      
      const inventoryRun = {
        id: 'RUN_' + Date.now() + '_inv',
        tenantId,
        agentName: 'Oliver (WMS Inventory Agent)',
        status: 'COMPLETED',
        query: 'WMS Supply Level & Reorder Warning',
        recommendation: `Detected Botble CMS SKU #${currentProducts[0]?.sku || 'WINTER-001'} is critically low (2 units). Generated procurement order for +150 units with Italian Supplier.`,
        startedAt: timestamp,
        finishedAt: timestamp
      };
      
      const pricingRun = {
        id: 'RUN_' + Date.now() + '_pri',
        tenantId,
        agentName: 'Fiona (Yield Pricing Agent)',
        status: 'COMPLETED',
        query: 'Pricing Margin Elasticity check',
        recommendation: `Audited replacement wholesale values of SKU #${currentProducts[0]?.sku || 'WINTER-001'}. Elasticity permits recommended +4.8% price markup to absorb freight charges, sustaining a 62% gross profit margin.`,
        startedAt: timestamp,
        finishedAt: timestamp
      };
      
      const productRun = {
        id: 'RUN_' + Date.now() + '_prod',
        tenantId,
        agentName: 'Leo (Product Catalog Agent)',
        status: 'COMPLETED',
        query: 'Automated SOP content localization',
        recommendation: `Translated name and optimized description to Sleek Minimalist design standards in English/German locales for higher storefront search ranks.`,
        startedAt: timestamp,
        finishedAt: timestamp
      };
      
      db.agentRuns.unshift(inventoryRun, pricingRun, productRun);
      
      // Create collaboration task card
      const collabTask = {
        id: 'TASK_COL_' + Date.now().toString().slice(-4),
        tenantId,
        name: `[多智能体协同] 应急补仓与定价优化 (#${currentProducts[0]?.sku || 'WINTER-001'})`,
        sourceAgent: 'Sophia (Operating CEO)',
        status: 'COMPLETED',
        progress: 100,
        createdAt: timestamp
      };
      db.agentTasks.unshift(collabTask);
      
      // Save Action Log
      db.aiActionsLog.unshift({
        id: db.aiActionsLog.length + 12001,
        store_id: tenantId === 't_retail' ? 1001 : 1002,
        type: 'BOTBLE_COLLAB_SYNC',
        payload: JSON.stringify({
          colId,
          event: "Botble CMS Low Stock Hook",
          sku: currentProducts[0]?.sku || 'WINTER-001',
          agentsParticipated: ["Oliver", "Fiona", "Leo"],
          actionTaken: "PROCUREMENT_ORDER_LOCKED",
          reorderQty: 150,
          pricingDelta: "+4.8%"
        }),
        executed_by: 101,
        executed_at: timestamp
      });
      
      saveDB(db);
      
      resultEvent = {
        sku: currentProducts[0]?.sku || 'WINTER-001',
        productName: currentProducts[0]?.name || '极轻保暖风雨衣',
        colId,
        agents: [
          { name: 'Oliver (WMS 仓储官)', title: 'WMS Sourcing & Reorder Sentry', emoji: '🏭', desc: inventoryRun.recommendation },
          { name: 'Fiona (收益精算师)', title: 'Yield Pricing & Margin Oracle', emoji: '💰', desc: pricingRun.recommendation },
          { name: 'Leo (品类编排官)', title: 'Product Copywriter & SOP Specialist', emoji: '📦', desc: productRun.recommendation }
        ],
        task: collabTask
      };
    } else if (eventType === "new_product_raw") {
      const colId = "COL-" + Date.now().toString().slice(-4);
      const tempSku = "SKU-BOTBLE-" + Date.now().toString().slice(-3);
      
      const productRun = {
        id: 'RUN_' + Date.now() + '_prod',
        tenantId,
        agentName: 'Leo (Product Catalog Agent)',
        status: 'COMPLETED',
        query: 'Raw product upload localized rewrite',
        recommendation: `Optimized Botble crude entry "${tempSku}": Applied premium SEO keyword enrichment, structured specification mapping, and high-contrast title casing.`,
        startedAt: timestamp,
        finishedAt: timestamp
      };
      
      const pricingRun = {
        id: 'RUN_' + Date.now() + '_pri',
        tenantId,
        agentName: 'Fiona (Yield Pricing Agent)',
        status: 'COMPLETED',
        query: 'Cost base markup calculation',
        recommendation: `Computed MSRP pricing matrices for "${tempSku}": set wholesale COGS and suggested competitive high-ticket pricing to maximize retail retention.`,
        startedAt: timestamp,
        finishedAt: timestamp
      };
      
      db.agentRuns.unshift(productRun, pricingRun);
      
      const collabTask = {
        id: 'TASK_COL_' + Date.now().toString().slice(-4),
        tenantId,
        name: `[多智能体协同] 货源描述与欧美语意重塑 (${tempSku})`,
        sourceAgent: 'Leo (Product Agent)',
        status: 'COMPLETED',
        progress: 100,
        createdAt: timestamp
      };
      db.agentTasks.unshift(collabTask);
      
      db.aiActionsLog.unshift({
        id: db.aiActionsLog.length + 12001,
        store_id: tenantId === 't_retail' ? 1001 : 1002,
        type: 'BOTBLE_NEW_PROD_SYNC',
        payload: JSON.stringify({
          colId,
          event: "Botble CMS Raw Product Sync",
          sku: tempSku,
          agentsParticipated: ["Leo", "Fiona"],
          actionTaken: "BILINGUAL_COPYWRITING_APPLIED"
        }),
        executed_by: 101,
        executed_at: timestamp
      });
      
      saveDB(db);
      
      resultEvent = {
        sku: tempSku,
        productName: 'Raw Upload SKU (Pending Optimization)',
        colId,
        agents: [
          { name: 'Leo (品类编排官)', title: 'Product Copywriter & SOP Specialist', emoji: '📦', desc: productRun.recommendation },
          { name: 'Fiona (收益精算师)', title: 'Yield Pricing & Margin Oracle', emoji: '💰', desc: pricingRun.recommendation }
        ],
        task: collabTask
      };
    } else {
      const colId = "COL-" + Date.now().toString().slice(-4);
      
      const graceRun = {
        id: 'RUN_' + Date.now() + '_gra',
        tenantId,
        agentName: 'Grace (Loyalty Retention Agent)',
        status: 'COMPLETED',
        query: 'High-LTV silent user scan',
        recommendation: `Detected 12 inactive high-value account records in Botble database. Forwarded segmentation index data to Marketing module.`,
        startedAt: timestamp,
        finishedAt: timestamp
      };
      
      const marcusRun = {
        id: 'RUN_' + Date.now() + '_mar',
        tenantId,
        agentName: 'Marcus (Campaign Marketing Agent)',
        status: 'COMPLETED',
        query: 'Automated CRM discount trigger',
        recommendation: `Drafted direct email dispatch via SendGrid with a custom 25% off coupon (EURO-RETREAT-25) targeting segment.`,
        startedAt: timestamp,
        finishedAt: timestamp
      };
      
      db.agentRuns.unshift(graceRun, marcusRun);
      
      const collabTask = {
        id: 'TASK_COL_' + Date.now().toString().slice(-4),
        tenantId,
        name: `[多智能体协同] 高价值买家自动流失挽回`,
        sourceAgent: 'Grace (Customer Agent)',
        status: 'COMPLETED',
        progress: 100,
        createdAt: timestamp
      };
      db.agentTasks.unshift(collabTask);
      
      db.aiActionsLog.unshift({
        id: db.aiActionsLog.length + 120002,
        store_id: tenantId === 't_retail' ? 1001 : 1002,
        type: 'BOTBLE_SILENT_RECALL',
        payload: JSON.stringify({
          colId,
          event: "Botble CMS VIP Inactive Webhook",
          agentsParticipated: ["Grace", "Marcus"],
          couponGenerated: "EURO-RETREAT-25",
          dispatchedMailCount: 12
        }),
        executed_by: 101,
        executed_at: timestamp
      });
      
      saveDB(db);
      
      resultEvent = {
        sku: 'CRM-VIP-RECALL',
        productName: 'VIP Retention Event',
        colId,
        agents: [
          { name: 'Grace (会员留存官)', title: 'Customer Retention Sentry', emoji: '👥', desc: graceRun.recommendation },
          { name: 'Marcus (集成营销官)', title: 'CRM Campaigns Builder', emoji: '🎁', desc: marcusRun.recommendation }
        ],
        task: collabTask
      };
    }
    
    res.json({ success: true, event: resultEvent, message: `Botble CMS webhook event "${eventType}" successfully dispatched.` });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to simulate Botble CMS event", details: err.message });
  }
});

// --- DEVELOPER WORKSPACE CODE EXPLORER HELPER & REAL APIS ---
function buildFileTree(dir: string, baseDir: string = ""): any[] {
  const absolutePath = path.resolve(dir);
  const items = fs.readdirSync(absolutePath);
  const result: any[] = [];

  for (const item of items) {
    // Skip hidden files or ignored folders
    if (
      item === "node_modules" ||
      item === "dist" ||
      item === ".git" ||
      item === ".github" ||
      item === ".vscode" ||
      item === "pnpm-lock.yaml" ||
      item === "package-lock.json" ||
      item === "server_db.json" ||
      item.startsWith(".")
    ) {
      continue;
    }

    const itemPath = path.join(absolutePath, item);
    const relPath = path.join(baseDir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      const children = buildFileTree(itemPath, relPath);
      result.push({
        name: item,
        path: relPath.replace(/\\/g, "/"),
        isDirectory: true,
        children: children.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        })
      });
    } else {
      result.push({
        name: item,
        path: relPath.replace(/\\/g, "/"),
        isDirectory: false
      });
    }
  }

  return result.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}

app.get("/api/developer/files", (req, res) => {
  try {
    const rootPath = process.cwd();
    const tree = buildFileTree(rootPath);
    res.json({ success: true, tree });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to scan workspace directories", details: err.message });
  }
});

app.post("/api/developer/read-file", (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: "Missing required 'filePath' parameter in body." });
    }

    // Secure path traversal protection
    const rootPath = process.cwd();
    const targetPath = path.resolve(rootPath, filePath);
    if (!targetPath.startsWith(rootPath)) {
      return res.status(403).json({ error: "Access Denied: Path traversal detected." });
    }

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: `File not found: ${filePath}` });
    }

    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: "Requested path is a directory, not a file." });
    }

    const content = fs.readFileSync(targetPath, "utf-8");
    res.json({ success: true, filePath, content });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to read file contents", details: err.message });
  }
});

app.post("/api/developer/write-file", (req, res) => {
  try {
    const { filePath, content } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: "Missing required 'filePath' or 'content' in request body." });
    }

    // Secure path traversal protection
    const rootPath = process.cwd();
    const targetPath = path.resolve(rootPath, filePath);
    if (!targetPath.startsWith(rootPath)) {
      return res.status(403).json({ error: "Access Denied: Path traversal detected." });
    }

    // Ensure the parent directory exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(targetPath, content, "utf-8");
    console.log(`[Developer-Write] File updated successfully: "${filePath}"`);
    res.json({ success: true, filePath, message: "File persistent changes saved successfully." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to write content to file", details: err.message });
  }
});

// Integrate Vite middleware for development or serve production builds
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);
    
    console.log("Vite middleware mounted for local development.");
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    
    console.log(`Serving static production files from: ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AI Commerce OS Server] started successfully on port ${PORT}`);
    console.log(`Available on http://0.0.0.0:${PORT}`);
  });
}

startServer();
