import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function LogoIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <rect
        x="4.5"
        y="7.5"
        width="23"
        height="17"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M10.2 7.5v17M21.8 7.5v17M4.5 16h23"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeDasharray="2.3 2.3"
        opacity="0.8"
      />
      <path
        d="M14.4 16h3.2"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PrinterIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...base} {...props}>
      <path d="M7 8V3.8h10V8" />
      <rect x="3.8" y="8" width="16.4" height="8.6" rx="1.6" />
      <path d="M7 13h10v7.2H7z" />
      <path d="M17.2 10.7h.1" />
    </svg>
  );
}

export function FoldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...base} {...props}>
      <path d="M4 5.2h16v13.6H4z" />
      <path d="M4 12h16M12 5.2v13.6" strokeDasharray="2.2 2.2" />
      <path d="M9.4 12h5.2" strokeWidth="2.4" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...base} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...base} {...props}>
      <path d="M4.5 7h15M9 7V4.5h6V7M6.5 7l.9 12.5h9.2L17.5 7" />
      <path d="M10 10.5v5.5M14 10.5v5.5" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...base} {...props}>
      <path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18l-1.8-5.4L4.7 10.8 10.2 9 12 3.5Z" />
      <path d="M18.5 16.5 19.3 19l2.5.8-2.5.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8.8-2.5Z" />
    </svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...base} {...props}>
      <path d="m7 9.5 5 5 5-5" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...base} {...props}>
      <path d="M4.5 12h15M14 6.5l5.5 5.5L14 17.5" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...base} {...props}>
      <path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9" />
      <path d="M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...base} {...props}>
      <path d="M10.4 13.6a3.7 3.7 0 0 0 5.2 0l2.6-2.6a3.7 3.7 0 0 0-5.2-5.2L11.6 7" />
      <path d="M13.6 10.4a3.7 3.7 0 0 0-5.2 0l-2.6 2.6a3.7 3.7 0 0 0 5.2 5.2l1.4-1.4" />
    </svg>
  );
}
