import { getSupabase } from './supabaseClient';
import { AnalysisResult, CivicReportRecord, ReportStatus } from '../types/civic';

const STORAGE_BUCKET = 'civic-photos';
const LOCAL_STORAGE_KEY = 'civicsnap_local_reports';

let isTableMissingState = false;

export const getIsSupabaseTableMissing = (): boolean => isTableMissingState;
export const setIsSupabaseTableMissing = (missing: boolean): void => {
  isTableMissingState = missing;
};

/**
 * Retrieve reports saved in local browser storage.
 */
export const getLocalReports = (): CivicReportRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Error reading local reports from localStorage:', err);
    return [];
  }
};

/**
 * Persist or update a report in local browser storage.
 */
export const saveLocalReport = (report: CivicReportRecord): void => {
  try {
    const existing = getLocalReports();
    const index = existing.findIndex(
      (r) =>
        r.id === report.id ||
        (report.tracking_id && r.tracking_id === report.tracking_id)
    );

    let updated: CivicReportRecord[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...updated[index], ...report };
    } else {
      updated = [report, ...existing];
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error writing local report to localStorage:', err);
  }
};

/**
 * Remove a report from local browser storage.
 */
export const deleteLocalReport = (id: string): void => {
  try {
    const existing = getLocalReports();
    const updated = existing.filter((r) => r.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error deleting local report from localStorage:', err);
  }
};

/**
 * Upload an image file to Supabase Storage in the 'civic-photos' bucket.
 * Returns the public URL of the uploaded image.
 */
export const uploadReportPhoto = async (file: File): Promise<string | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filePath = `uploads/${Date.now()}_${cleanFileName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Supabase storage upload failed:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl || null;
  } catch (err) {
    console.warn('Error during Supabase photo upload:', err);
    return null;
  }
};

export interface SaveReportParams {
  result: AnalysisResult;
  photoFile?: File | null;
  fullDraftText?: string;
  userNotes?: string;
  status?: ReportStatus;
  userId?: string | null;
  userEmail?: string | null;
  trackingId?: string;
  aiProvider?: string;
}

/**
 * Generate a formal human-readable complaint tracking identifier.
 * Format: CIVIC-YYYY-XXXXX
 */
export function generateTrackingId(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CIVIC-${year}-${randomSuffix}`;
}

/**
 * Save a newly generated or edited civic issue report.
 * Guaranteed to save locally into browser storage first, then attempts Supabase sync.
 */
