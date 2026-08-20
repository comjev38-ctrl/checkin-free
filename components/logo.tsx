export default function Logo({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect
        width="64"
        height="64"
        rx="16"
        fill="#16213E"
        stroke="#FAFAF8"
        strokeOpacity="0.15"
        strokeWidth="1.5"
      />
      <path
        d="M20 33.5 L28 41.5 L45 22.5"
        fill="none"
        stroke="#FAFAF8"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
