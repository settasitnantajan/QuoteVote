export interface Quote {
    id: string;
    text: string;
    author: string;
    votes: number;
    createdAt: Date;
    updatedAt: Date;
    avatarUrl?: string;
    isVoted?: boolean;
    createdBy?: string;
  }
  