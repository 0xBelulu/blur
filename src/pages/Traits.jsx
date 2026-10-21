import { useState } from "react";
import { DIMENSIONS, tagPool } from "../data/tags";
import { ARCHETYPE_PROFILES } from "../data/archetypeProfiles";
import TraitWeightChart from "../components/TraitWeightChart";
import CatalogShell from "../components/CatalogShell";
import AccordionCard from "../components/AccordionCard";

export default function Traits({ onBack }) {
  const [openTraitGroup, setOpenTraitGroup] = useState(null);

  return (
    <CatalogShell
      title="五十余枚特质标签"
      intro="每种原型对应一组特质标签。它们像散落在各处的碎片，单独看是碎片，组合起来才是一幅完整的画面。"
      onBack={onBack}
    >
      <div className="space-y-2">
        {Object.entries(DIMENSIONS).map(([key, dim]) => {
          const traitObjects = dim.traits
            .map((traitKey) => {
              const trait = tagPool[traitKey];
              if (!trait) return null;
              return {
                key: traitKey,
                text: trait.text,
                weight: trait.weight,
                detail: trait.detail,
              };
            })
            .filter(Boolean);

          const isOpen = openTraitGroup === key;

          return (
            <AccordionCard
              key={key}
              isOpen={isOpen}
              onToggle={() => setOpenTraitGroup(isOpen ? null : key)}
              summary={<span className="text-sm font-medium text-blur-text">{dim.name}</span>}
            >
              <div className="flex flex-wrap gap-2">
                {traitObjects.map((trait) => (
                  <span
                    key={trait.key}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs border border-blur-border/30 bg-blur-surface/20 text-blur-text-muted"
                    title={trait.detail}
                  >
                    {trait.text}
                  </span>
                ))}
              </div>
              <TraitWeightChart traits={traitObjects} color={ARCHETYPE_PROFILES[key]?.color} />
            </AccordionCard>
          );
        })}
      </div>
    </CatalogShell>
  );
}
