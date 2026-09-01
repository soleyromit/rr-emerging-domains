interface IconProps {
  size?: number;
}

const base = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Small hand-drawn pictogram set for the Placement/Slot/Wishlist vocabulary
// page — the Astryx Icon registry is a fixed 33-name utility set (chevrons,
// calendar, wrench, ...) with no room for a distinct glyph per concept. These
// are plain geometric SVGs (rects/circles/lines, no hand-authored curves) so
// each term gets its own recognizable shape instead of reusing generic icons.

// A batch of seats — capacity, not one seat.
export function SlotIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

// A ranked list — longest bar is the 1st choice.
export function WishlistIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="3.5" cy="6" r="1.6" fill="currentColor" stroke="none" />
      <line x1="7" y1="6" x2="21" y2="6" />
      <circle cx="3.5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <circle cx="3.5" cy="18" r="1.6" fill="currentColor" stroke="none" />
      <line x1="7" y1="18" x2="13" y2="18" />
    </svg>
  );
}

// A target — the matching/scoring engine.
export function AssistIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// A checklist — the human review-and-create step.
export function ReviewIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M9 3.5h6v3H9z" />
      <path d="M8.5 12.5l2 2 4.5-4.5" />
    </svg>
  );
}

// An eye — invisible until Publish.
export function PublishIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M2 12s3.7-7 10-7 10 7 10 7-3.7 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// A pin with a check — the assignment of record.
export function PlacementIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 21s7-7.2 7-12.2A7 7 0 0 0 5 8.8C5 13.8 12 21 12 21z" />
      <path d="M9 9.6l2 2 4-4" />
    </svg>
  );
}

// A shield — the accrediting body.
export function AccreditorIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

// A ribboned certificate — the licensure exam.
export function ExamIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <line x1="7" y1="8.5" x2="14" y2="8.5" />
      <line x1="7" y1="11.5" x2="12" y2="11.5" />
      <path d="M9 16v5l3-1.5L15 21v-5" />
    </svg>
  );
}

// A calendar grid — the clinical rotation.
export function RotationIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2.5" x2="8" y2="6.5" />
      <line x1="16" y1="2.5" x2="16" y2="6.5" />
      <rect x="6.5" y="12" width="4" height="4" fill="currentColor" stroke="none" />
    </svg>
  );
}

// A person — the clinical instructor.
export function InstructorIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5 21c0-4.5 3-7 7-7s7 2.5 7 7" />
    </svg>
  );
}

// A document with a pen — the self-study submission.
export function DocumentIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="16.5" x2="13" y2="16.5" />
    </svg>
  );
}

// Overlapping circles — true in all four, common ground rather than one domain.
export function CommonGroundIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="9.5" cy="12" r="6.5" />
      <circle cx="14.5" cy="12" r="6.5" />
    </svg>
  );
}
