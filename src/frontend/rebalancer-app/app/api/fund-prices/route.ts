import { NextResponse } from "next/server";

const TICKERS = ["FXAIX", "FSGGX", "FXNAX", "FFTHX"];

async function fetchPrice(ticker: string): Promise<number | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
}

export async function GET() {
  const entries = await Promise.all(
    TICKERS.map(async (t) => [t, await fetchPrice(t)] as [string, number | null])
  );
  const prices = Object.fromEntries(entries);
  return NextResponse.json(prices);
}
