import {
  createRandom,
  seededBool,
  seededPick,
  seededShuffle,
  toDateKey,
} from '../src/outfit/seed';

describe('seed', () => {
  it('같은 시드는 같은 수열', () => {
    const a = createRandom('2026-10-29:top');
    const b = createRandom('2026-10-29:top');
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  it('0 이상 1 미만', () => {
    const r = createRandom('x');
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('seededPick은 결정적이고, 빈 배열이면 undefined', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect(seededPick(items, 's')).toBe(seededPick(items, 's'));
    expect(seededPick([], 's')).toBeUndefined();
  });

  it('날짜가 바뀌면 고르는 결과가 골고루 달라진다', () => {
    const items = ['a', 'b', 'c'];
    const seen = new Set<string>();
    for (let d = 1; d <= 30; d++) seen.add(seededPick(items, `2026-11-${d}`)!);
    expect(seen.size).toBe(3);
  });

  it('seededBool / seededShuffle', () => {
    expect(seededBool('k')).toBe(seededBool('k'));
    const shuffled = seededShuffle([1, 2, 3, 4, 5], 'k');
    expect(shuffled).toEqual(seededShuffle([1, 2, 3, 4, 5], 'k'));
    expect([...shuffled].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('toDateKey는 현지 날짜', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
