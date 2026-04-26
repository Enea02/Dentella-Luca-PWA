import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { AppFrame } from "../ui/AppFrame";
import { c } from "../colors";

// Timeline:
// 0-20:  fade in
// 20-60: table loads (rows stagger in)
// 60-190: cells toggle progressively
// 190-210: fade out

const PRODUCTS = [
  "Cornetto vuoto",
  "Cornetto cioc.",
  "Veneziana",
  "Filone",
  "Pagnotta",
  "Pizza bianca",
  "Pizza rossa",
];

const CUSTOMERS = [
  "Bar Roma",
  "Ristorante Da Luigi",
  "Hotel Centrale",
  "Caffè Italia",
  "Pasticceria",
];

// Which cells exist per customer (sparse matrix)
const CELL_DATA: Record<string, Record<string, { qty: number; unit: string }>> = {
  "Bar Roma":            { "Cornetto vuoto": { qty: 10, unit: "pz" }, "Cornetto cioc.": { qty: 8, unit: "pz" }, "Pizza bianca": { qty: 4, unit: "pz" } },
  "Ristorante Da Luigi": { "Filone": { qty: 5, unit: "pz" }, "Pagnotta": { qty: 2, unit: "kg" }, "Pizza rossa": { qty: 3, unit: "pz" } },
  "Hotel Centrale":      { "Cornetto vuoto": { qty: 20, unit: "pz" }, "Veneziana": { qty: 6, unit: "pz" } },
  "Caffè Italia":        { "Cornetto vuoto": { qty: 8, unit: "pz" }, "Cornetto cioc.": { qty: 6, unit: "pz" } },
  "Pasticceria":         { "Pizza bianca": { qty: 3, unit: "pz" }, "Pizza rossa": { qty: 2, unit: "pz" } },
};

// Toggle sequence: [customerIdx, productIdx] pairs, each at a specific frame
const TOGGLE_SEQUENCE: Array<{ custIdx: number; prodIdx: number; atFrame: number }> = [
  { custIdx: 0, prodIdx: 0, atFrame: 65 },
  { custIdx: 0, prodIdx: 1, atFrame: 80 },
  { custIdx: 1, prodIdx: 3, atFrame: 95 },
  { custIdx: 2, prodIdx: 0, atFrame: 110 },
  { custIdx: 0, prodIdx: 5, atFrame: 125 },
  { custIdx: 1, prodIdx: 4, atFrame: 140 },
  { custIdx: 3, prodIdx: 0, atFrame: 155 },
  { custIdx: 2, prodIdx: 2, atFrame: 168 },
  { custIdx: 4, prodIdx: 5, atFrame: 180 },
];

export const Produzione = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [195, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);

  // Set of toggled cells
  const toggledCells = new Set(
    TOGGLE_SEQUENCE
      .filter(t => frame >= t.atFrame)
      .map(t => `${t.custIdx}-${t.prodIdx}`)
  );

  const rowOpacity = (rowIdx: number) =>
    interpolate(frame, [20 + rowIdx * 7, 45 + rowIdx * 7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const COL_W = 110;
  const NAME_W = 160;

  return (
    <AbsoluteFill style={{ opacity }}>
      <AppFrame activeTab="Produzione">
        <div style={{
          backgroundColor: c.white,
          borderRadius: 24,
          border: `1px solid ${c.border}`,
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${c.border}` }}>
            <h2 style={{ margin: 0, fontWeight: 600, fontSize: 17, color: c.slate900 }}>Produzione</h2>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto", flex: 1 }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "max-content" }}>
              <thead>
                <tr>
                  <th style={{
                    width: NAME_W, padding: "10px 14px", textAlign: "left",
                    fontSize: 13, fontWeight: 500, color: c.slate500,
                    backgroundColor: c.slate50, borderBottom: `1px solid ${c.border}`,
                    borderRight: `1px solid ${c.border}`,
                  }}>
                    Cliente
                  </th>
                  {PRODUCTS.map((prod) => (
                    <th key={prod} style={{
                      width: COL_W, padding: "10px 8px", textAlign: "center",
                      fontSize: 12, fontWeight: 500, color: c.slate500,
                      backgroundColor: c.slate50, borderBottom: `1px solid ${c.border}`,
                      borderRight: `1px solid ${c.border}`,
                    }}>
                      {prod}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CUSTOMERS.map((cust, custIdx) => (
                  <tr key={cust} style={{ borderBottom: `1px solid ${c.border}`, opacity: rowOpacity(custIdx) }}>
                    <td style={{
                      width: NAME_W, padding: "0 14px",
                      fontSize: 14, fontWeight: 500, color: c.slate800,
                      borderRight: `1px solid ${c.border}`,
                      height: 56,
                    }}>
                      {cust}
                    </td>
                    {PRODUCTS.map((prod, prodIdx) => {
                      const cellKey = `${custIdx}-${prodIdx}`;
                      const cellData = CELL_DATA[cust]?.[prod];
                      const isDone = toggledCells.has(cellKey) && !!cellData;

                      return (
                        <td key={prod} style={{
                          width: COL_W, padding: 0, textAlign: "center",
                          borderRight: `1px solid ${c.border}`,
                          height: 56,
                        }}>
                          {cellData ? (
                            <div style={{
                              width: "100%",
                              height: 56,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: isDone ? c.emerald50 : "transparent",
                              cursor: "pointer",
                              gap: 2,
                            }}>
                              <span style={{
                                fontSize: 15, fontWeight: 700,
                                color: isDone ? c.emerald700 : c.slate800,
                                lineHeight: 1,
                              }}>
                                {cellData.qty}
                              </span>
                              <span style={{
                                fontSize: 11,
                                color: isDone ? c.emerald500 : c.slate400,
                                lineHeight: 1,
                              }}>
                                {cellData.unit}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: c.slate300, fontSize: 16 }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AppFrame>
    </AbsoluteFill>
  );
};
