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
          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">1</span>
              基础操作
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong className="text-slate-900">🖱️ 左键点击</strong>：放置拼豆</p>
              <p><strong className="text-slate-900">🖱️ 右键点击</strong>：擦除拼豆</p>
              <p><strong className="text-slate-900">🖱️ 拖拽绘制</strong>：按住鼠标拖动连续绘制</p>
              <p><strong className="text-slate-900">🖱️ 中键拖拽</strong>：平移画布</p>
              <p><strong className="text-slate-900">🔍 滚轮缩放</strong>：放大或缩小画布</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">2</span>
              工具功能
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong className="text-slate-900">🖌️ 画笔</strong>：单个绘制或拖动连续绘制</p>
              <p><strong className="text-slate-900">🪣 油漆桶</strong>：填充同色区域</p>
              <p><strong className="text-slate-900">📐 线条</strong>：绘制直线</p>
              <p><strong className="text-slate-900">⬜ 矩形</strong>：绘制矩形区域</p>
              <p><strong className="text-slate-900">⭕ 圆形</strong>：绘制圆形区域</p>
              <p><strong className="text-slate-900">🧽 橡皮擦</strong>：擦除拼豆</p>
              <p><strong className="text-slate-900">💧 吸管</strong>：吸取颜色</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">3</span>
              智能生成与转图
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong className="text-slate-900">✨ 智能生成拼豆图</strong>：输入描述或上传参考图，使用应用内建的智能生成服务（免费）生成拼豆风格示意图，再导入画布编辑</p>
              <p><strong className="text-slate-900">🖼️ 图片转拼豆</strong>：上传图片，在本地转换为拼豆图案并匹配色号</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">4</span>
              视图与导出
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong className="text-slate-900">📐 2D 视图</strong>：平面编辑模式</p>
              <p><strong className="text-slate-900">🎲 3D 预览</strong>：立体预览效果</p>
              <p><strong className="text-slate-900">🍰 切片视图</strong>：分层切片制作</p>
              <p><strong className="text-slate-900">💾 导出图片</strong>：导出为 PNG 图片</p>
              <p><strong className="text-slate-900">📊 导出清单</strong>：导出所需拼豆清单</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">5</span>
              素材广场
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong className="text-slate-900">🌐 素材广场</strong>：浏览和下载社区分享的作品</p>
              <p><strong className="text-slate-900">📤 分享作品</strong>：将你的作品分享到广场</p>
              <p><strong className="text-slate-900">🔗 分享链接</strong>：生成分享链接，分享给朋友</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm">6</span>
              专业拼豆工具
            </h3>
            <div className="space-y-3">
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-800 mb-2">👁️ 颜色高亮</p>
                <p className="text-xs text-slate-600 mb-2">在右侧颜色列表中，点击颜色旁的眼睛图标，可以高亮该颜色，其他颜色会变透明，方便你专注于某一种颜色的拼豆。</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>默认透明度 90%，可调节范围 50%-100%</li>
                  <li>点击已高亮颜色的眼睛图标可取消高亮</li>
                  <li>支持在主编辑器和沉浸拼豆模式中使用</li>
                </ul>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl">
                <p className="text-sm font-bold text-slate-800 mb-2">🎯 沉浸拼豆模式</p>
                <p className="text-xs text-slate-600 mb-2">点击顶部工具栏的「拼豆」按钮，进入全屏沉浸模式，像看图纸一样拼豆！</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>每个像素显示色号，对照拼豆更准确</li>
                  <li>右侧显示完整图例和颜色数量</li>
                  <li>支持标尺、辅助线、网格线开关</li>
                  <li>可自由缩放和拖动画布</li>
                  <li>锁定功能防止误触，专注拼豆</li>
                  <li>按 ESC 键退出沉浸模式</li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3 rounded-xl">
                <p className="text-xs text-amber-700"><strong>💡 推荐工作流：</strong>设计图纸 → 进入沉浸模式 → 按颜色高亮 → 逐个颜色完成拼豆</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">7</span>
              快捷键
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong className="text-slate-900">Ctrl+Z</strong>：撤销</p>
              <p><strong className="text-slate-900">Ctrl+Y / Ctrl+Shift+Z</strong>：重做</p>
              <p><strong className="text-slate-900">Ctrl+Shift+Z</strong>：重做（部分浏览器）</p>
              <p><strong className="text-slate-900">Ctrl+C</strong>：复制</p>
              <p><strong className="text-slate-900">Ctrl+V</strong>：粘贴</p>
              <p><strong className="text-slate-900">Delete</strong>：清除选中区域</p>
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
