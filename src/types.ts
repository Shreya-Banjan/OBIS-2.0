export type PlacedWidget = {
  instanceId: string;
  templateId: string;
  label: string;
  /** Empty slot; opens widget library to fill. */
  placeholder?: boolean;
};

/** Section column layout from Add section → Select Layout (Figma Actions). */
export type SectionLayoutPreset = 'full' | 'sidebar-left' | 'sidebar-right' | 'three-column';

export type DashboardSection = {
  id: string;
  widgets: PlacedWidget[];
  layout?: SectionLayoutPreset;
};

/** Present when this report was shared with you by someone else (demo / future API). */
export type SharedByInfo = {
  displayName: string;
  /** Optional profile image; if missing, initials are shown. */
  avatarUrl?: string | null;
};

export type SavedDashboard = {
  id: string;
  title: string;
  sections: DashboardSection[];
  updatedAt: number;
  status: 'draft' | 'published';
  /** When set, the home list shows “Shared by …” with a profile avatar. */
  sharedBy?: SharedByInfo;
  /** From new-report / publish flow */
  scope?: string;
  month?: string;
  shareEmails?: string[];
  /** Optional note from publish modal */
  publishComment?: string;
  /** Optional cover image (data URL) from new-report upload */
  coverImageDataUrl?: string | null;
};