export const saveCivicReport = async ({
  result,
  photoFile,
  fullDraftText,
  userNotes,
  status = 'draft',
  userId,
  userEmail,
  trackingId,
  aiProvider,
}: SaveReportParams): Promise<CivicReportRecord> => {
  const generatedTrackId = trackingId || (status === 'submitted' ? generateTrackingId() : undefined);
  let finalPhotoUrl = result.photoUrl;

  // Try photo upload if Supabase is active
  if (photoFile && getSupabase()) {
    try {
      const uploadedUrl = await uploadReportPhoto(photoFile);
      if (uploadedUrl) {
        finalPhotoUrl = uploadedUrl;
      }
    } catch {
      // Continue with current preview URL
    }
  }

  // Determine current user
  let authUserId = userId || null;
  let authUserEmail = userEmail || null;

  const supabase = getSupabase();
  if (!authUserId && supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        authUserId = sessionData.session.user.id;
        authUserEmail = sessionData.session.user.email || null;
      }
    } catch {
      // ignore
    }
  }

  if (!authUserId) {
    const cachedUser = localStorage.getItem('civicsnap_current_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        authUserId = u.id;
        authUserEmail = u.email;
      } catch {
        // ignore
      }
    }
  }

  const combinedNotes = [
    userNotes,
    generatedTrackId ? `[Tracking Reference: ${generatedTrackId}]` : null,
    aiProvider ? `[AI Provider: ${aiProvider}]` : null,
  ].filter(Boolean).join(' | ');

  const localId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `rep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const nowIso = new Date().toISOString();

  const localRecord: CivicReportRecord = {
    id: localId,
    created_at: nowIso,
    updated_at: nowIso,
    user_id: authUserId,
    user_email: authUserEmail,
    tracking_id: generatedTrackId,
    ai_provider: aiProvider || 'opensource',
    photo_url: finalPhotoUrl,
    photo_name: result.photoName,
    location_provided: result.locationProvided,
    detected_category: result.evidence.detectedCategory,
    category_label: result.evidence.categoryLabel,
    confidence_note: result.evidence.confidenceNote,
    photo_clarity: result.evidence.photoClarity,
    is_insufficient_evidence: result.isInsufficentEvidence,
    visible_observations: result.evidence.visibleObservations,
    uncertain_details: result.evidence.uncertainDetails,
    draft_subject: result.draft.subject,
    draft_body: result.draft.descriptionBody,
    draft_closing: result.draft.closing,
    full_draft_text: fullDraftText || result.draft.fullDraftText,
    status,
    user_notes: combinedNotes,
  };

  // 1. ALWAYS persist to local storage first
  saveLocalReport(localRecord);

  // 2. If Supabase is configured, attempt remote sync
  if (supabase) {
    try {
      const payload: Record<string, any> = {
        user_id: localRecord.user_id,
        user_email: localRecord.user_email,
        photo_url: localRecord.photo_url,
        photo_name: localRecord.photo_name,
        location_provided: localRecord.location_provided,
        detected_category: localRecord.detected_category,
        category_label: localRecord.category_label,
        confidence_note: localRecord.confidence_note,
        photo_clarity: localRecord.photo_clarity,
        is_insufficient_evidence: localRecord.is_insufficient_evidence,
        visible_observations: localRecord.visible_observations,
        uncertain_details: localRecord.uncertain_details,
        draft_subject: localRecord.draft_subject,
        draft_body: localRecord.draft_body,
        draft_closing: localRecord.draft_closing,
        full_draft_text: localRecord.full_draft_text,
        status: localRecord.status,
        user_notes: localRecord.user_notes,
        updated_at: localRecord.updated_at,
        tracking_id: localRecord.tracking_id,
        ai_provider: localRecord.ai_provider,
      };

      const { data, error } = await supabase
        .from('civic_reports')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('Supabase remote insert warning:', error.message);
        if (
          error.message.includes('public.civic_reports') ||
          error.message.includes('schema cache') ||
          error.message.includes('does not exist')
        ) {
          setIsSupabaseTableMissing(true);
        }
      } else if (data) {
        setIsSupabaseTableMissing(false);
        const remoteRecord = data as CivicReportRecord;
        // Keep tracking_id if not returned by older column schema
        if (!remoteRecord.tracking_id && localRecord.tracking_id) {
          remoteRecord.tracking_id = localRecord.tracking_id;
        }
        saveLocalReport(remoteRecord);
        return remoteRecord;
      }
    } catch (err: any) {
      console.warn('Supabase remote sync deferred:', err.message);
    }
  }

  return localRecord;
};

/**
 * Transition report status to 'submitted' with a tracking identifier.
 */
export const submitCivicReport = async (
  id: string,
  existingTrackingId?: string
): Promise<{ success: boolean; trackingId: string }> => {
  const trackingId = existingTrackingId || generateTrackingId();
  const nowIso = new Date().toISOString();

  // 1. Update local storage record
  const localReports = getLocalReports();
  const match = localReports.find((r) => r.id === id);
  if (match) {
    match.status = 'submitted';
    match.tracking_id = trackingId;
    match.updated_at = nowIso;
    saveLocalReport(match);
  }

  // 2. Update Supabase if available
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('civic_reports')
        .update({
          status: 'submitted',
          tracking_id: trackingId,
          updated_at: nowIso,
        })
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase submit status update deferred:', err);
    }
  }

  return { success: true, trackingId };
};

/**
 * Fetch all civic reports.
 * Merges Supabase reports with local reports, and gracefully falls back to local storage
 * if the remote table does not exist or network is unavailable.
 */
export const fetchCivicReports = async (): Promise<CivicReportRecord[]> => {
  const localReports = getLocalReports();
  const supabase = getSupabase();

  if (!supabase) {
    return localReports;
  }

  try {
    const { data, error } = await supabase
      .from('civic_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch notice:', error.message);
      if (
        error.message.includes('public.civic_reports') ||
        error.message.includes('schema cache') ||
        error.message.includes('does not exist')
      ) {
        setIsSupabaseTableMissing(true);
      }
      // Return local reports so the feed displays all complaints immediately
      return localReports;
    }

    setIsSupabaseTableMissing(false);
    const remoteReports = (data || []) as CivicReportRecord[];

    // Merge remote reports with any local reports not yet in remote
    const remoteIds = new Set(remoteReports.map((r) => r.id));
    const remoteTrackingIds = new Set(
      remoteReports.map((r) => r.tracking_id).filter(Boolean)
    );

    const unsyncedLocals = localReports.filter(
      (l) =>
        !remoteIds.has(l.id) &&
        (!l.tracking_id || !remoteTrackingIds.has(l.tracking_id))
    );

    const merged = [...remoteReports, ...unsyncedLocals].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Cache merged
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // ignore
    }

    return merged;
  } catch (err: any) {
    console.warn('Failed to query Supabase reports, using local fallback:', err);
    return localReports;
  }
};

/**
 * Update the status of a saved civic report.
 */
export const updateReportStatus = async (
  id: string,
  status: ReportStatus
): Promise<boolean> => {
  const nowIso = new Date().toISOString();

  // 1. Update in local storage
  const localReports = getLocalReports();
  const match = localReports.find((r) => r.id === id);
  if (match) {
    match.status = status;
    match.updated_at = nowIso;
    saveLocalReport(match);
  }

  // 2. Try Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('civic_reports')
        .update({ status, updated_at: nowIso })
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase status update deferred:', err);
    }
  }

  return true;
};

/**
 * Update the draft text of a saved report.
 */
export const updateReportDraft = async (
  id: string,
  fullDraftText: string
): Promise<boolean> => {
  const nowIso = new Date().toISOString();

  // 1. Update locally
  const localReports = getLocalReports();
  const match = localReports.find((r) => r.id === id);
  if (match) {
    match.full_draft_text = fullDraftText;
    match.updated_at = nowIso;
    saveLocalReport(match);
  }

  // 2. Try Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('civic_reports')
        .update({
          full_draft_text: fullDraftText,
          updated_at: nowIso,
        })
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase draft update deferred:', err);
    }
  }

  return true;
};

/**
 * Delete a report from local storage and Supabase.
 */
export const deleteCivicReport = async (id: string): Promise<boolean> => {
  // 1. Delete locally
  deleteLocalReport(id);

  // 2. Delete from Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('civic_reports').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete deferred:', err);
    }
  }

  return true;
};
