// frontend/src/lib/api.ts
//
// Centralised API client. All HTTP calls go through this.
//
// WHY AXIOS OVER FETCH?
// - Automatic JSON parsing
// - Request/response interceptors (we use this for auth token injection)
// - Better error handling (throws on 4xx/5xx by default)
// - Easy timeout configuration

import axios, { AxiosError } from "axios";
import type {
  User,
  TokenResponse,
  CheckIn,
  CheckInCreate,
  AnalyticsSummary,
  MoodTrend,
  CompanionResponse,
  ChatMessage,
} from "@/types";

// The base URL comes from an environment variable.
// In Docker: NEXT_PUBLIC_API_URL=http://localhost:8000
// In production: NEXT_PUBLIC_API_URL=https://api.yourdomain.com
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 30_000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor ───────────────────────────────────────────────────────
// Runs before EVERY request. Automatically injects the JWT token from localStorage.
// This means you never have to manually add Authorization headers.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────────────────────────────
// Runs after EVERY response. If we get a 401 (Unauthorized), the token has
// expired — we clear it and redirect to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      // Only redirect if we're in a browser context (not during SSR)
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── API Functions ─────────────────────────────────────────────────────────────
// Each function wraps one API endpoint. This keeps all API calls in one place.

// Auth
export const authApi = {
  register: async (data: {
    email: string;
    username: string;
    password: string;
    display_name?: string;
    age?: number;
  }): Promise<User> => {
    const res = await apiClient.post<User>("/auth/register", data);
    return res.data;
  },

  login: async (email: string, password: string): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>("/auth/login", { email, password });
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>("/auth/me");
    return res.data;
  },
};

// Check-ins
export const checkinsApi = {
  create: async (data: CheckInCreate): Promise<CheckIn> => {
    const res = await apiClient.post<CheckIn>("/checkins/", data);
    return res.data;
  },

  list: async (skip = 0, limit = 30): Promise<CheckIn[]> => {
    const res = await apiClient.get<CheckIn[]>("/checkins/", {
      params: { skip, limit },
    });
    return res.data;
  },

  getById: async (id: string): Promise<CheckIn> => {
    const res = await apiClient.get<CheckIn>(`/checkins/${id}`);
    return res.data;
  },
};

// Analytics
export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const res = await apiClient.get<AnalyticsSummary>("/analytics/summary");
    return res.data;
  },

  getTrends: async (days = 30): Promise<MoodTrend[]> => {
    const res = await apiClient.get<MoodTrend[]>("/analytics/trends", {
      params: { days },
    });
    return res.data;
  },
};

// AI Companion
export const companionApi = {
  chat: async (
    message: string,
    conversationHistory: ChatMessage[],
    moodContext?: Record<string, unknown>
  ): Promise<CompanionResponse> => {
    const res = await apiClient.post<CompanionResponse>("/companion/chat", {
      message,
      conversation_history: conversationHistory,
      mood_context: moodContext,
    });
    return res.data;
  },
};

// ── Error Helper ──────────────────────────────────────────────────────────────
// Extracts a human-readable error message from an Axios error.
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail[0]?.msg ?? "Validation error";
  }
  return "Something went wrong. Please try again.";
}
