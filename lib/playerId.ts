const PLAYER_KEY = "card-arena-player-id";

export const getOrCreatePlayerId = () => {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(PLAYER_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(PLAYER_KEY, id);
  return id;
};
