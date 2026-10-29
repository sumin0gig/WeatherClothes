import {
  formatBandRange,
  getBand,
  getTargetApparentTemp,
} from '../src/outfit/bands';
import { makeWeather } from './helpers/fixtures';

describe('getBand', () => {
  it.each([
    [-10, 1],
    [4.9, 1],
    [5, 2],
    [8.9, 2],
    [9, 3],
    [11.9, 3],
    [12, 4],
    [16.9, 4],
    [17, 5],
    [19.9, 5],
    [20, 6],
    [22.5, 6],
    [22.9, 6],
    [23, 7],
    [27.9, 7],
    [28, 8],
    [40, 8],
  ])('체감 %p° → 구간 %p', (temp, band) => {
    expect(getBand(temp)).toBe(band);
  });
});

describe('getTargetApparentTemp', () => {
  it('보정값을 더한다', () => {
    const w = makeWeather({ apparentTemp: 10 });
    expect(getTargetApparentTemp(w)).toBe(10);
    expect(getTargetApparentTemp(w, 2)).toBe(12);
    expect(getTargetApparentTemp(w, -3)).toBe(7);
  });
});

describe('formatBandRange', () => {
  it.each([
    [[4, 5, 6], '12–22°'],
    [[1], '~4°'],
    [[8], '28°~'],
    [[3], '9–11°'],
    [[1, 2], '~8°'],
    [[7, 8], '23°~'],
    [[1, 2, 3, 4, 5, 6, 7, 8], '모든 온도'],
  ] as const)('%p → %p', (bands, label) => {
    expect(formatBandRange([...bands])).toBe(label);
  });
});
