import { getStoredValue, setStoredValue } from "@/lib/browserStorage";

const PLAYER_KEY = "card-arena-player-id";
const PLAYER_NAME_KEY = "card-arena-player-name";
const PLAYER_COLOR_KEY = "card-arena-player-color";
export const MAX_PLAYER_NAME_LENGTH = 16;

export const normalizePlayerName = (value: string) =>
  value.trim().replace(/\s+/g, " ").slice(0, MAX_PLAYER_NAME_LENGTH);

const fallbackUUID = () => {
  const hex = "0123456789abcdef";
  let value = "";
  for (let i = 0; i < 32; i += 1) {
    value += hex[Math.floor(Math.random() * 16)];
  }
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-4${value.slice(13, 16)}-${
    hex[8 + Math.floor(Math.random() * 4)]
  }${value.slice(17, 20)}-${value.slice(20)}`;
};

const generateUUID = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return fallbackUUID();
};

export const getOrCreatePlayerId = () => {
  if (typeof window === "undefined") return "";
  const existing = getStoredValue(PLAYER_KEY);
  if (existing) return existing;
  const id = generateUUID();
  setStoredValue(PLAYER_KEY, id);
  return id;
};

export const getStoredPlayerName = () => {
  if (typeof window === "undefined") return "";
  return getStoredValue(PLAYER_NAME_KEY);
};

export const setStoredPlayerName = (name: string) => {
  if (typeof window === "undefined") return;
  setStoredValue(PLAYER_NAME_KEY, name);
};

export const getStoredPlayerColor = () => {
  if (typeof window === "undefined") return "";
  return getStoredValue(PLAYER_COLOR_KEY);
};

export const setStoredPlayerColor = (color: string) => {
  if (typeof window === "undefined") return;
  setStoredValue(PLAYER_COLOR_KEY, color);
};
