import type { PlayerState } from "@/lib/types";

export const PLAYER_COLORS = [
  { id: "azul", label: "Azul", value: "#4f8cff", glow: "rgba(79, 140, 255, 0.45)" },
  { id: "verde", label: "Verde", value: "#34d399", glow: "rgba(52, 211, 153, 0.45)" },
  { id: "amarelo", label: "Amarelo", value: "#fbbf24", glow: "rgba(251, 191, 36, 0.45)" },
  { id: "vermelho", label: "Vermelho", value: "#fb7185", glow: "rgba(251, 113, 133, 0.45)" },
  { id: "ciano", label: "Ciano", value: "#22d3ee", glow: "rgba(34, 211, 238, 0.45)" },
  { id: "laranja", label: "Laranja", value: "#fb923c", glow: "rgba(251, 146, 60, 0.45)" },
  { id: "lima", label: "Lima", value: "#a3e635", glow: "rgba(163, 230, 53, 0.45)" },
  { id: "rosa", label: "Rosa", value: "#f472b6", glow: "rgba(244, 114, 182, 0.45)" },
] as const;

export type PlayerColor = (typeof PLAYER_COLORS)[number]["id"];

const COLOR_MAP = new Map(PLAYER_COLORS.map((entry) => [entry.id, entry] as const));

export const DEFAULT_PLAYER_COLOR: PlayerColor = PLAYER_COLORS[0].id;

export const getPlayerColorInfo = (color?: string | null) => {
  if (!color) return COLOR_MAP.get(DEFAULT_PLAYER_COLOR)!;
  return COLOR_MAP.get(color as PlayerColor) ?? COLOR_MAP.get(DEFAULT_PLAYER_COLOR)!;
};

export const getReadableTextColor = (color: string) => {
  const normalized = color.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => part + part)
          .join("")
      : normalized;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.58 ? "#000000" : "#ffffff";
};

const getPlayerJoinOrder = (player: PlayerState) => {
  const joinedAt = Number.isFinite(player.joinedAt) ? player.joinedAt : 0;
  return [joinedAt, player.id] as const;
};

export const getAvailablePlayerColors = (
  players: Record<string, PlayerState>,
  exceptPlayerId?: string
) => {
  const taken = new Set<string>();
  Object.values(players).forEach((player) => {
    if (player.id === exceptPlayerId) return;
    if (player.color && COLOR_MAP.has(player.color as PlayerColor)) {
      taken.add(player.color);
    }
  });

  return PLAYER_COLORS.filter((entry) => !taken.has(entry.id));
};

export const normalizePlayerColors = (
  players: Record<string, PlayerState>,
  preferredPlayerId?: string,
  preferredColor?: string | null
) => {
  const ordered = Object.values(players).slice().sort((left, right) => {
    const [leftJoinedAt, leftId] = getPlayerJoinOrder(left);
    const [rightJoinedAt, rightId] = getPlayerJoinOrder(right);
    if (leftJoinedAt !== rightJoinedAt) return leftJoinedAt - rightJoinedAt;
    return leftId.localeCompare(rightId);
  });

  const priorityPlayer = preferredPlayerId
    ? players[preferredPlayerId] ?? null
    : null;
  const evaluationOrder = priorityPlayer
    ? [priorityPlayer, ...ordered.filter((player) => player.id !== priorityPlayer.id)]
    : ordered;

  const nextPlayers: Record<string, PlayerState> = { ...players };
  const used = new Set<PlayerColor>();

  const chooseColor = () =>
    PLAYER_COLORS.find((entry) => !used.has(entry.id))?.id ?? DEFAULT_PLAYER_COLOR;

  if (priorityPlayer) {
    const requested =
      preferredColor && COLOR_MAP.has(preferredColor as PlayerColor)
        ? (preferredColor as PlayerColor)
        : null;
    const assigned = requested ?? chooseColor();
    used.add(assigned);
    nextPlayers[priorityPlayer.id] = { ...priorityPlayer, color: assigned };
  }

  evaluationOrder.forEach((player) => {
    if (priorityPlayer && player.id === priorityPlayer.id) return;
    const currentColor = player.color && COLOR_MAP.has(player.color as PlayerColor)
      ? (player.color as PlayerColor)
      : null;
    const assigned = currentColor && !used.has(currentColor) ? currentColor : chooseColor();
    used.add(assigned);
    nextPlayers[player.id] = { ...player, color: assigned };
  });

  return nextPlayers;
};