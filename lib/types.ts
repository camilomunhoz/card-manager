export type CardClass = "Resiliente" | "Sinergista" | "Impetuoso";

export interface CardData {
  id: string;
  classe: CardClass;
  custo: number;
  titulo: string;
  descricao: string;
  condicao: string | null;
}

export interface PlayerState {
  id: string;
  name: string;
  hand: CardData[];
  joinedAt: number;
}

export interface RoomState {
  id: string;
  master_id: string | null;
  deck_queue: CardData[];
  market_cards: Array<CardData | null>;
  players: Record<string, PlayerState>;
}
