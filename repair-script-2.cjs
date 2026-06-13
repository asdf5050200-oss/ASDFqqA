const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'SuperAdminCenter.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startBlock = `          {/* PART 3: ⚡ 自动化管理 */}
          {aiOpsSubTab === 'automations' && (`;

const endBlock = `                        setSimulationRoundtable([]);
                      }}
                      className="text-slate-400 hover:text-white border border-slate-800 px-3 py-1 text-[10px] rounded-lg cursor-pointer"
                    >
                      重新设定
                    </button>
                  </div>`;

const startIndex = content.indexOf(startBlock);
const endIndex = content.indexOf(endBlock);

if (startIndex !== -1 && endIndex !== -1) {
  console.log(`Found start block at ${startIndex} and end block at ${endIndex}!`);
  
  const replacement = `            </div>

            {/* Action trigger button */}
            {!simulationResults && (
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleLaunchMockSimulation}
                  disabled={cockpitPhase === 'simulating'}
                  className={\`px-8 py-3.5 rounded-xl text-xs font-black tracking-wider transition-all shadow-md \${cockpitPhase === 'simulating' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900 cursor-not-allowed animate-pulse' : 'bg-indigo-600 hover:bg-indigo-550 border border-indigo-500 hover:scale-[1.01] active:scale-99 text-white font-extrabold cursor-pointer'}\`}
                >
                  {cockpitPhase === 'simulating' ? '⚙️ 正在召集多智能体，联合研读 RAG 上下文并启动拟合推演...' : '🚀 启动多智能体协同对账博弈仿真'}
                </button>
              </div>
            )}

            {/* Results Block (displays report when done) */}
            {simulationResults && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-lg text-left mt-6 animate-fadeIn">
                <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-4 pb-2 border-b border-indigo-950/70">
                  <div className="text-left">
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-extrabold px-1.5 py-0.5 rounded uppercase font-sans">SIMULATION DONE</span>
                    <h4 className="text-xs font-black text-white mt-1">协同经营决策完成：博弈底盘完成推演。如下是推演报告与收益对比。</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulationResults(null);
                      setSimulationRoundtable([]);
                      setCockpitPhase('idle');
                    }}
                    className="text-slate-400 hover:text-white border border-slate-800 px-3 py-1 text-[10px] rounded-lg cursor-pointer font-sans"
                  >
                    重新设定
                  </button>
                </div>`;

  const newContent = content.slice(0, startIndex) + replacement + content.slice(endIndex + endBlock.length);
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log("Successfully replaced the second corrupted block and unified the simulation trigger & results layout!");
} else {
  console.log(`Error: Could not locate blocks. startIndex=${startIndex}, endIndex=${endIndex}`);
}
