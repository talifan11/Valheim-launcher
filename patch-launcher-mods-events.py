from pathlib import Path

ROOT = Path(".")

# 1. api.ts — методы для модов и событий
p = ROOT / "src" / "lib" / "api.ts"
text = p.read_text(encoding="utf-8")

if "getUserMods" not in text:
    text += '''

// ============================================================
// МОДЫ (для лаунчера)
// ============================================================

export interface UserMod {
  name: string;
  filename: string;
  mandatory: boolean;
  enabled_default: boolean;
  description: string;
  category: string;
  enabled: boolean;
}

export async function getUserMods(token: string): Promise<UserMod[]> {
  const res = await fetch(`${API_BASE}/mods/list`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка модов: ${res.status}`);
  return res.json();
}

export async function toggleUserMod(token: string, modName: string, enabled: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/mods/${encodeURIComponent(modName)}/toggle`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Ошибка' }));
    throw new Error(data.detail || `Ошибка: ${res.status}`);
  }
}

// ============================================================
// СОБЫТИЯ (для лаунчера)
// ============================================================

export interface EventParticipant {
  user_id: number;
  username: string;
  avatar_url: string | null;
}

export interface GameEvent {
  id: number;
  title: string;
  description: string;
  starts_at: string;
  category: string;
  location: string | null;
  max_slots: number | null;
  author_id: number;
  created_at: string;
  status: string;
  author: { user_id: number; username: string; avatar_url: string | null };
  participants: EventParticipant[];
  participants_count: number;
  joined: boolean;
}

export async function getEvents(token: string): Promise<GameEvent[]> {
  const res = await fetch(`${API_BASE}/events`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка событий: ${res.status}`);
  return res.json();
}

export interface CreateEventPayload {
  title: string;
  description: string;
  starts_at: string;
  category: string;
  location?: string;
  max_slots?: number;
}

export async function createEvent(token: string, payload: CreateEventPayload): Promise<{ id: number }> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Ошибка' }));
    throw new Error(data.detail || `Ошибка: ${res.status}`);
  }
  return res.json();
}

export async function joinEvent(token: string, eventId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${eventId}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: 'Ошибка' }));
    throw new Error(data.detail || `Ошибка: ${res.status}`);
  }
}

export async function leaveEvent(token: string, eventId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${eventId}/leave`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
}

export async function deleteEvent(token: string, eventId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
}
'''
    p.write_text(text, encoding="utf-8")
    print("OK: api.ts + моды + события для лаунчера")
else:
    print("SKIP: api.ts уже есть")

print()
print("=== ЧАСТЬ 1/3 ГОТОВА ===")
