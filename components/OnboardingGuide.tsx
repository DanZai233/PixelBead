import React, { useState } from 'react';

interface OnboardingGuideProps {
  onClose: () => void;
}

interface Step {
  icon: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  accent: string;
}

const steps: Step[] = [
  {
    icon: '👋',
    title: '欢迎来到拼豆糕手',
    subtitle: '功能强大的在线拼豆设计工具',
    accent: 'from-indigo-500 to-purple-500',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          拼豆糕手是一款专业的拼豆像素画在线设计工具，支持 <strong>图片转拼豆、智能生成拼豆图、多品牌色号</strong>等功能。
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '🖼️', label: '图片转拼豆' },
            { icon: '🤖', label: '智能生成' },
            { icon: '🎨', label: '多品牌色号' },
            { icon: '📤', label: '导出分享' },
            { icon: '🧊', label: '3D 预览' },
            { icon: '🌐', label: '素材广场' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-100">
              <span className="text-xl">{f.icon}</span>
              <span className="text-sm font-bold text-slate-700">{f.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center mt-2">接下来为你介绍核心功能 →</p>
      </div>
    ),
  },
  {
    icon: '🖼️',
    title: '图片一键转拼豆',
    subtitle: '上传图片自动转换为拼豆图纸',
    accent: 'from-emerald-500 to-teal-500',
    content: (
      <div className="space-y-4">
        <div className="bg-emerald-50 p-4 rounded-xl">
          <p className="text-sm text-slate-700 leading-relaxed">
            点击左侧工具栏的 <strong>「智能画笔」✨</strong> 按钮，选择 <strong>「上传图片」</strong>，即可将任意图片转换为拼豆图案。
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <span className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5">1</span>
            <div>
              <p className="text-sm font-bold text-slate-800">选择合适的画布大小</p>
              <p className="text-xs text-slate-500">画布越大，转换后越清晰。推荐 <strong>48×48</strong> 或 <strong>64×64</strong> 获得较好效果。大尺寸如 100×100 会更细腻。</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5">2</span>
            <div>
              <p className="text-sm font-bold text-slate-800">上传图片</p>
              <p className="text-xs text-slate-500">支持 JPG、PNG 等格式。系统会自动将图片缩放到画布大小并匹配最接近的拼豆颜色。</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5">3</span>
            <div>
              <p className="text-sm font-bold text-slate-800">选择裁切方式</p>
              <p className="text-xs text-slate-500">支持 <strong>左上、居中、右下</strong> 三种对齐方式，选择最适合的构图。</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
          <p className="text-xs text-amber-700"><strong>💡 小技巧：</strong>先调大画布（如 64×64），再上传图片，效果更好！</p>
        </div>
      </div>
    ),
  },
  {
    icon: '🎨',
    title: '底图参考 & 图层功能',
    subtitle: '上传参考图辅助手绘拼豆',
    accent: 'from-blue-500 to-cyan-500',
    content: (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-xl">
          <p className="text-sm text-slate-700 leading-relaxed">
            除了自动转换，你还可以上传一张 <strong>底图参考</strong>，然后照着参考图手动一颗颗拼豆。
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <span className="text-lg">📷</span>
            <div>
              <p className="text-sm font-bold text-slate-800">上传底图</p>
              <p className="text-xs text-slate-500">点击 <strong>「导入」→「背景底图」</strong>，上传参考图片作为底图。底图不会影响实际拼豆数据。</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg">🔀</span>
            <div>
              <p className="text-sm font-bold text-slate-800">图层切换</p>
              <p className="text-xs text-slate-500">在画布上方可以切换 <strong>「拼豆层」</strong>和<strong>「背景层」</strong>。选择背景层时可以移动、缩放底图，对齐画板。</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg">🎚️</span>
            <div>
              <p className="text-sm font-bold text-slate-800">调整透明度</p>
              <p className="text-xs text-slate-500">调节底图的透明度，让参考图若隐若现，方便你在上面描绘拼豆。</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
          <p className="text-xs text-blue-700"><strong>💡 适用场景：</strong>想把一张喜欢的卡通图手动改编为拼豆时，底图参考非常好用！</p>
        </div>
      </div>
    ),
  },
  {
    icon: '✨',
    title: '智能画笔 & 智能生成',
    subtitle: '用文字或参考图快速得到拼豆风格图稿',
    accent: 'from-violet-500 to-purple-500',
    content: (
      <div className="space-y-4">
        <div className="bg-violet-50 p-4 rounded-xl">
          <p className="text-sm text-slate-700 leading-relaxed">
            <strong>智能画笔</strong>是拼豆糕手的核心功能之一，集合了多种智能创作方式。
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <span className="text-lg">🤖</span>
            <div>
              <p className="text-sm font-bold text-slate-800">一键智能生成</p>
              <p className="text-xs text-slate-500">输入文字描述（如「一只可爱的小猫」）或上传参考图，使用拼豆糕手自研的智能生成服务免费生成拼豆风格示意图，再导入画布继续编辑。</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg">🖼️</span>
            <div>
              <p className="text-sm font-bold text-slate-800">图片智能转换</p>
              <p className="text-xs text-slate-500">上传任意图片，自动匹配最接近的拼豆色号并转为图纸（本地处理，不上传原图至生成服务）。</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg">🎁</span>
            <div>
              <p className="text-sm font-bold text-slate-800">免费使用</p>
              <p className="text-xs text-slate-500">智能生成由服务端统一提供，无需在应用内配置任何密钥。遇到问题可点击底部 <strong>帮助</strong> 查看说明。</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: '👁️',
    title: '颜色高亮 & 沉浸拼豆',
    subtitle: '专业的拼豆体验工具',
    accent: 'from-amber-500 to-orange-500',
    content: (
      <div className="space-y-4">
        <div className="bg-amber-50 p-4 rounded-xl">
          <p className="text-sm text-slate-700 leading-relaxed">
            拼豆糕手提供了专业的拼豆辅助功能，让你的拼豆过程更轻松、更准确！
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <span className="text-lg">👁️</span>
            <div>
              <p className="text-sm font-bold text-slate-800">颜色高亮</p>
              <p className="text-xs text-slate-500">在右侧颜色列表，点击颜色旁的 <strong>「眼睛图标」</strong> 即可高亮该颜色，其他颜色变透明。可调节透明度（50%-100%），让你专注于某一种颜色的拼豆。</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-sm font-bold text-slate-800">沉浸拼豆模式</p>
              <p className="text-xs text-slate-500">点击顶部 <strong>「拼豆」</strong> 按钮进入全屏模式。每个像素显示色号，右侧有完整图例。支持缩放、拖动、锁定，让你专心拼豆！</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg">🔒</span>
            <div>
              <p className="text-sm font-bold text-slate-800">锁定功能</p>
              <p className="text-xs text-slate-500">拼豆时可以锁定画布，防止误触。锁定后无法缩放、拖动，确保你的拼豆进度安全。</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-xl">
          <p className="text-sm font-bold text-amber-600 mb-1">💡 拼豆小技巧</p>
          <p className="text-xs text-amber-700">使用沉浸模式 + 颜色高亮，按照图例逐个颜色完成拼豆，效率翻倍！</p>
        </div>
      </div>
    ),
  },
  {
    icon: '💾',
    title: '导出 & 导入 & 保存',
    subtitle: '多种方式保存和分享你的作品',
    accent: 'from-amber-500 to-orange-500',
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <span className="text-lg">🖼️</span>
            <div>
              <p className="text-sm font-bold text-slate-800">导出图纸（PNG）</p>
              <p className="text-xs text-slate-500">点击 <strong>「导出图片」</strong>，生成带色号标注的拼豆图纸，可选参考线和镜像。直接对照图纸拼豆！</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg">📕</span>
            <div>
              <p className="text-sm font-bold text-slate-800">生成小红书分享图</p>
              <p className="text-xs text-slate-500">导出时点击 <strong>「生成小红书分享图」</strong>，自动生成精美预览图 + 复制文案到剪贴板，一键发小红书！</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg">📋</span>
            <div>
              <p className="text-sm font-bold text-slate-800">导出 JSON 图纸</p>
              <p className="text-xs text-slate-500">点击 <strong>「导出」</strong> 按钮，保存为 JSON 文件。下次可以 <strong>「导入」</strong> 继续编辑，不丢失任何数据。</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg">🔗</span>
            <div>
              <p className="text-sm font-bold text-slate-800">分享链接</p>
              <p className="text-xs text-slate-500">点击 <strong>「分享」</strong> 生成 7 天有效的分享链接，朋友打开即可查看你的作品。</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: '🌐',
    title: '素材广场 — 分享你的作品！',
    subtitle: '发现灵感，展示才华',
    accent: 'from-rose-500 to-pink-500',
    content: (
      <div className="space-y-4">
        <div className="bg-rose-50 p-4 rounded-xl">
          <p className="text-sm text-slate-700 leading-relaxed">
            <strong>素材广场</strong>是拼豆糕手的社区功能——你可以浏览别人的优秀作品，也可以把自己的作品分享出去！
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <span className="text-lg">🔍</span>
            <div>
              <p className="text-sm font-bold text-slate-800">浏览 & 搜索</p>
              <p className="text-xs text-slate-500">点击右上角 <strong>「广场」</strong> 按钮，按标签筛选或搜索你感兴趣的图纸。支持 <strong>「热门」</strong> 排序，发现最受欢迎的作品。</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg">📥</span>
            <div>
              <p className="text-sm font-bold text-slate-800">一键应用</p>
              <p className="text-xs text-slate-500">看到喜欢的图纸？点击「一键应用」直接加载到画布，还可以在此基础上修改和再创作。</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-lg">📤</span>
            <div>
              <p className="text-sm font-bold text-slate-800">发布你的作品</p>
              <p className="text-xs text-slate-500">点击 <strong>「分享」→「发布到素材广场」</strong>，填写名称、作者和标签，你的作品就会出现在广场里！</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 p-4 rounded-xl text-center">
          <p className="text-sm font-bold text-rose-600 mb-1">🎉 期待你的作品！</p>
          <p className="text-xs text-rose-500">多上传、多分享，让更多人看到你的拼豆创意！</p>
        </div>
      </div>
    ),
  },
];

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/70 z-[3000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className={`bg-gradient-to-r ${step.accent} p-6 pb-8 text-white shrink-0`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
              {currentStep + 1} / {steps.length}
            </span>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors text-sm font-bold"
            >
              跳过
            </button>
          </div>
          <div className="text-4xl mb-2">{step.icon}</div>
          <h2 className="text-xl font-black">{step.title}</h2>
          <p className="text-sm text-white/80 mt-1">{step.subtitle}</p>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto min-h-0">
          {step.content}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center gap-3 shrink-0 bg-white">
          {/* Dots */}
          <div className="flex gap-1.5 flex-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all ${i === currentStep ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(s => s - 1)}
                className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                上一步
              </button>
            )}
            <button
              onClick={() => isLast ? onClose() : setCurrentStep(s => s + 1)}
              className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all active:scale-95 shadow-lg bg-gradient-to-r ${step.accent}`}
            >
              {isLast ? '开始创作 🎨' : '下一步 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
