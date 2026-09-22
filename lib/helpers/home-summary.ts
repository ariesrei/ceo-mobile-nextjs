import { apiGet } from "./api";
import { asNumber, asRecord, asString } from "./validate";

export type HomeSummary = {
  balance: { amount: string; cents: number; due: string };
  open_requests: number;
  unread_messages: number;
  upcoming_events: number;
};

const EMPTY: HomeSummary = {
  balance: { amount: "$0.00", cents: 0, due: "" },
  open_requests: 0,
  unread_messages: 0,
  upcoming_events: 0,
};

export async function loadHomeSummary(): Promise<HomeSummary> {
  const res = await apiGet("/api/wp/home-summary");
  if (!res.ok) return EMPTY;
  const data = asRecord(res.data);
  const balance = asRecord(data?.balance);
  return {
    balance: {
      amount: asString(balance?.amount) || "$0.00",
      cents: Math.max(0, asNumber(balance?.cents)),
      due: asString(balance?.due),
    },
    open_requests: Math.max(0, asNumber(data?.open_requests)),
    unread_messages: Math.max(0, asNumber(data?.unread_messages)),
    upcoming_events: Math.max(0, asNumber(data?.upcoming_events)),
  };
}
