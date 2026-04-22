type IconProps = { className?: string };

export function IconMenu({ className }: IconProps) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Nav drawer trigger — tiered list bars (Figma OBIS2.0 `Action_Button_ CountryList` / Icon_List, node 395:5745).
 */
export function IconNavDrawerListMark({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 5.75C3 5.55109 3.07902 5.36032 3.21967 5.21967C3.36032 5.07902 3.55109 5 3.75 5H15.75C15.9489 5 16.1397 5.07902 16.2803 5.21967C16.421 5.36032 16.5 5.55109 16.5 5.75C16.5 5.94891 16.421 6.13968 16.2803 6.28033C16.1397 6.42098 15.9489 6.5 15.75 6.5H3.75C3.55109 6.5 3.36032 6.42098 3.21967 6.28033C3.07902 6.13968 3 5.94891 3 5.75ZM3 17.75C3 17.5511 3.07902 17.3603 3.21967 17.2197C3.36032 17.079 3.55109 17 3.75 17H14.25C14.4489 17 14.6397 17.079 14.7803 17.2197C14.921 17.3603 15 17.5511 15 17.75C15 17.9489 14.921 18.1397 14.7803 18.2803C14.6397 18.421 14.4489 18.5 14.25 18.5H3.75C3.55109 18.5 3.36032 18.421 3.21967 18.2803C3.07902 18.1397 3 17.9489 3 17.75ZM3.75 11C3.55109 11 3.36032 11.079 3.21967 11.2197C3.07902 11.3603 3 11.5511 3 11.75C3 11.9489 3.07902 12.1397 3.21967 12.2803C3.36032 12.421 3.55109 12.5 3.75 12.5H20.25C20.4489 12.5 20.6397 12.421 20.7803 12.2803C20.921 12.1397 21 11.9489 21 11.75C21 11.5511 20.921 11.3603 20.7803 11.2197C20.6397 11.079 20.4489 11 20.25 11H3.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** More actions (kebab) — three vertical dots. */
export function IconMoreVertical({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="6" r="1.75" fill="currentColor" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" />
      <circle cx="12" cy="18" r="1.75" fill="currentColor" />
    </svg>
  );
}

/** Grid / tile layout — Fluent Grid 28 Regular (OBIS 2.0, Figma node 6326-37497). */
export function IconLayoutGrid({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M10.75 15C11.9926 15 13 16.0074 13 17.25V22.75C13 23.9926 11.9926 25 10.75 25H5.25C4.00736 25 3 23.9926 3 22.75V17.25C3 16.0074 4.00736 15 5.25 15H10.75ZM22.75 15C23.9926 15 25 16.0074 25 17.25V22.75C25 23.9926 23.9926 25 22.75 25H17.25C16.0074 25 15 23.9926 15 22.75V17.25C15 16.0074 16.0074 15 17.25 15H22.75ZM10.75 16.5H5.25C4.83579 16.5 4.5 16.8358 4.5 17.25V22.75C4.5 23.1642 4.83579 23.5 5.25 23.5H10.75C11.1642 23.5 11.5 23.1642 11.5 22.75V17.25C11.5 16.8358 11.1642 16.5 10.75 16.5ZM22.75 16.5H17.25C16.8358 16.5 16.5 16.8358 16.5 17.25V22.75C16.5 23.1642 16.8358 23.5 17.25 23.5H22.75C23.1642 23.5 23.5 23.1642 23.5 22.75V17.25C23.5 16.8358 23.1642 16.5 22.75 16.5ZM10.75 3C11.9926 3 13 4.00736 13 5.25V10.75C13 11.9926 11.9926 13 10.75 13H5.25C4.00736 13 3 11.9926 3 10.75V5.25C3 4.00736 4.00736 3 5.25 3H10.75ZM22.75 3C23.9926 3 25 4.00736 25 5.25V10.75C25 11.9926 23.9926 13 22.75 13H17.25C16.0074 13 15 11.9926 15 10.75V5.25C15 4.00736 16.0074 3 17.25 3H22.75ZM10.75 4.5H5.25C4.83579 4.5 4.5 4.83579 4.5 5.25V10.75C4.5 11.1642 4.83579 11.5 5.25 11.5H10.75C11.1642 11.5 11.5 11.1642 11.5 10.75V5.25C11.5 4.83579 11.1642 4.5 10.75 4.5ZM22.75 4.5H17.25C16.8358 4.5 16.5 4.83579 16.5 5.25V10.75C16.5 11.1642 16.8358 11.5 17.25 11.5H22.75C23.1642 11.5 23.5 11.1642 23.5 10.75V5.25C23.5 4.83579 23.1642 4.5 22.75 4.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Upload / add image to preview. */
export function IconImageUpload({ className }: IconProps) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** List layout — Fluent List 28 Regular (OBIS 2.0, Figma node 6326-37523). */
export function IconLayoutList({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M3 6.75C3 6.33579 3.33579 6 3.75 6H22.25C22.6642 6 23 6.33579 23 6.75C23 7.16421 22.6642 7.5 22.25 7.5H3.75C3.33579 7.5 3 7.16421 3 6.75ZM3 20.75C3 20.3358 3.33579 20 3.75 20H20.25C20.6642 20 21 20.3358 21 20.75C21 21.1642 20.6642 21.5 20.25 21.5H3.75C3.33579 21.5 3 21.1642 3 20.75ZM3.75 13C3.33579 13 3 13.3358 3 13.75C3 14.1642 3.33579 14.5 3.75 14.5H24.25C24.6642 14.5 25 14.1642 25 13.75C25 13.3358 24.6642 13 24.25 13H3.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconChevronDown({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronUp({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronLeft({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Fluent-style arrow (line + head) — section row Move up; distinct from menu chevrons. */
export function IconArrowUp({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g transform="translate(0, -2)">
        <path
          d="M12 20V9m0 0l-4.5 4.5M12 9l4.5 4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** Fluent-style arrow (line + head) — section row Move down. */
export function IconArrowDown({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g transform="translate(0, 2)">
        <path
          d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** Copy / duplicate — two stacked rectangles. */
export function IconCopy({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Share / send — soft rounded stroke (tray + arrow). */
export function IconShare({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5v5.5a2.5 2.5 0 002.5 2.5h9a2.5 2.5 0 002.5-2.5v-5.5M16 7l-4-4-4 4M12 3.5v12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM16.5 16.5L21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Filter — Fluent `ic_fluent_filter_24_regular` (Microsoft fluentui-system-icons).
 * Matches OBIS2.0 Figma node 683-13118.
 */
export function IconFilter({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13.5 16C13.9142 16 14.25 16.3358 14.25 16.75C14.25 17.1642 13.9142 17.5 13.5 17.5H10.5C10.0858 17.5 9.75 17.1642 9.75 16.75C9.75 16.3358 10.0858 16 10.5 16H13.5ZM16.5 11C16.9142 11 17.25 11.3358 17.25 11.75C17.25 12.1642 16.9142 12.5 16.5 12.5H7.5C7.08579 12.5 6.75 12.1642 6.75 11.75C6.75 11.3358 7.08579 11 7.5 11H16.5ZM19.5 6C19.9142 6 20.25 6.33579 20.25 6.75C20.25 7.16421 19.9142 7.5 19.5 7.5H4.5C4.08579 7.5 3.75 7.16421 3.75 6.75C3.75 6.33579 4.08579 6 4.5 6H19.5Z"
        fill="currentColor"
        style={{ width: '16px', height: '11px' }}
      />
    </svg>
  );
}

/**
 * Trash / delete — Lucide `trash` geometry (VELOCE Figma lucide:trash, node 11874:3363).
 * Two paths for lid+handle vs bin; 1.5 stroke + round caps to align with IconEdit / IconShare.
 */
export function IconTrash({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Fluent UI System Icons — ic_fluent_location_24_regular (matches Figma fluent:location-24-regular) */
export function IconLocation({ className }: IconProps) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="currentColor"
        d="M5.84325 4.56799C9.24367 1.16776 14.7573 1.16764 18.1577 4.56799C21.558 7.96834 21.5579 13.482 18.1577 16.8824L16.9702 18.0563C16.0953 18.915 14.9598 20.0192 13.5639 21.3688C12.6917 22.2117 11.308 22.2111 10.436 21.3678L6.94481 17.9723C6.50614 17.5416 6.13904 17.1782 5.84325 16.8824C2.44284 13.482 2.44284 7.9684 5.84325 4.56799ZM17.0962 5.62951C14.2816 2.81489 9.71842 2.81489 6.90379 5.62951C4.08948 8.44416 4.08927 13.0074 6.90379 15.8219L8.3911 17.2887C9.20996 18.0901 10.2394 19.0908 11.479 20.2897C11.7697 20.5708 12.2312 20.5708 12.522 20.2897L15.9165 16.9889C16.3853 16.5288 16.7786 16.1395 17.0962 15.8219C19.9108 13.0073 19.9108 8.44414 17.0962 5.62951ZM12.0005 7.49963C13.9331 7.49988 15.5003 9.06696 15.5005 10.9996C15.5005 12.9325 13.9333 14.4994 12.0005 14.4996C10.0675 14.4996 8.50047 12.9326 8.50047 10.9996C8.50067 9.0668 10.0676 7.49963 12.0005 7.49963ZM12.0005 8.99963C10.896 8.99963 10.0007 9.89523 10.0005 10.9996C10.0005 12.1042 10.8959 12.9996 12.0005 12.9996C13.1048 12.9994 14.0005 12.104 14.0005 10.9996C14.0003 9.89539 13.1047 8.99988 12.0005 8.99963Z"
      />
    </svg>
  );
}

/** Fluent UI System Icons — ic_fluent_calendar_28_regular (matches Figma fluent:calendar-28-regular), scaled into 24×24 */
export function IconCalendar({ className }: IconProps) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        fill="currentColor"
        d="M21.75 3C23.5449 3 25 4.45507 25 6.25V21.75C25 23.5449 23.5449 25 21.75 25H6.25C4.45507 25 3 23.5449 3 21.75V6.25C3 4.45507 4.45507 3 6.25 3H21.75ZM23.5 9.503H4.5V21.75C4.5 22.7165 5.2835 23.5 6.25 23.5H21.75C22.7165 23.5 23.5 22.7165 23.5 21.75V9.503ZM8.74878 17.5014C9.43913 17.5014 9.99878 18.0611 9.99878 18.7514C9.99878 19.4418 9.43913 20.0014 8.74878 20.0014C8.05842 20.0014 7.49878 19.4418 7.49878 18.7514C7.49878 18.0611 8.05842 17.5014 8.74878 17.5014ZM14.0033 17.5014C14.6936 17.5014 15.2533 18.0611 15.2533 18.7514C15.2533 19.4418 14.6936 20.0014 14.0033 20.0014C13.3129 20.0014 12.7533 19.4418 12.7533 18.7514C12.7533 18.0611 13.3129 17.5014 14.0033 17.5014ZM8.74878 12.5014C9.43913 12.5014 9.99878 13.0611 9.99878 13.7514C9.99878 14.4418 9.43913 15.0014 8.74878 15.0014C8.05842 15.0014 7.49878 14.4418 7.49878 13.7514C7.49878 13.0611 8.05842 12.5014 8.74878 12.5014ZM14.0033 12.5014C14.6936 12.5014 15.2533 13.0611 15.2533 13.7514C15.2533 14.4418 14.6936 15.0014 14.0033 15.0014C13.3129 15.0014 12.7533 14.4418 12.7533 13.7514C12.7533 13.0611 13.3129 12.5014 14.0033 12.5014ZM19.2577 12.5014C19.9481 12.5014 20.5077 13.0611 20.5077 13.7514C20.5077 14.4418 19.9481 15.0014 19.2577 15.0014C18.5674 15.0014 18.0077 14.4418 18.0077 13.7514C18.0077 13.0611 18.5674 12.5014 19.2577 12.5014ZM21.75 4.5H6.25C5.2835 4.5 4.5 5.2835 4.5 6.25V8.003H23.5V6.25C23.5 5.2835 22.7165 4.5 21.75 4.5Z"
      />
    </svg>
  );
}

export function IconDrag({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
      <circle cx="6" cy="4" r="1.5" />
      <circle cx="12" cy="4" r="1.5" />
      <circle cx="6" cy="9" r="1.5" />
      <circle cx="12" cy="9" r="1.5" />
      <circle cx="6" cy="14" r="1.5" />
      <circle cx="12" cy="14" r="1.5" />
    </svg>
  );
}

export function IconAdd({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 4v10M4 9h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.75 9.25 7.5 13 14.25 4.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Edit / pencil — soft rounded stroke. */
export function IconEdit({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h3.5l11-11a2.5 2.5 0 00-3.5-3.5L4 16.5V20zM14 6l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPlusSoft({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82-.33 1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLogout({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M7.5 17.5H4.167A1.667 1.667 0 012.5 15.833V4.167A1.667 1.667 0 014.167 2.5H7.5M13.333 14.167L17.5 10l-4.167-4.167M17.5 10H7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Components library sidebar — Inputs category. */
export function IconUiCategoryInputs({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8h16M4 12h10M4 16h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="18" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Components library sidebar — Display category. */
export function IconUiCategoryDisplay({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Components library sidebar — Feedback category. */
export function IconUiCategoryFeedback({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3c-4.97 0-9 3.58-9 8 0 1.58.47 3.06 1.3 4.35L3 21l5.92-1.17A8.94 8.94 0 0012 19c4.97 0 9-3.58 9-8s-4.03-8-9-8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9.5 10.5h.01M12 10.5h.01M14.5 10.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Components library sidebar — Overlay category. */
export function IconUiCategoryOverlay({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4h12a2 2 0 012 2v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Components library sidebar — Navigation category. */
export function IconUiCategoryNavigation({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="19" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="19" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7v3l-4 7M12 10l4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Components library sidebar — Colors category. */
export function IconUiCategoryColors({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="12" r="5" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="15" cy="12" r="5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
