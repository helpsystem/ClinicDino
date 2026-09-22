export type Clinic = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  rewardText: string | null;
  gameAssets: {
    bgUrl?: string;
    doctorUrl?: string;
    pillUrl?: string;
    bottleUrl?: string;
    virusUrl?: string;
    syringeUrl?: string;
  } | null;
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing' | null;
};

export type Doctor = {
  id: string;
  clinicId: string;
  name: string;
  title: string | null;
  avatarUrl: string | null;
  spriteSheetUrl: string | null;
  isActive: boolean | null;
};

export type LeaderboardEntry = {
  id: string;
  clinicId: string;
  doctorId: string | null;
  playerName: string;
  score: number;
  selfieUrl: string | null;
  isFlagged: boolean | null;
  createdAt: string | null;
};
