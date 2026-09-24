import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white p-4 md:p-6 border-b border-slate-200 flex items-center justify-between z-10">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 italic flex items-center gap-2">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            使用指南
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <section className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 md:p-5">
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">1</span>
              快速上手
            </h3>
            <ol className="space-y-2 text-sm text-slate-600 list-none">
              <li><strong className="text-slate-900">选择画布：</strong>先用左侧「画布尺寸」设置大小，选择圆珠、方块或圆角样式。</li>
              <li><strong className="text-slate-900">选择颜色：</strong>在调色盘点选颜色，也可以展开更多颜色或直接输入 HEX。</li>
              <li><strong className="text-slate-900">开始绘制：</strong>左键点击或拖动绘制；中键拖动画布；<kbd className="px-1 py-0.5 bg-white rounded border border-indigo-200 font-mono text-xs">Ctrl + 滚轮</kbd>缩放。</li>
              <li><strong className="text-slate-900">继续处理：</strong>用选区批量编辑，用色板把作品映射到实际能买到的色号。</li>
            </ol>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">2</span>
              编辑工具
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
              <p><strong className="text-slate-900">✏️ 画笔 B</strong>：点击或拖动连续绘制</p>
              <p><strong className="text-slate-900">✨ 智能画笔 M</strong>：按底图颜色自动切换当前颜色</p>
              <p><strong className="text-slate-900">🧽 橡皮 E</strong>：擦除为透明</p>
              <p><strong className="text-slate-900">🪣 填充 G</strong>：填充相连的同色区域</p>
              <p><strong className="text-slate-900">🧪 吸色 I</strong>：吸取画布上的颜色</p>
              <p><strong className="text-slate-900">📏 直线 L</strong>：依次点击起点和终点</p>
              <p><strong className="text-slate-900">⬜ 矩形 R</strong>：依次点击两个对角点</p>
              <p><strong className="text-slate-900">⭕ 圆形 C</strong>：依次点击圆形范围的两个端点</p>
              <p><strong className="text-slate-900">🪄 魔棒 W</strong>：按颜色和容差自动选中区域</p>
              <p><strong className="text-slate-900">✋ 拖拽 H</strong>：拖动视图，不修改画布</p>
              <p className="sm:col-span-2"><strong className="text-slate-900">⬚ 框选 S</strong>：框选内容进行移动、复制、剪切、清除和反选</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-fuchsia-100 text-fuchsia-600 rounded-lg flex items-center justify-center text-sm">3</span>
              选区、移动与抠图
            </h3>
            <div className="space-y-3">
              <div className="bg-fuchsia-50 border border-fuchsia-100 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-800 mb-2">⬚ 框选和移动</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>选择「框选」后拖动创建矩形选区。</li>
                  <li>在选区内部按住拖动，可整体移动选区内容；移动到画布边缘会自动限制范围。</li>
                  <li>移动属于一次历史操作，可按 <kbd className="px-1 py-0.5 bg-white rounded border border-fuchsia-200 font-mono text-[10px]">Ctrl+Z</kbd> 撤销。</li>
                  <li>选区外继续拖动可重新框选。</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-800 mb-2">➕ 替换、加选和减选</p>
                <p className="text-xs text-slate-600">选区面板可切换三种模式：替换重新选择，加选把多次框选或魔棒结果合并，减选从当前选区移除区域。加选会形成不规则选区。</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-800 mb-2">📋 批量编辑</p>
                <p className="text-xs text-slate-600"><kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">Ctrl+C</kbd> 复制、<kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">Ctrl+V</kbd> 粘贴、<kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">Ctrl+X</kbd> 剪切、<kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">Delete</kbd> 清空、<kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">Ctrl+Shift+I</kbd> 反选选区外区域、<kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">Esc</kbd> 取消框选。</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-800 mb-2">🪄 魔棒与一键抠图</p>
                <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                  <li>选择魔棒，设置颜色容差；需要时关闭「连续区域」以选中全画布相近颜色。</li>
                  <li>点击背景颜色，或点击「识别背景」自动选中边缘相连的背景。</li>
                  <li>按 <kbd className="px-1 py-0.5 bg-white rounded border border-emerald-200 font-mono text-[10px]">Delete</kbd> 清空背景；如果选中的是主体，可先「反选选区」再删除。</li>
                </ol>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm">4</span>
              色板与已有颜色
            </h3>
            <div className="space-y-3">
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-800 mb-2">🎨 先确定色号和颜色数</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li><strong>色号系统：</strong>选择 MARD、COCO、漫漫、盼盼或咪小窝，界面和导出会显示对应色号。</li>
                  <li><strong>色板预设：</strong>可选择全色板、168、144、96、48 或自定义；切换限制色数的预设时会询问是否立即映射。</li>
                  <li><strong>目标颜色数：</strong>选择 4、8、12、16、24 或 32 色，作为「合并相似颜色」的目标。</li>
                  <li><strong>显示色号：</strong>开启后在色块和导出图纸中显示品牌色号。</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-800 mb-2">⚡ 合并相似颜色</p>
                <p className="text-xs text-slate-600">使用 K-Means 聚类，把画布上的颜色逐步归并到「目标颜色数」。适合颜色复杂、想先压缩色彩规模的设计。执行前会确认，执行后可以撤销。</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-800 mb-2">🎯 映射到色板</p>
                <p className="text-xs text-slate-600">把画布中的每种颜色替换为所选品牌色板里最接近的颜色。图片导入和智能生成后，建议执行一次映射，确保色号实际可购买。</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-800 mb-2">📦 我的已有颜色</p>
                <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                  <li>先选择色号系统，再点选你手头已有的颜色。</li>
                  <li>也可以用 <span className="font-mono">#RRGGBB</span> 添加自定义颜色，或点「从画布添加」加入当前作品的所有颜色。</li>
                  <li>点「展开色板」可按色系查看、勾选并浏览已选统计。</li>
                  <li>点「映射到色板」后，相近颜色优先使用已有颜色，明显不同的颜色回退到色板。</li>
                  <li>开启「严格模式」后，只允许映射到你已有的颜色。</li>
                </ol>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-sm">5</span>
              智能生成与转图
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong className="text-slate-900">✨ 智能生成拼豆图</strong>：输入描述或上传参考图，免费生成拼豆风格示意图，再导入画布继续编辑。</p>
              <p><strong className="text-slate-900">🖼️ 图片转拼豆</strong>：上传图片，本地转换为拼豆图案并匹配颜色；完成后会提示映射到实际色板。</p>
              <p><strong className="text-slate-900">✂️ 高级裁切</strong>：可以自由框选图片区域，或使用 1:1 裁切并选择左上、居中、右下对齐。</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center text-sm">6</span>
              视图、导出与分享
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong className="text-slate-900">📐 2D 视图</strong>：主要编辑模式</p>
              <p><strong className="text-slate-900">🧊 3D 预览</strong>：检查立体层次和拼豆效果</p>
              <p><strong className="text-slate-900">📚 分层切片</strong>：按层查看制作顺序</p>
              <p><strong className="text-slate-900">🖼️ 成品预览</strong>：查看完成后的展示效果</p>
              <p><strong className="text-slate-900">💾 导出图片</strong>：导出 PNG，可选择色号、参考线、镜像、仅选区和自定义水印</p>
              <p><strong className="text-slate-900">📋 导出图纸</strong>：保存 JSON 项目，之后可重新导入继续编辑</p>
              <p><strong className="text-slate-900">🔗 分享作品</strong>：生成 7 天有效链接，或发布到素材广场</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center text-sm">7</span>
              素材广场
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong className="text-slate-900">🌐 浏览与搜索</strong>：按标签筛选或搜索社区图纸，也可按热门排序</p>
              <p><strong className="text-slate-900">📥 一键应用</strong>：把喜欢的图纸加载到画布继续修改</p>
              <p><strong className="text-slate-900">📤 发布作品</strong>：填写名称、作者和标签后分享到广场</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm">8</span>
              专业拼豆工具
            </h3>
            <div className="space-y-3">
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-800 mb-2">👁️ 颜色高亮</p>
                <p className="text-xs text-slate-600 mb-2">在右侧颜色列表点击眼睛图标，可高亮一种颜色并把其他颜色变透明。</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>默认透明度 90%，可调节范围 50%-100%</li>
                  <li>再次点击眼睛图标可取消高亮</li>
                  <li>主编辑器和沉浸拼豆模式都可以使用</li>
                </ul>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-800 mb-2">🎯 沉浸拼豆模式</p>
                <p className="text-xs text-slate-600 mb-2">点击顶部「拼豆」进入全屏模式，按图例逐个颜色完成作品。</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>每个像素显示色号，右侧显示完整图例和数量</li>
                  <li>支持标尺、辅助线、网格线开关</li>
                  <li>支持缩放、拖动和锁定防误触</li>
                  <li>按 <kbd className="px-1 py-0.5 bg-white rounded border border-orange-200 font-mono text-[10px]">Esc</kbd> 退出沉浸模式</li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3 rounded-xl">
                <p className="text-xs text-amber-700"><strong>💡 推荐工作流：</strong>设计或导入图纸 → 映射色板 → 颜色高亮 → 进入沉浸模式逐个颜色完成拼豆</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">9</span>
              快捷键
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
              <p><strong className="text-slate-900">Ctrl+Z</strong>：撤销</p>
              <p><strong className="text-slate-900">Ctrl+Shift+Z</strong>：重做</p>
              <p><strong className="text-slate-900">Ctrl+C / V / X</strong>：复制、粘贴、剪切选区</p>
              <p><strong className="text-slate-900">Ctrl+Shift+I</strong>：反选选区</p>
              <p><strong className="text-slate-900">Delete / Backspace</strong>：清空选区</p>
              <p><strong className="text-slate-900">Esc</strong>：取消框选</p>
              <p><strong className="text-slate-900">[ / ]</strong>：减小、增大画笔</p>
              <p><strong className="text-slate-900">B / E / G / I / L / R / C / M / W / H / S</strong>：切换工具</p>
            </div>
          </section>

          <section className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 md:p-6 rounded-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              反馈与建议
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p>如果你有任何建议或发现问题，欢迎反馈给我！</p>
              <a 
                href="mailto:danzai233@qq.com" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-600 font-bold rounded-xl border-2 border-indigo-200 hover:border-indigo-400 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                danzai233@qq.com
              </a>
              <p className="text-xs text-slate-400 mt-2">欢迎提供建议，让拼豆糕手变得更好！</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
