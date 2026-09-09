export interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  remote: string;
  match: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface ApplicationItem {
  id: string;
  company: string;
  role: string;
  stage: "Applied" | "Under Review" | "Interview" | "Offer" | "Rejected";
  location: string;
}

export interface CoverLetterDraft {
  id: string;
  title: string;
  company: string;
  createdAt: string;
}

export interface ResumeVersion {
  id: string;
  label: string;
  score: number;
  feedback: string;
}

export const jobRecommendations: JobRecommendation[] = [];

export const resumeVersions: ResumeVersion[] = [];

export const coverLetters: CoverLetterDraft[] = [];

export const applications: ApplicationItem[] = [];
