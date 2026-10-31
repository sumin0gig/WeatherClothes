import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = { size?: number; color: string; strokeWidth?: number };

/** UI 아이콘. 옷 이미지는 PNG(ClothImage)라서 여기 없다. */

export function PinIcon({ size = 16, color, strokeWidth = 2 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <Circle cx="12" cy="9.5" r="2.5" />
    </Svg>
  );
}

export function UmbrellaIcon({ size = 18, color, strokeWidth = 2 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M3 12a9 9 0 0 1 18 0z" />
      <Path d="M12 12v7a2 2 0 0 0 4 0" />
    </Svg>
  );
}

export function ThermoIcon({ size = 18, color, strokeWidth = 2 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z" />
    </Svg>
  );
}

export function HangerIcon({ size = 28, color, strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 6a2 2 0 1 1 2 2c-1 0-2 .7-2 1.6V10" />
      <Path d="M12 10 3 16.5c-.8.6-.4 1.5.5 1.5h17c.9 0 1.3-.9.5-1.5z" />
    </Svg>
  );
}

export function ExternalIcon({ size = 14, color, strokeWidth = 2 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M14 4h6v6" />
      <Path d="M20 4 10 14" />
      <Path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </Svg>
  );
}
