/** Open-Meteo 응답 예시 (부산, 비 오는 오후) */
export function sampleForecastJson(
  overrides: { currentTime?: string; code?: number } = {},
) {
  const hours = Array.from(
    { length: 24 },
    (_, h) => `2026-10-29T${String(h).padStart(2, '0')}:00`,
  );
  return {
    current: {
      time: overrides.currentTime ?? '2026-10-29T14:15',
      temperature_2m: 13.2,
      apparent_temperature: 11.4,
      relative_humidity_2m: 72,
      precipitation: 0,
      weather_code: overrides.code ?? 3,
      wind_speed_10m: 12.3,
    },
    hourly: {
      time: hours,
      apparent_temperature: hours.map(
        (_, h) => 8 + (h > 6 && h < 16 ? h - 6 : 4),
      ),
      precipitation_probability: hours.map((_, h) =>
        h === 14 ? 30 : h >= 17 ? 60 : h === 3 ? null : 10,
      ),
      weather_code: hours.map((_, h) => (h >= 17 ? 61 : 3)),
    },
  };
}
