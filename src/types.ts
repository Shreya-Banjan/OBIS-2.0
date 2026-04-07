export type PlacedWidget = {
  instanceId: string;
  templateId: string;
  label: string;
  /** Empty slot from layout selection; tap to open widget picker and fill. */
  placeholder?: boolean;
};

/** Section column layout from Add section → Select Layout (Figma Actions). */
export type SectionLayoutPreset = 'full' | 'sidebar-left' | 'sidebar-right' | 'three-column';

export type DashboardSection = {
  id: string;
  widgets: PlacedWidget[];
  layout?: SectionLayoutPreset;
};

export type SavedDashboard = {
  id: string;
  title: string;
  sections: DashboardSection[];
  updatedAt: number;
  status: 'draft' | 'published';
  /** From new-report / publish flow */
  scope?: string;
  month?: string;
  shareEmails?: string[];
  /** Optional cover image (data URL) from new-report upload */
  coverImageDataUrl?: string | null;
};
