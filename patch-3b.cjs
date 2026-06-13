const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, 'src', 'components', 'SuperAdminCenter.tsx');
let content = fs.readFileSync(targetFilePath, 'utf8');

// Align markers to target 3B
const startMarker = "/* 3B: Loss Prevention Case Studies Database */";
const endMarker = "PART 5: 📏 规则管理";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  console.log(`Found 3B block at start Index ${startIndex} and end Index ${endIndex}`);

  // Create the exact clean block
  const replacementPayload = `/* 3B: Loss Prevention Case Studies Database */
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between font-sans">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">3B</span>
                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Layer 3: 异常资损事故学习归档规约</h4>
                        <p className="text-xs font-bold text-slate-800 mt-1">累积失败案例，保障 AI 绝不重复犯同样的低级商业错误</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Failure case list */}
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 font-sans font-medium">
                      {failureCases.map(fc => (
                        <div key={fc.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-1.5 hover:border-slate-350 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                              <span>【\${fc.caseCode}】 \${fc.title}</span>
                            </span>
                            <span className="font-mono font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 rounded-sm text-[9.5px]">损失: \${fc.lossAmount}</span>
                          </div>
                          <p className="text-[10px] text-slate-550 font-semibold leading-relaxed bg-white p-2 rounded border border-slate-100">
                            <span className="font-extrabold text-slate-700">现象：</span>\${fc.symptom}
                          </p>
                          <div className="flex justify-between items-center text-[9.5px] font-bold">
                            <span className="text-emerald-700">🛡️ 预防规则：<span className="font-mono text-indigo-750">\${fc.preventingRule}</span></span>
                            <span className="text-indigo-600 text-[10px]">隔离层: \${fc.industry}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Form to submit a new failure learning case */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 text-left font-sans col-span-1 md:col-span-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">➕ 登记并从错误反面事故中学习 (注入 RAG 向量防线)</span>
                      
                      <form onSubmit={handleCreateFailureCase} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-1">事故简称 (Title)</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. 美容院技师重叠超载"
                            value={newFcTitle}
                            onChange={e => setNewFcTitle(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-1">平台预计资产流失或回吐金额 (Loss Amount)</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. $4,200 / Daily"
                            value={newFcLoss}
                            onChange={e => setNewFcLoss(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-bold text-slate-500 mb-1">异常事件与漏洞现象描述 (Symptom Context for Vectorizing)</label>
                          <textarea 
                            required
                            rows={2}
                            placeholder="请还原该特定场景中出现的决策失效、风控断层或者智能体逻辑空转闭环..."
                            value={newFcSymptom}
                            onChange={e => setNewFcSymptom(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>

                        <div className="md:col-span-2 flex justify-between items-center gap-4 pt-1 flex-wrap md:flex-nowrap">
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-[9px] font-bold text-slate-500 mb-1">拟强制拦截或控制的阻滞规则 ID (Preventing Rule ID)</label>
                            <input 
                              type="text"
                              placeholder="e.g. rule_limit_overlap_session"
                              value={newFcRule}
                              onChange={e => setNewFcRule(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500 font-mono font-bold"
                            />
                          </div>

                          <button 
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-550 text-white font-extrabold text-[10.5px] px-6 py-2.5 rounded-lg transition-all shadow-sm shrink-0 mt-3 md:mt-0 cursor-pointer"
                          >
                            📝 确认并注入此反向对账故障
                          </button>
                        </div>
                      </form>
                    </div>

                  </div>
                </div>

              </div>
              
            </div>
          )}

          {/* `;

  content = content.slice(0, startIndex) + replacementPayload + content.slice(endIndex);
  fs.writeFileSync(targetFilePath, content, 'utf8');
  console.log("Successfully applied the clean 3B block patch!");
} else {
  console.log(`Error: Markers not found! startIndex=${startIndex}, endIndex=${endIndex}`);
}
