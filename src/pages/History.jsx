import { ArrowLeft, ChevronRight, Clock3, Trash2 } from "lucide-react";
import GlassButton from "../components/GlassButton";

function formatDate(timestamp) {
  if (!timestamp) return "未知时间";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default function History({ records, onBack, onOpen, onDelete, onClear }) {
  return (
    <div className="min-h-[100svh] px-6 py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-blur-surface-hover transition-colors cursor-pointer"
            aria-label="返回主页"
          >
            <ArrowLeft size={16} className="text-blur-text-muted" />
          </button>
          <div className="text-center">
            <p className="text-[10px] tracking-[0.28em] text-blur-text-light uppercase">Blur Archive</p>
            <h1 className="text-xl font-medium text-blur-text mt-1">历史画像</h1>
          </div>
          <div className="w-9 h-9" aria-hidden="true" />
        </header>

        {records.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-full glass-strong flex items-center justify-center mb-5">
              <Clock3 size={22} className="text-blur-accent" />
            </div>
            <h2 className="text-lg text-blur-text mb-2">还没有历史画像</h2>
            <p className="text-sm text-blur-text-muted leading-relaxed">完成一次测试后，结果会留在这台设备上。</p>
            <GlassButton onClick={onBack} className="mt-7">回到主页</GlassButton>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-4">
              <p className="text-xs text-blur-text-muted">{records.length} 次记录 · 仅保存在当前设备</p>
              <button onClick={onClear} className="text-xs text-blur-text-light hover:text-blur-accent transition-colors cursor-pointer">
                清空全部
              </button>
            </div>
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="glass rounded-2xl p-4 flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-full glass-strong flex items-center justify-center text-2xl shrink-0">
                    {record.result?.archetype?.symbol || "◌"}
                  </div>
                  <button onClick={() => onOpen(record)} className="flex-1 min-w-0 text-left cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="text-base text-blur-text truncate">{record.result?.archetype?.title || "未命名画像"}</span>
                      <ChevronRight size={14} className="text-blur-text-light group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-xs text-blur-text-muted mt-1">{formatDate(record.createdAt)}</p>
                  </button>
                  <button
                    onClick={() => onDelete(record.id)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-blur-text-light/60 hover:text-red-300 hover:bg-red-300/10 transition-colors cursor-pointer"
                    aria-label={`删除 ${formatDate(record.createdAt)} 的记录`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

