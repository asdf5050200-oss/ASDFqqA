const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'SuperAdminCenter.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find start string
const startBlock = `                      {selectedModalFile.includes('aging') ? (
                        <p className="leading-relaxed text-slate-400">
                          - 积压大宗：阿尔卑斯重防外套、轻暖马甲。<br />
                          - 静态周转：高达 120 天出库停滞。<br />
                          - 持存仓损：日费量级积压累积 $2.5/件。
                        </p>
                      ) : (`;

const endBlock = `          {/* PART 3: ⚡ 自动化管理 */}`;

const startIndex = content.indexOf(startBlock);
const endIndex = content.indexOf(endBlock);

if (startIndex !== -1 && endIndex !== -1) {
  console.log(`Found start block at ${startIndex} and end block at ${endIndex}!`);
  
  const replacement = `
                        <p className="leading-relaxed text-slate-400">
                          - 雷达成像：多源高分辨率红外波段差影图。<br />
                          - 异常探测：瑞士瓦莱州阿尔卑斯深谷温度较常年偏低 -4.8℃。<br />
                          - 决策预警：将持续推高低温防护产品在欧洲主要仓端的静态热度。
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

`;

  const newContent = content.slice(0, startIndex + startBlock.length) + replacement + content.slice(endIndex);
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log("Successfully cleaned up the corrupted workflows segment!");
} else {
  console.log(`Error: Could not locate blocks. startIndex=${startIndex}, endIndex=${endIndex}`);
}
