import * as React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Unique Archival Bookmark Ribbon Icon
 * Replaces generic heart/star with a tactile physical cloth bookmark ribbon
 */
export function BookmarkRibbonIcon({ className = "h-4 w-4", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <path d="M5 3.5C5 2.67 5.67 2 6.5 2H17.5C18.33 2 19 2.67 19 3.5V22L12 17.5L5 22V3.5Z" />
      <path d="M9 2V8L12 6L15 8V2" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * Vintage Postal Postmark Seal Icon
 * Replaces generic courier truck with an authentic circular postal dispatch mark
 */
export function PostalSealIcon({ className = "h-5 w-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="7" strokeDasharray="2 2" />
      <path d="M7 12H17" />
      <path d="M9 9H15" />
      <path d="M9.5 15H14.5" />
      <path d="M12 4.5V2.5" />
      <path d="M12 21.5V19.5" />
    </svg>
  );
}

/**
 * Archival Audio Reel / Broadcast Microphone Icon
 * Replaces generic Lucide Radio with an authentic magnetic audio recording reel
 */
export function ArchivalAudioReelIcon({ className = "h-5 w-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="8" cy="12" r="2.5" />
      <circle cx="16" cy="12" r="2.5" />
      <path d="M8 9.5C9.5 7.5 14.5 7.5 16 9.5" />
      <path d="M8 14.5C9.5 16.5 14.5 16.5 16 14.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * Archival 35mm Celluloid Film Frame Icon
 * Replaces generic film icon with authentic perforated movie frame
 */
export function ArchivalFilmFrameIcon({ className = "h-5 w-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <line x1="7" y1="4" x2="7" y2="20" />
      <line x1="17" y1="4" x2="17" y2="20" />
      <line x1="3" y1="9" x2="7" y2="9" />
      <line x1="3" y1="15" x2="7" y2="15" />
      <line x1="17" y1="9" x2="21" y2="9" />
      <line x1="17" y1="15" x2="21" y2="15" />
      <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Royal Provenance Wax Seal Icon
 * Replaces generic check shield with a handcrafted archival wax seal and ribbon
 */
export function ArchivalWaxSealIcon({ className = "h-5 w-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <path d="M12 2C8 2 4.5 5 4.5 9C4.5 13 8 16 12 16C16 16 19.5 13 19.5 9C19.5 5 16 2 12 2Z" />
      <circle cx="12" cy="9" r="4.5" strokeDasharray="1.5 1.5" />
      <path d="M9.5 9L11 10.5L14.5 7" />
      <path d="M9 15.5L7 22L12 19.5L17 22L15 15.5" fill="none" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Classical Manuscript Folio Book Icon
 * Replaces generic Lucide BookOpen with a tailored open archival manuscript
 */
export function ArchivalFolioIcon({ className = "h-5 w-5", size, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <path d="M2 5.5C2 4.12 3.12 3 4.5 3C7 3 10 4 12 5.5C14 4 17 3 19.5 3C20.88 3 22 4.12 22 5.5V19C22 20.1 21.1 21 20 21C17.5 21 14.5 20 12 18.5C9.5 20 6.5 21 4 21C2.9 21 2 20.1 2 19V5.5Z" />
      <path d="M12 5.5V18.5" />
      <path d="M6 7.5H9" strokeWidth="1.2" />
      <path d="M6 10.5H9.5" strokeWidth="1.2" />
      <path d="M15 7.5H18" strokeWidth="1.2" />
      <path d="M14.5 10.5H18" strokeWidth="1.2" />
    </svg>
  );
}
