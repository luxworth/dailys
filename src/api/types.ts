export type ApiSubmissionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type ApiTaskType = 'NUMBER' | 'IMAGE' | 'TEXT';

export type HapticType =
  | 'HEAVY'
  | 'MEDIUM'
  | 'LIGHT'
  | 'SUCCESS_CHIME'
  | 'FAILURE_BUZZ';

export type AudioType =
  | 'CALCULATOR_CLICK'
  | 'ORCHESTRA_CRESCENDO'
  | 'MATCH_STRIKE'
  | 'PLASMA_IGNITION'
  | 'ERROR_DULL';

export interface InteractionMeta {
  haptic: HapticType;
  audio: AudioType | null;
  milestone: string | null;
  intensity: number;
}

export interface TransactionalResponse<T> {
  data: T;
  interaction: InteractionMeta;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  timezone: string;
}

export interface TaskInfo {
  task_type: ApiTaskType;
  title: string;
  placeholder: string | null;
}

export interface SubmissionSummary {
  id: string;
  status: ApiSubmissionStatus;
  is_ghost: boolean;
  submitted_at: string | null;
  number_value: string | null;
  text_value: string | null;
  image_url: string | null;
}

export interface ChallengeToday {
  challenge_id: string;
  sequence_number: number;
  released_at: string;
  closes_at: string;
  task: TaskInfo;
  submission: SubmissionSummary | null;
}

export interface SubmissionPayload {
  number_value?: string;
  text_value?: string;
  image_url?: string;
}

export interface SubmissionResponse {
  id: string;
  challenge_id: string;
  status: ApiSubmissionStatus;
  is_ghost: boolean;
  number_value: string | null;
  text_value: string | null;
  image_url: string | null;
  submitted_at: string;
}

export interface ReactionCounts {
  mind_blown: number;
  laugh: number;
  respect: number;
}

export interface FeedItem {
  id: string;
  username: string;
  proof_preview: string;
  submitted_at: string;
  reactions: ReactionCounts;
  viewer_reaction: ApiReactionType | null;
}

export interface FeedPage {
  items: FeedItem[];
  next_cursor: string | null;
}

export interface StreakResponse {
  streak: number;
}

export interface UserItemsResponse {
  ghost: number;
}

export interface GhostDeployResponse {
  submission_id: string;
  challenge_id: string;
  ghosts_remaining: number;
}

export interface UploadResponse {
  image_url: string;
}

export type ApiReactionType = 'MIND_BLOWN' | 'LAUGH' | 'RESPECT';

export type ApiHistoryDayStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'NONE';

export interface SquadCreatedResponse {
  squad_id: string;
  name: string;
  invite_code: string;
}

export interface MySquadResponse {
  squad_id: string;
  name: string;
  invite_code: string;
  member_count: number;
  max_members: number;
}

export interface SquadLeaderboardEntry {
  user_id: string;
  username: string;
  streak: number;
  status: string;
  today_status: ApiSubmissionStatus | null;
  rank: number;
}

export interface SquadLeaderboardResponse {
  squad_id: string;
  week_start: string | null;
  week_end: string | null;
  entries: SquadLeaderboardEntry[];
}

export interface HistoryDay {
  date: string;
  status: ApiHistoryDayStatus;
}

export interface HistoryTraceEntry {
  date: string;
  task_type: ApiTaskType;
  title: string;
  submission_preview: string;
}

export interface UserHistoryResponse {
  streak: number;
  days: HistoryDay[];
  trace: HistoryTraceEntry[];
}

export interface PercentileResponse {
  percentile: number | null;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  timezone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
