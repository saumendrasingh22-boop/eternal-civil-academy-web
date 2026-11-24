export interface AnswerCopySubmission {
  id: string;
  studentName: string;
  studentContact: string;
  upiUtr: string;
  paymentVerified: boolean;
  topicTitle: string;
  submittedFileName: string;
  studentNote: string;
  status: "Pending Verification" | "Under Evaluation" | "Evaluated";
  marksAwarded?: string;
  evaluatorFeedback: string;
  evaluatedFileName?: string;
  isLocked: boolean;
  submittedAt: string;
}

export const DEFAULT_SUBMISSIONS: AnswerCopySubmission[] = [];

const EVAL_STORAGE_KEY = "eca_answer_evaluation_submissions_v2";

export function loadSubmissions(): AnswerCopySubmission[] {
  if (typeof window === "undefined") return DEFAULT_SUBMISSIONS;
  try {
    const raw = window.localStorage.getItem(EVAL_STORAGE_KEY);
    if (!raw) return DEFAULT_SUBMISSIONS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SUBMISSIONS;
  }
}

export function saveSubmissions(list: AnswerCopySubmission[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EVAL_STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("eca-eval-updated"));
}
