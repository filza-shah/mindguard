// frontend/src/lib/api.ts

import axios, { AxiosError } from "axios";
import type {
  User, TokenResponse, CheckIn, CheckInCreate,
  AnalyticsSummary, MoodTrend, CompanionResponse, ChatMessage, AnomalyAlert,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://mindguard-1x3w.onrender.com";

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (data: {
    email: string; username: string; password: string;
    display_name?: string; age?: number;
  }): Promise<User> => (await apiClient.post<User>("/auth/register", data)).data,

  login: async (email: string, password: string): Promise<TokenResponse> =>
    (await apiClient.post<TokenResponse>("/auth/login", { email, password })).data,

  getMe: async (): Promise<User> => (await apiClient.get<User>("/auth/me")).data,
};

export const checkinsApi = {
  create: async (data: CheckInCreate): Promise<CheckIn> =>
    (await apiClient.post<CheckIn>("/checkins/", data)).data,

  list: async (skip = 0, limit = 30): Promise<CheckIn[]> =>
    (await apiClient.get<CheckIn[]>("/checkins/", { params: { skip, limit } })).data,

  getById: async (id: string): Promise<CheckIn> =>
    (await apiClient.get<CheckIn>(`/checkins/${id}`)).data,
};

export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> =>
    (await apiClient.get<AnalyticsSummary>("/analytics/summary")).data,

  getTrends: async (days = 30): Promise<MoodTrend[]> =>
    (await apiClient.get<MoodTrend[]>("/analytics/trends", { params: { days } })).data,
};

export const alertsApi = {
  list: async (unacknowledgedOnly = false): Promise<AnomalyAlert[]> =>
    (await apiClient.get<AnomalyAlert[]>("/alerts/", {
      params: { unacknowledged_only: unacknowledgedOnly },
    })).data,

  acknowledge: async (alertId: string): Promise<AnomalyAlert> =>
    (await apiClient.patch<AnomalyAlert>(`/alerts/${alertId}/acknowledge`)).data,
};

export const companionApi = {
  chat: async (
    message: string,
    conversationHistory: ChatMessage[],
    moodContext?: Record<string, unknown>
  ): Promise<CompanionResponse> =>
    (await apiClient.post<CompanionResponse>("/companion/chat", {
      message,
      conversation_history: conversationHistory,
      mood_context: moodContext,
    })).data,
};

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail[0]?.msg ?? "Validation error";
  }
  return "Something went wrong. Please try again.";
}
