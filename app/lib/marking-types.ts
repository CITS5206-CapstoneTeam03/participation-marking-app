export type Score = 0 | 1 | 2 | 3;

export type StudentMark = {
  id: string;
  name: string;
  studentNumber: string;
  photoUrl: string;
};

export type StudentScoreMap = Record<string, Score>;
