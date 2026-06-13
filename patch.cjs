const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'SuperAdminCenter.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find start and end indices of the corrupted block
const startStr = '// 7. 分析流失客户';
const endStr = 'const getRoundtableData = (industry: IndustryType';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  console.log(`Found start block at ${startIndex} and end block at ${endIndex}! Replacing...`);
  
  const replacement = `// 7. 分析流失客户
      else if (normalized.includes('流失客户') || normalized.includes('流失')) {
        setCommanderResult({
          query: q,
          description: "👥 【流失预警】根据近期买家复购周期与行为轨迹，系统识别到处于“亚流失”及“沉睡期”的高客单价买家：\\n\\n• 潜在流失人数：1,284 人\\n• 预计损失交易额：$32,100 EUR 📉\\n• 主力特征：买家注册满 30 天，已加入购物车 3 次但均未付款（多分布于法德大宗商区）。",
          cards: [
            {
              title: "一键激活 CRM 自动回流优惠规则",
              icon: "🎁",
              actionText: "运行对账激活 15% 自动补水券并分发",
              color: 'emerald',
              onAction: () => {
                const newRule = {
                  id: \`rule_churn_\${Date.now()}\`,
                  ifCondition: '买家加入购物车3次且超15天未结算',
                  thenAction: '推送15%大促催付专属券并短信提醒',
                  active: true,
                  runs: 1
                };
                setRules(prev => [newRule, ...prev]);
                setAiOpsSubTab('rules');
                onAddSystemLog('AI Commander', '促活特派分发', '一键启动 10240 位高潜买家挽单补贴券核分发机制', 'success');
                alert("【AI 指挥动作成功】\\n- 已排发 CRM 催付专属红包！\\n- 挽留触发条件已物理写入规则集并注入 RAG 决策底层，前滚保护客盘。");
              }
            }
          ]
        });
      }

  `;
  
  content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Successfully replaced Case 7 and moved helper functions outside of handleCommanderCommand!");
} else {
  console.log(`Error: Could not locate blocks. startIndex=${startIndex}, endIndex=${endIndex}`);
}
