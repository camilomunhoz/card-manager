import type { PlayerColor } from "@/lib/playerColors";

export type CardClass = "Resiliente" | "Sinergista" | "Impetuoso";

export interface CardData {
  id: string;
  classe: CardClass;
  custo: number;
  titulo: string;
  descricao: string;
  condicao: string | null;
}

export type CardHistoryAction = "used" | "discarded";

export interface CardHistoryEntry {
  id: string;
  action: CardHistoryAction;
  card: CardData;
  playerId: string;
  playerName: string;
  playerColor: PlayerColor;
  createdAt: number;
}

export interface PlayerState {
  id: string;
  name: string;
  hand: CardData[];
  joinedAt: number;
  color?: PlayerColor;
}

export interface DiceRollState {
  value: string;
  playerId: string;
  rolledAt: number;
}

export interface RoomState {
  id: string;
  master_id: string | null;
  deck_queue: CardData[];
  market_cards: Array<CardData | null>;
  players: Record<string, PlayerState>;
  last_dice_roll: DiceRollState | null;
  card_history?: CardHistoryEntry[];
}
