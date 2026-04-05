"use client";

import type { PlanterBoxPublic } from "@greenspace/shared";
import { BoxCard } from "./BoxCard";
import { fonts } from "@/styles/theme";

interface GreenhouseMapProps {
  boxes: PlanterBoxPublic[];
  onSelectBox?: (boxId: number) => void;
}

export function GreenhouseMap({ boxes, onSelectBox }: GreenhouseMapProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
        gap: "0.75rem",
        width: "100%",
        fontFamily: fonts.body,
      }}
    >
      {boxes.map((box) => (
        <BoxCard
          key={box.id}
          name={box.name}
          state={box.state}
          onClick={onSelectBox ? () => onSelectBox(box.id) : undefined}
        />
      ))}
    </div>
  );
}
