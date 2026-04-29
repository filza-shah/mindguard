// frontend/src/types/index.ts
//
// Centralised TypeScript type definitions.
// These should mirror the Pydantic schemas in the backend exactly.
// When you change a backend schema, update these too!

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: "youth" | "guardian" | "admin";
  age: number | null;
  is_active: boolean;
  created_at: string; // ISO date string
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ── Check-Ins ─────────────────────────────────────────────────────────────────

export interface CheckInCreate {
  mood_score: number;        // 1-5
  energy_level: number;      // 1-5
  anxiety_level: number;     // 1-5
  sleep_hours?: number;
  note?: string;
  activities: string[];
}

export interface CheckIn {
  id: string;
  mood_score: number;
  energy_level: number;
  anxiety_level: number;
  sleep_hours: number | null;
  note: string | null;
  sentiment_label: "positive" | "negative" | "neutral" | null;
  sentiment_score: number | null;
  activities: string[];
  created_at: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface MoodTrend {
  date: string;          // "2024-06-01"
  avg_mood: number;
  avg_energy: number;
  avg_anxiety: number;
  checkin_count: number;
}

export interface AnalyticsSummary {
  total_checkins: number;
  avg_mood_7d: number | null;
  avg_mood_30d: number | null;
  streak_days: number;
  trend_direction: "improving" | "declining" | "stable";
  unacknowledged_alerts: number;
}

// ── AI Companion ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CompanionResponse {
  response: string;
  conversation_id: string;
}

// ── Anomaly Alerts ────────────────────────────────────────────────────────────

export interface AnomalyAlert {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  alert_type: string;
  description: string;
  anomaly_score: number;
  acknowledged: boolean;
  created_at: string;
}

// ── UI Helpers ────────────────────────────────────────────────────────────────

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: "Very Low 😔",
  2: "Low 😕",
  3: "Okay 😐",
  4: "Good 🙂",
  5: "Great 😄",
};

export const MOOD_COLORS: Record<MoodLevel, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#84cc16",
  5: "#22c55e",
};

export const ACTIVITY_OPTIONS = [
  "Exercise",
  "Reading",
  "Social time",
  "Gaming",
  "Music",
  "Art/Drawing",
  "Nature/Outdoors",
  "School/Work",
  "Relaxing",
  "Therapy/Counselling",
] as const;
