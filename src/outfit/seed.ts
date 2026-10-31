/* eslint-disable no-bitwise -- 해시/PRNG는 비트 연산이 본질이다 */
/**
 * 날짜 시드 기반 의사난수. 같은 날에는 위젯이 몇 번 갱신돼도 같은 옷이 나오게 한다.
 * 외부 라이브러리 없이 FNV-1a 해시 + mulberry32.
 */

export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function createRandom(seed: string): () => number {
  let a = hashString(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededPick<T>(
  items: readonly T[],
  seed: string,
): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(createRandom(seed)() * items.length)];
}

export function seededBool(seed: string): boolean {
  return createRandom(seed)() < 0.5;
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const rand = createRandom(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 기기 현지 날짜 'YYYY-MM-DD' */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
