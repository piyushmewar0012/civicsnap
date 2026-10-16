export type IssueCategory =
  | 'pothole'
  | 'garbage_accumulation'
  | 'broken_streetlight'
  | 'unclear_insufficient'
  | 'unsupported_category';

export interface CategoryInfo {
  id: IssueCategory;
  name: string;
  badgeColor: string;
  description: string;
}

export interface AnalysisEvidence {
  visibleObservations: string[];
  uncertainDetails: string[];
  detectedCategory: IssueCategory;
  categoryLabel: string;
  confidenceNote: string;
  photoClarity: 'clear' | 'partially_clear' | 'unclear_or_insufficient';
}

export interface ComplaintDraft {
  subject: string;
  locationAsProvided: string;
  descriptionBody: string;
  visibleDetailsSummary: string[];
  suggestedAction: string;
  closing: string;
  fullDraftText: string;
}

export interface AnalysisResult {
  evidence: AnalysisEvidence;
  draft: ComplaintDraft;
  timestamp: string;
  photoUrl: string;
  photoName: string;
  locationProvided: string;
  isInsufficentEvidence: boolean;
}

export interface SampleCase {
  id: string;
  title: string;
  category: IssueCategory;
  location: string;
  description: string;
  imageUrl: string;
  note: string;
}

export type ReportStatus = 'draft' | 'submitted' | 'in_progress' | 'resolved';

export type AIProvider = 'opensource' | 'gemini' | 'heuristic';

export interface OpenSourceAiConfig {
  endpoint: string;
  model: string;
  apiKey?: string;
}

export interface CivicReportRecord {
  id: string;
  created_at: string;
  updated_at?: string;
  user_id?: string | null;
  user_email?: string | null;
  tracking_id?: string;
  ai_provider?: string;
  photo_url: string;
  photo_name: string;
  location_provided: string;
  detected_category: IssueCategory;
  category_label: string;
  confidence_note: string;
  photo_clarity: 'clear' | 'partially_clear' | 'unclear_or_insufficient';
  is_insufficient_evidence: boolean;
  visible_observations: string[];
  uncertain_details: string[];
  draft_subject: string;
  draft_body: string;
  draft_closing: string;
  full_draft_text: string;
  status: ReportStatus;
  user_notes?: string;
}

