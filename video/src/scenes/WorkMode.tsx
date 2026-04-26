import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AppFrame } from "../ui/AppFrame";
import { c } from "../colors";

// Timeline:
// 0-20:  fade in (normal mode, all done)
// 20-50: navbar work mode button pulses/activates
// 50-90: items expand (spring)
// 90-130: one more item gets toggled in work mode (to show big checkbox)
// 130-150: fade out

const ORDER_ITEMS = [
  { name: "Cornetto vuoto", section: "Dolci", qty: 10, unit: "pz", done: true },
  { name: "Cornetto cioccolato", section: "Dolci", qty: 8, unit: "pz", done: true },
  { name: "Veneziana", section: "Dolci", qty: 6, unit: "pz", done: false },
  { name: "Pizza bianca", section: "Salati", qty: 4, unit: "pz", done: false },
];

export const WorkMode = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [130, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);

  const workModeActive = frame >= 40;

  // Spring that drives the size expansion
  const expandProgress = spring({
    frame: frame - 40,
    fps,
    config: { damping: 16, stiffness: 120 },
    durationInFrames: 40,
  });

  // 3rd item gets toggled at frame 100
  const thirdItemDone = frame >= 100;

  const itemPadding = workModeActive
    ? interpolate(expandProgress, [0, 1], [14, 22])
    : 14;
  const checkSize = workModeActive
    ? interpolate(expandProgress, [0, 1], [20, 28])
    : 20;
  const fontSize = workModeActive
    ? interpolate(expandProgress, [0, 1], [15, 18])
    : 15;

  // Highlight ring on the work mode button
  const buttonGlow = interpolate(
    frame,
    [30, 40, 55],
    [0, 1, 0.6],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const items = ORDER_ITEMS.map((item, idx) => ({
    ...item,
    done: item.done || (idx === 2 && thirdItemDone),
  }));

  return (
    <AbsoluteFill style={{ opacity }}>
      <AppFrame activeTab="Ordini" workMode={workModeActive}>
        {/* Label */}
        {workModeActive && (
          <div style={{
            position: "absolute",
            top: 100,
            right: 40,
            padding: "6px 16px",
            borderRadius: 999,
            backgroundColor: c.amber100,
            color: c.amber700,
            fontSize: 14,
            fontWeight: 600,
            opacity: interpolate(expandProgress, [0, 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            Modalità Lavoro attiva
          </div>
        )}

        {/* Work mode button pulse ring (shown before activation) */}
        {!workModeActive && (
          <div style={{
            position: "absolute",
            top: 22,
            right: 136,
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `2px solid ${c.amber600}`,
            opacity: buttonGlow,
            boxShadow: `0 0 0 ${buttonGlow * 6}px ${c.amber100}`,
          }} />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, height: "100%" }}>
          {/* Customer list (simplified) */}
          <div style={{
            backgroundColor: c.white,
            borderRadius: 24,
            border: `1px solid ${c.border}`,
            overflow: "hidden",
          }}>
            <div style={{ padding: 12, borderBottom: `1px solid ${c.border}` }}>
              <div style={{ backgroundColor: c.slate50, border: `1px solid ${c.border}`, borderRadius: 12, padding: "8px 12px", fontSize: 14, color: c.slate400 }}>
                Cerca cliente...
              </div>
            </div>
            <div style={{ padding: 8 }}>
              <div style={{
                padding: `${itemPadding}px 16px`,
                borderRadius: 12,
                backgroundColor: c.slate900,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: fontSize, color: "#fff" }}>Bar Roma</div>
                  <div style={{ fontSize: 12, color: c.slate400 }}>Fisso</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: fontSize, color: c.slate300 }}>
                  {items.filter(i => i.done).length}/4
                </div>
              </div>
            </div>
          </div>

          {/* Order detail */}
          <div style={{
            backgroundColor: c.white,
            borderRadius: 24,
            border: `1px solid ${c.border}`,
            overflow: "hidden",
          }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${c.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 17, color: c.slate900 }}>Bar Roma</div>
                <div style={{ fontSize: 12, color: c.slate500 }}>Cliente fisso</div>
              </div>
              <div style={{
                padding: "5px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500,
                backgroundColor: c.emerald50, color: c.emerald700,
              }}>
                {items.filter(i => i.done).length}/4 completati
              </div>
            </div>

            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((item) => (
                <div key={item.name} style={{
                  padding: `${itemPadding}px 18px`,
                  borderRadius: 14,
                  border: `1px solid ${item.done ? c.emerald200 : c.border}`,
                  backgroundColor: item.done ? c.emerald50 : c.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: checkSize,
                      height: checkSize,
                      borderRadius: "50%",
                      border: `2px solid ${item.done ? c.emerald500 : c.slate300}`,
                      backgroundColor: item.done ? c.emerald500 : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {item.done && (
                        <svg width={checkSize * 0.55} height={checkSize * 0.55} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: 500, fontSize, color: item.done ? c.emerald800 : c.slate900,
                        textDecoration: item.done ? "line-through" : "none", opacity: item.done ? 0.7 : 1,
                      }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 12, color: item.done ? c.emerald600 : c.slate500 }}>
                        {item.section}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize, color: item.done ? c.emerald700 : c.slate700 }}>
                    {item.qty} {item.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppFrame>
    </AbsoluteFill>
  );
};
