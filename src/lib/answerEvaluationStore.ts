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

export const DEFAULT_SUBMISSIONS: AnswerCopySubmission[] = [
  {
    id: "SUB-101",
    studentName: "Rahul Verma",
    studentContact: "@rahul_upsc",
    upiUtr: "432519887412",
    paymentVerified: true,
    topicTitle: "GS-2: Simultaneous Elections & Federalism",
    submittedFileName: "Rahul_GS2_AnswerCopy.pdf",
    studentNote: "Please check structure and conclusion.",
    status: "Evaluated",
    marksAwarded: "8.5 / 15",
    evaluatorFeedback: "Strong constitutional citations (Articles 83 & 172). Add a balanced way forward on federal consensus.",
    evaluatedFileName: "Evaluated_Rahul_GS2_AnswerCopy.pdf",
    isLocked: true,
    submittedAt: "20 Nov 2026",
  },
  {
    id: "SUB-102",
    studentName: "Priya Singh",
    studentContact: "9876501234",
    upiUtr: "432520991104",
    paymentVerified: false,
    topicTitle: "GS-3: National Green Hydrogen Mission",
    submittedFileName: "Priya_GS3_Hydrogen.pdf",
    studentNote: "Evaluate within 250 words limit.",
    status: "Pending Verification",
    evaluatorFeedback: "Awaiting UPI verification & evaluator review.",
    isLocked: false,
    submittedAt: "20 Nov 2026",
  },
];

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
