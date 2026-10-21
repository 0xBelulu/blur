import { useState } from "react";
import { questions } from "../data/questions";
import CatalogShell from "../components/CatalogShell";
import AccordionCard from "../components/AccordionCard";

const TYPE_LABELS = {
  single: "单选",
  scale: "量表",
  rank: "排序",
};

const TYPE_COLORS = {
  single: "text-blue-400/80",
  scale: "text-purple-400/80",
  rank: "text-amber-400/80",
};

function DetailContent({ question, index }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] text-blur-text-muted">#{index + 1}</span>
        <span className="text-[11px] text-blur-text-muted">
          {TYPE_LABELS[question.type] || "单选"}
        </span>
      </div>

      <p className="text-sm text-blur-text leading-relaxed mb-3">
        {question.text}
      </p>

      <div className="pt-3 border-t border-blur-border/40 space-y-1.5">
        {question.type === "scale" ? (
          <p className="text-xs text-blur-text-muted italic">
            1-5 同意程度量表（完全不同意 → 完全同意）
          </p>
        ) : (
          question.options?.map((opt) => (
            <div key={opt.id} className="flex items-start gap-2.5">
              <span className="text-xs text-blur-text-muted mt-0.5 flex-shrink-0 font-medium">
                {opt.id}.
              </span>
              <span className="text-sm text-blur-text-light leading-relaxed">
                {opt.text}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default function Questions({ onBack }) {
  const [openId, setOpenId] = useState(null);

  return (
    <CatalogShell
      title={`全部题目 (${questions.length})`}
      intro={`共 ${questions.length} 道题，涵盖单选、量表与排序三种类型。仅作预览，请在测试中作答。`}
      onBack={onBack}
    >
      <div className="space-y-2">
        {questions.map((q, i) => {
          const typeLabel = TYPE_LABELS[q.type] || "单选";
          const typeColor = TYPE_COLORS[q.type] || TYPE_COLORS.single;
          const isOpen = openId === q.id;

          return (
            <AccordionCard
              key={q.id}
              isOpen={isOpen}
              onToggle={() => setOpenId(isOpen ? null : q.id)}
              summary={
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`font-medium flex-shrink-0 text-[11px] ${typeColor}`}>
                    [{typeLabel}]
                  </span>
                  <span className="text-[11px] text-blur-text-muted/50 flex-shrink-0">
                    #{i + 1}
                  </span>
                  <span className="text-sm text-blur-text truncate">{q.text}</span>
                </div>
              }
            >
              <DetailContent question={q} index={i} />
            </AccordionCard>
          );
        })}
      </div>
    </CatalogShell>
  );
}
