// ─── Shared types ─────────────────────────────────────────────────────────────
export type AppStatus = 'pending' | 'accepted' | 'rejected' | 'in_process';
export type Tab = 'list' | 'new' | 'base-cv' | 'dashboard';

export interface BaseCV {
  fullName: string; email: string; phone: string; location: string; linkedIn: string;
  summary: string; experience: string; education: string; skills: string;
  languages: string; certifications: string;
}

export interface Application {
  id: string; company: string; position: string; appliedAt: string;
  status: AppStatus; jobOffer: string; atsScore?: number;
  cvGenerated?: boolean;
  cvGeneratedEs?: string;
  cvGeneratedEn?: string;
}

export interface CvEvalResult {
  score: number;
  approved: boolean;
  summary: string;
  fieldFeedback: Record<string, string>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ailab_at') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export const EMPTY_CV: BaseCV = {
  fullName: '', email: '', phone: '', location: '', linkedIn: '',
  summary: '', experience: '', education: '', skills: '', languages: '', certifications: '',
};

export function isCVComplete(cv: BaseCV) {
  return !!(cv.fullName && cv.email && (cv.experience || cv.summary));
}
