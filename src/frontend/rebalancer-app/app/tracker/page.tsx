"use client";

import { useState, useEffect } from "react";

// Exchange executed Jun 11, 2026 at $432,105.65; the $2,301.39 Jun 30 contribution
// is mirrored into the ghost. The separate Jun 15 residual-cash buys are excluded
// from both sides.
const START_DATE = "Jun 11, 2026";
const START_ISO = "2026-06-11";
const START_VALUE = 434407.04; // total invested (Jun 11 exchange + Jun 30 contribution)

// The ghost is priced with retail FFTHX NAVs (ER ~0.64%), but the fund actually
// sold was the K6 class (ER ~0.39%). NAVs are net of fees, so credit the ghost
// the ~0.25%/yr difference to approximate the K6 class's return.
const K6_FEE_ADVANTAGE = 0.0025;
function k6Adj() {
  const days = (Date.now() - new Date(START_ISO).getTime()) / 86400000;
  return 1 + (K6_FEE_ADVANTAGE * days) / 365;
}

const SHARES = {
  // Holdings per the ledger through Jul 10, 2026 (incl. reinvested dividends),
  // excluding the Jun 15 residual buys.
  FXAIX: 845.999,
  FSGGX: 5541.605,
  FXNAX: 9574.634,
  // Ghost: FFTHX-equivalent units bought with each cash flow at that day's close
  // (432,105.65/18.72 + 2,301.39/19.05). The real fund sold was the Freedom 2035
  // K6 class, so this proxies its return via retail FFTHX NAVs.
  FFTHX: 23203.375,
};

type Snapshot = { date: string; FXAIX: number; FSGGX: number; FXNAX: number; FFTHX: number; label?: string };

const HISTORY: Snapshot[] = [
  { date: "Jul 10", FXAIX: 263.26, FSGGX: 21.3, FXNAX: 10.37, FFTHX: 18.96, label: "Rebased" },
];

function calcThreeFund({ FXAIX, FSGGX, FXNAX }: { FXAIX: number; FSGGX: number; FXNAX: number }) {
  return SHARES.FXAIX * FXAIX + SHARES.FSGGX * FSGGX + SHARES.FXNAX * FXNAX;
}
function calcFFTHX({ FFTHX }: { FFTHX: number }) {
  return SHARES.FFTHX * FFTHX * k6Adj();
}
function pct(a: number, b: number) {
  return ((a - b) / b * 100).toFixed(2);
}
function fmt(n: number) {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtPct(n: string) {
  const v = parseFloat(n);
  return (v >= 0 ? "+" : "") + v + "%";
}

function Spark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 80, h = 28, pad = 3;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r="3" fill={color} />
    </svg>
  );
}

