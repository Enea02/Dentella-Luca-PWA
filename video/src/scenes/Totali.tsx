import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { AppFrame } from "../ui/AppFrame";
import { c } from "../colors";

// Timeline:
// 0-20:  fade in
// 20-60: sections load
// 60-90: numbers count up
// 90-110: divisor appears and result shown
// 100-120: fade out

const SECTIONS = [
  {
    label: "Dolci",
    items: [
      { name: "Cornetto vuoto", total: 38, divisor: 6, unit: "pz" },
      { name: "Cornetto cioccolato", total: 22, divisor: 6, unit: "pz" },
      { name: "Veneziana", total: 12, divisor: 4, unit: "pz" },
      { name: "Bombolone", total: 8, divisor: 4, unit: "pz" },
    ],
  },
  {
    label: "Pane comune",
    items: [
      { name: "Filone", total: 15, divisor: null, unit: "pz" },
      { name: "Pagnotta", total: 6, divisor: null, unit: "kg" },
    ],
  },
  {
    label: "Salati",
    items: [
      { name: "Pizza bianca", total: 10, divisor: 1, unit: "pz" },
      { name: "Pizza rossa", total: 8, divisor: 1, unit: "pz" },
    ],
  },
];

export const Totali = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [100, 120], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);

  // Numbers count up
  const countProgress = interpolate(frame, [60, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const sectionOpacity = (idx: number) =>
    interpolate(frame, [20 + idx * 12, 45 + idx * 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity }}>
      <AppFrame activeTab="Totali">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" }}>
          {SECTIONS.map((section, sIdx) => (
            <div
              key={section.label}
              style={{
                backgroundColor: c.white,
                borderRadius: 24,
                border: `1px solid ${c.border}`,
                overflow: "hidden",
                opacity: sectionOpacity(sIdx),
              }}
            >
              {/* Section header */}
              <div style={{
                padding: "14px 20px",
                borderBottom: `1px solid ${c.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: c.slate50,
              }}>
                <span style={{ fontWeight: 600, fontSize: 16, color: c.slate900 }}>{section.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.slate400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Items */}
              <div style={{ padding: "8px 0" }}>
                {section.items.map((item) => {
                  const displayTotal = Math.round(item.total * countProgress);
                  return (
                    <div key={item.name} style={{
                      padding: "10px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: `1px solid ${c.border}`,
                    }}>
                      <span style={{ fontSize: 14, color: c.slate700 }}>{item.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: c.slate900 }}>
                          {displayTotal} {item.unit}
                        </span>
                        {item.divisor && countProgress > 0.8 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: c.slate400, fontSize: 13 }}>÷</span>
                            <div style={{
                              width: 40, height: 28,
                              border: `1px solid ${c.border}`,
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 600,
                              color: c.slate700,
                              backgroundColor: c.slate50,
                            }}>
                              {item.divisor}
                            </div>
                            <span style={{ color: c.slate400, fontSize: 13 }}>=</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: c.emerald700 }}>
                              {Math.ceil(item.total / item.divisor)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </AppFrame>
    </AbsoluteFill>
  );
};
