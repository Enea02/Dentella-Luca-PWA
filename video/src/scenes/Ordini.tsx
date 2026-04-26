import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { AppFrame } from "../ui/AppFrame";
import { c } from "../colors";

// Frame timeline (scene-relative):
// 0-20:   fade in
// 20-50:  customer list loads (stagger)
// 50-80:  Bar Roma gets selected
// 80-110: order items fade in
// 110-200: items toggle one by one
// 200-240: fade out

const CUSTOMERS = [
  { id: "c1", name: "Bar Roma", type: "Fisso", done: 0, total: 4 },
  { id: "c2", name: "Ristorante Da Luigi", type: "Fisso", done: 0, total: 4 },
  { id: "c3", name: "Hotel Centrale", type: "Fisso", done: 0, total: 4 },
  { id: "c4", name: "Caffè Italia", type: "Fisso", done: 0, total: 3 },
  { id: "c5", name: "Cliente Giornaliero 1", type: "Giornaliero", done: 0, total: 2 },
];

const ORDER_ITEMS = [
  { name: "Cornetto vuoto", section: "Dolci", qty: 10, unit: "pz" },
  { name: "Cornetto cioccolato", section: "Dolci", qty: 8, unit: "pz" },
  { name: "Veneziana", section: "Dolci", qty: 6, unit: "pz" },
  { name: "Pizza bianca", section: "Salati", qty: 4, unit: "pz" },
];

const CheckCircle = ({ done, size = 20 }: { done: boolean; size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      border: `2px solid ${done ? c.emerald500 : c.slate300}`,
      backgroundColor: done ? c.emerald500 : "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      transition: "all 0.2s",
    }}
  >
    {done && (
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )}
  </div>
);

export const Ordini = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [220, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);

  const customerSelected = frame >= 50;
  const orderOpacity = interpolate(frame, [80, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Items toggle progressively from frame 110
  const itemsDone = frame < 110 ? 0 : frame < 130 ? 1 : frame < 155 ? 2 : frame < 180 ? 3 : 4;

  // Customer list stagger
  const customerOpacity = (idx: number) =>
    interpolate(frame, [20 + idx * 8, 40 + idx * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const customerY = (idx: number) =>
    interpolate(frame, [20 + idx * 8, 40 + idx * 8], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Title spring
  const titleSpring = spring({ frame, fps, config: { damping: 18 }, durationInFrames: 25 });

  return (
    <AbsoluteFill style={{ opacity }}>
      <AppFrame activeTab="Ordini">
        {/* Section title */}
        <div style={{ transform: `scale(${titleSpring})`, transformOrigin: "left center", marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: c.slate900 }}>Clienti</h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, height: "calc(100% - 52px)" }}>
          {/* Customer list */}
          <div style={{
            backgroundColor: c.white,
            borderRadius: 24,
            border: `1px solid ${c.border}`,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{ padding: 12, borderBottom: `1px solid ${c.border}` }}>
              <div style={{
                backgroundColor: c.slate50,
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: "8px 12px",
                fontSize: 14,
                color: c.slate400,
              }}>
                Cerca cliente...
              </div>
            </div>

            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              {CUSTOMERS.map((cust, idx) => {
                const isSelected = customerSelected && idx === 0;
                return (
                  <div
                    key={cust.id}
                    style={{
                      opacity: customerOpacity(idx),
                      transform: `translateY(${customerY(idx)}px)`,
                      padding: "12px 16px",
                      borderRadius: 12,
                      backgroundColor: isSelected ? c.slate900 : c.white,
                      border: isSelected ? "none" : `1px solid ${c.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14, color: isSelected ? "#fff" : c.slate900 }}>
                        {cust.name}
                      </div>
                      <div style={{ fontSize: 12, color: isSelected ? c.slate400 : c.slate500 }}>
                        {cust.type}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? c.slate300 : c.slate500 }}>
                      {isSelected ? `${itemsDone}/4` : `0/${cust.total}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order detail */}
          <div style={{
            backgroundColor: c.white,
            borderRadius: 24,
            border: `1px solid ${c.border}`,
            overflow: "hidden",
            opacity: orderOpacity,
          }}>
            <div style={{
              padding: "14px 20px",
              borderBottom: `1px solid ${c.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 17, color: c.slate900 }}>Bar Roma</div>
                <div style={{ fontSize: 12, color: c.slate500 }}>Cliente fisso</div>
              </div>
              <div style={{
                padding: "5px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: itemsDone > 0 ? c.emerald50 : c.slate100,
                color: itemsDone > 0 ? c.emerald700 : c.slate500,
              }}>
                {itemsDone}/4 completati
              </div>
            </div>

            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {ORDER_ITEMS.map((item, idx) => {
                const done = idx < itemsDone;
                return (
                  <div key={item.name} style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: `1px solid ${done ? c.emerald200 : c.border}`,
                    backgroundColor: done ? c.emerald50 : c.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <CheckCircle done={done} />
                      <div>
                        <div style={{
                          fontWeight: 500,
                          fontSize: 15,
                          color: done ? c.emerald800 : c.slate900,
                          textDecoration: done ? "line-through" : "none",
                          opacity: done ? 0.7 : 1,
                        }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 12, color: done ? c.emerald600 : c.slate500 }}>
                          {item.section}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: done ? c.emerald700 : c.slate700 }}>
                      {item.qty} {item.unit}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AppFrame>
    </AbsoluteFill>
  );
};
