// SVG-логотип: щит викинга с руной внутри. Инлайн-SVG вместо текста —
// масштабируется без потерь и красится currentColor.

interface ShieldLogoProps {
  size?: number;
}

export function ShieldLogo({ size = 22 }: ShieldLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Контур щита: сверху прямая линия, снизу сужение к острию */}
      <path d="M12 3 L20 5 V11 C20 16 16.6 19.6 12 21.5 C7.4 19.6 4 16 4 11 V5 Z" />
      {/* Руна Турисаз (щит/защита): вертикаль с двумя штырами вправо */}
      <path d="M10 8 V16 M10 9.5 L13.5 12 L10 14.5" />
    </svg>
  );
}
