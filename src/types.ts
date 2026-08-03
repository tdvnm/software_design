export interface Course {
  code: string;
  title: string;
  subjects: string[];
  credits: number;
  description: string;
}

export interface Term {
  id: string;
  year: number;
  label: string;
}

export type Plan = Record<string, Course[]>;