export default function Tracker() {
  const [navInputs, setNavInputs] = useState({ FXAIX: "", FSGGX: "", FXNAX: "", FFTHX: "" });
  const [history, setHistory] = useState<Snapshot[]>(HISTORY);
  const [today, setToday] = useState<{ threeFund: number; ffthx: number } | null>(null);
  const [dateLabel, setDateLabel] = useState("Today");
  const [added, setAdded] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function fetchPrices() {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/fund-prices");
      if (!res.ok) throw new Error("Request failed");
      const prices: Record<string, number | null> = await res.json();
      setNavInputs((p) => ({
        FXAIX: prices.FXAIX != null ? String(prices.FXAIX) : p.FXAIX,
        FSGGX: prices.FSGGX != null ? String(prices.FSGGX) : p.FSGGX,
        FXNAX: prices.FXNAX != null ? String(prices.FXNAX) : p.FXNAX,
        FFTHX: prices.FFTHX != null ? String(prices.FFTHX) : p.FFTHX,
      }));
      setAdded(false);
    } catch {
      setFetchError("Could not fetch prices — try again or enter manually.");
    } finally {
      setFetching(false);
    }
  }

  function handleNav(fund: string, val: string) {
    setNavInputs((p) => ({ ...p, [fund]: val }));
    setAdded(false);
  }

  const allEntered = Object.values(navInputs).every((v) => v !== "" && !isNaN(parseFloat(v)));

  useEffect(() => {
    if (allEntered) {
      const navs = {
        FXAIX: parseFloat(navInputs.FXAIX),
        FSGGX: parseFloat(navInputs.FSGGX),
        FXNAX: parseFloat(navInputs.FXNAX),
        FFTHX: parseFloat(navInputs.FFTHX),
      };
      setToday({ threeFund: calcThreeFund(navs), ffthx: calcFFTHX(navs) });
    } else {
      setToday(null);
    }
  }, [navInputs]);

  function saveToday() {
    if (!allEntered) return;
    const snap: Snapshot = {
      date: dateLabel,
      FXAIX: parseFloat(navInputs.FXAIX),
      FSGGX: parseFloat(navInputs.FSGGX),
      FXNAX: parseFloat(navInputs.FXNAX),
      FFTHX: parseFloat(navInputs.FFTHX),
    };
    setHistory((h) => {
      const exists = h.find((x) => x.date === dateLabel);
      if (exists) return h.map((x) => (x.date === dateLabel ? snap : x));
      return [...h, snap];
    });
    setAdded(true);
  }

  const chartThree = history.map(calcThreeFund);
  const chartFF = history.map(calcFFTHX);

  const latestThree = today ? today.threeFund : chartThree[chartThree.length - 1];
  const latestFF = today ? today.ffthx : chartFF[chartFF.length - 1];
  const gap = latestThree - latestFF;
  const threePctFromStart = pct(latestThree, START_VALUE);
  const ffPctFromStart = pct(latestFF, START_VALUE);

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      background: "#0f0f13",
      minHeight: "100vh",
      color: "#e8e8ef",
      padding: "24px 20px",
      maxWidth: 560,
      margin: "0 auto",
      boxSizing: "border-box",
    }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#6b6b80", textTransform: "uppercase", marginBottom: 6 }}>
          Since {START_DATE} · Invested {fmt(START_VALUE)}
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
          3-Fund vs FFTHX
        </h1>
      </div>

      {/* Score cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Your 3-fund", value: latestThree, pctV: threePctFromStart, sparkVals: [...chartThree, ...(today ? [today.threeFund] : [])], color: "#7c6ff7" },
          { label: "FFTHX ghost", value: latestFF, pctV: ffPctFromStart, sparkVals: [...chartFF, ...(today ? [today.ffthx] : [])], color: "#3ecfa0" },
        ].map((c) => (
          <div key={c.label} style={{ background: "#1a1a24", borderRadius: 12, padding: "16px 16px 12px", border: "1px solid #2a2a38" }}>
            <div style={{ fontSize: 11, color: "#6b6b80", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 4, letterSpacing: "-0.5px" }}>{fmt(c.value)}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: parseFloat(c.pctV) >= 0 ? "#3ecfa0" : "#f76f6f", marginBottom: 10 }}>
              {fmtPct(c.pctV)} since start
            </div>
            <Spark values={c.sparkVals} color={c.color} />
          </div>
        ))}
      </div>

      {/* Gap banner */}
      <div style={{
        background: gap >= 0 ? "rgba(124,111,247,0.12)" : "rgba(62,207,160,0.10)",
        border: `1px solid ${gap >= 0 ? "rgba(124,111,247,0.3)" : "rgba(62,207,160,0.25)"}`,
        borderRadius: 10,
        padding: "12px 16px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 13, color: "#a0a0b8" }}>{gap >= 0 ? "3-fund leads by" : "FFTHX leads by"}</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: gap >= 0 ? "#7c6ff7" : "#3ecfa0" }}>{fmt(Math.abs(gap))}</span>
      </div>

      {/* NAV input */}
      <div style={{ background: "#1a1a24", borderRadius: 12, padding: "18px 16px", border: "1px solid #2a2a38", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#6b6b80", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Enter today&apos;s closing NAVs
          </div>
          <button
            onClick={fetchPrices}
            disabled={fetching}
            style={{
              background: fetching ? "#2a2a38" : "#23233a",
              color: fetching ? "#555" : "#7c6ff7",
              border: "1px solid #7c6ff7",
              borderRadius: 7,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: fetching ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {fetching ? "Fetching…" : "Fetch prices"}
          </button>
        </div>
        {fetchError && (
          <div style={{ fontSize: 12, color: "#f76f6f", marginBottom: 10 }}>{fetchError}</div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {[
            { key: "FXAIX", label: "FXAIX · FID 500 IDX", hint: "last: 263.26" },
            { key: "FSGGX", label: "FSGGX · GLB EX US", hint: "last: 21.30" },
            { key: "FXNAX", label: "FXNAX · US BOND IDX", hint: "last: 10.37" },
            { key: "FFTHX", label: "FFTHX · Freedom 2035", hint: "last: 18.96" },
          ].map(({ key, label, hint }) => (
            <div key={key}>
              <div style={{ fontSize: 11, color: "#6b6b80", marginBottom: 4 }}>{label}</div>
              <input
                type="number"
                step="0.01"
                placeholder={hint}
                value={navInputs[key as keyof typeof navInputs]}
                onChange={(e) => handleNav(key, e.target.value)}
                style={{
                  width: "100%",
                  background: "#0f0f13",
                  border: `1px solid ${navInputs[key as keyof typeof navInputs] ? "#7c6ff7" : "#2a2a38"}`,
                  borderRadius: 7,
                  color: "#fff",
                  fontSize: 14,
                  padding: "8px 10px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="text"
            placeholder='Label (e.g. "Jun 12")'
            value={dateLabel}
            onChange={(e) => { setDateLabel(e.target.value); setAdded(false); }}
            style={{
              flex: 1,
              background: "#0f0f13",
              border: "1px solid #2a2a38",
              borderRadius: 7,
              color: "#888",
              fontSize: 13,
              padding: "8px 10px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          <button
            onClick={saveToday}
            disabled={!allEntered}
            style={{
              background: allEntered ? "#7c6ff7" : "#2a2a38",
              color: allEntered ? "#fff" : "#555",
              border: "none",
              borderRadius: 7,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: allEntered ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
            }}
          >
            {added ? "✓ Saved" : "Save snapshot"}
          </button>
        </div>
      </div>

      {/* History table */}
      {history.length > 0 && (
        <div style={{ background: "#1a1a24", borderRadius: 12, padding: "16px", border: "1px solid #2a2a38" }}>
          <div style={{ fontSize: 11, color: "#6b6b80", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Snapshot history
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Date", "3-fund", "FFTHX", "Gap"].map((h) => (
                  <th key={h} style={{ textAlign: h === "Date" ? "left" : "right", color: "#6b6b80", fontWeight: 500, paddingBottom: 8, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((row, i) => {
                const tf = calcThreeFund(row);
                const ff = calcFFTHX(row);
                const g = tf - ff;
                return (
                  <tr key={i} style={{ borderTop: "1px solid #23232f" }}>
                    <td style={{ padding: "8px 0", color: "#a0a0b8" }}>
                      {row.date}
                      {row.label && <span style={{ fontSize: 10, marginLeft: 6, color: "#555" }}>{row.label}</span>}
                    </td>
                    <td style={{ textAlign: "right", color: "#7c6ff7", fontWeight: 600 }}>{fmt(tf)}</td>
                    <td style={{ textAlign: "right", color: "#3ecfa0", fontWeight: 600 }}>{fmt(ff)}</td>
                    <td style={{ textAlign: "right", color: g >= 0 ? "#7c6ff7" : "#3ecfa0", fontWeight: 600 }}>
                      {g >= 0 ? "+" : "-"}{fmt(Math.abs(g))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 11, color: "#44445a", marginTop: 20, lineHeight: 1.6 }}>
        FFTHX ghost = 23,203.375 units (return proxy for the Freedom 2035 K6 class actually sold, credited +0.25%/yr for the K6 vs retail expense difference). 3-fund = 845.999 FXAIX · 5,541.605 FSGGX · 9,574.634 FXNAX as of Jul 10, 2026 — update the share constants after dividends reinvest or new contributions. Enter each fund&apos;s closing NAV after 6pm ET when Fidelity posts them. Not financial advice.
      </p>
    </div>
  );
}
