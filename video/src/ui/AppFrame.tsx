import React from "react";
import { c } from "../colors";

const NAV_LINKS = ["Ordini", "Totali", "Produzione", "Liste", "Gestione"];

interface AppFrameProps {
  activeTab: string;
  workMode?: boolean;
  children: React.ReactNode;
}

export const AppFrame: React.FC<AppFrameProps> = ({
  activeTab,
  workMode = false,
  children,
}) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      backgroundColor: c.bg,
      display: "flex",
      flexDirection: "column",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    }}
  >
    {/* Navbar */}
    <header
      style={{
        backgroundColor: "rgba(255,255,255,0.9)",
        borderBottom: `1px solid ${c.border}`,
        padding: "14px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <span style={{ fontWeight: 700, fontSize: 22, color: c.slate900, letterSpacing: -0.5 }}>
        Panificio
      </span>

      {/* Nav */}
      <nav style={{ display: "flex", gap: 4 }}>
        {NAV_LINKS.map((label) => (
          <div
            key={label}
            style={{
              padding: "7px 18px",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 500,
              backgroundColor: activeTab === label ? c.slate900 : "transparent",
              color: activeTab === label ? "#fff" : c.slate600,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        ))}
      </nav>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Date */}
        <div
          style={{
            padding: "5px 14px",
            borderRadius: 8,
            border: `1px solid ${c.border}`,
            fontSize: 13,
            color: c.slate700,
          }}
        >
          Dom 27 Apr
        </div>

        {/* Work mode button */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            backgroundColor: workMode ? c.amber100 : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Maximize2 / Minimize2 icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={workMode ? c.amber700 : c.slate500}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {workMode ? (
              <>
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="10" y1="14" x2="3" y2="21" />
                <line x1="21" y1="3" x2="14" y2="10" />
              </>
            ) : (
              <>
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </>
            )}
          </svg>
        </div>

        {/* Role badge */}
        <div
          style={{
            padding: "5px 10px",
            borderRadius: 8,
            backgroundColor: c.amber100,
            color: c.amber700,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Titolare
        </div>

        {/* Logout */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={c.slate500}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
      </div>
    </header>

    {/* Content */}
    <main style={{ flex: 1, padding: "28px 40px", overflow: "hidden" }}>
      {children}
    </main>
  </div>
);
