import type { WarrantyItem, WarrantyListResponse } from "./warranties";
import { isWarrantyExpiring } from "./warranties";

export async function fetchAllWarrantyItems(): Promise<WarrantyItem[]> {
  const seen = new Set<number>();
  const items: WarrantyItem[] = [];
  let page = 1;
  let total = Infinity;

  while (items.length < total && page <= 40) {
    const res = await fetch(`/api/wp/warranties?per_page=50&page=${page}`);
    const data = (await res.json()) as WarrantyListResponse & { message?: string };
    if (!res.ok) throw new Error(data.message || "Could not load claims.");
    total = Number(data.total) || 0;
    for (const item of data.items || []) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
    if (!(data.items || []).length) break;
    page += 1;
  }

  return items;
}

export function countBy(
  items: WarrantyItem[],
  keyOf: (item: WarrantyItem) => string
): Array<{ label: string; count: number }> {
  const map = new Map<string, number>();
  for (const item of items) {
    const label = keyOf(item).trim() || "Unassigned";
    map.set(label, (map.get(label) || 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function expiringItems(items: WarrantyItem[]) {
  return items.filter((item) => isWarrantyExpiring(item));
}
