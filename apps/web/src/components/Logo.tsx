interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 28, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M5 26V4H16C21.5 4 26 8 26 13C26 18 21.5 22 16 22H5"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 22L24 28"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <rect x="3" y="29" width="5.5" height="2.5" rx="0.5" fill="currentColor" />
      <rect x="10" y="29" width="5.5" height="2.5" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="17" y="29" width="5.5" height="2.5" rx="0.5" fill="currentColor" opacity="0.45" />
      <rect x="24" y="29" width="5.5" height="2.5" rx="0.5" fill="currentColor" opacity="0.25" />
    </svg>
  );
}
