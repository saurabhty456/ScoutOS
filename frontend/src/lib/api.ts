const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("scout_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  me: () => request<{ id: string; name: string; email: string }>("/api/auth/me"),
};

// ─── Missions ─────────────────────────────────────────────────────────────────
export const missions = {
  list: () => request<{ missions: import("@/types").Mission[] }>("/api/missions"),
  get: (id: string) => request<import("@/types").Mission>(`/api/missions/${id}`),
  create: (data: import("@/types").MissionInput) =>
    request<import("@/types").Mission>("/api/missions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  start: (id: string) =>
    request<import("@/types").Mission>(`/api/missions/${id}/start`, { method: "POST" }),
  cancel: (id: string) =>
    request<import("@/types").Mission>(`/api/missions/${id}/cancel`, { method: "POST" }),
  steps: (id: string) =>
    request<{ steps: import("@/types").MissionStep[] }>(`/api/missions/${id}/steps`),
  sources: (id: string) =>
    request<{ sources: import("@/types").Source[] }>(`/api/missions/${id}/sources`),
  findings: (id: string) =>
    request<{ findings: import("@/types").Finding[] }>(`/api/missions/${id}/findings`),
  report: (id: string) =>
    request<import("@/types").Report>(`/api/missions/${id}/report`),
};

// ─── Monitors ─────────────────────────────────────────────────────────────────
export const monitors = {
  list: () => request<{ monitors: import("@/types").Monitor[] }>("/api/monitors"),
  get: (id: string) => request<import("@/types").Monitor>(`/api/monitors/${id}`),
  create: (data: Partial<import("@/types").Monitor>) =>
    request<import("@/types").Monitor>("/api/monitors", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  pause: (id: string) =>
    request<import("@/types").Monitor>(`/api/monitors/${id}/pause`, { method: "POST" }),
  resume: (id: string) =>
    request<import("@/types").Monitor>(`/api/monitors/${id}/resume`, { method: "POST" }),
  events: (id: string) =>
    request<{ events: import("@/types").MonitorEvent[] }>(`/api/monitors/${id}/events`),
};

// ─── Actions ──────────────────────────────────────────────────────────────────
export const actions = {
  list: () => request<{ actions: import("@/types").BrowserAction[] }>("/api/actions"),
  get: (id: string) => request<import("@/types").BrowserAction>(`/api/actions/${id}`),
  approve: (id: string) =>
    request<import("@/types").BrowserAction>(`/api/actions/${id}/approve`, { method: "POST" }),
  reject: (id: string) =>
    request<import("@/types").BrowserAction>(`/api/actions/${id}/reject`, { method: "POST" }),
};

// ─── Research ─────────────────────────────────────────────────────────────────
export const research = {
  search: (query: string, purpose?: string) =>
    request<{ results: import("@/types").Source[] }>("/api/research/search", {
      method: "POST",
      body: JSON.stringify({ query, purpose }),
    }),
};
