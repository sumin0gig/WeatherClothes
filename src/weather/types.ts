/** 앱 내부에서 쓰는 날씨 형식. Open-Meteo 응답은 openMeteo.ts에서 이 형태로 정규화한다. */
export type HourlyPoint = {
  /** 'YYYY-MM-DDTHH:mm' (조회한 위치의 현지 시각) */
  time: string;
  apparentTemp: number;
  precipProb: number;
  code: number;
};

export type Weather = {
  /** 기온 (°C) */
  temp: number;
  /** 체감온도 (°C) ← 추천 기준 */
  apparentTemp: number;
  /** 상대습도 (%) */
  humidity: number;
  /** 현재 시각의 강수확률 (%) */
  precipProb: number;
  /** 풍속 (km/h) */
  windSpeed: number;
  /** WMO weather code */
  code: number;
  /** 오늘 시간별 예보 */
  hourly: HourlyPoint[];
  /** 가져온 시각 (epoch ms) */
  fetchedAt: number;
};
