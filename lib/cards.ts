import Papa from "papaparse";
import type { CardClass, CardData } from "./types";

const classMap: Record<string, CardClass> = {
  resiliente: "Resiliente",
  sinergista: "Sinergista",
  impetuoso: "Impetuoso",
};

const normalizeKey = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, "_");

type CsvRow = Record<string, string>;

export const parseCsvToDeck = async (csvText: string) => {
  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length) {
    throw new Error("CSV parse error");
  }

  const rows = parsed.data;
  const deck: CardData[] = [];

  rows.forEach((row, index) => {
    const normalized: Record<string, string> = {};
    Object.entries(row).forEach(([key, value]) => {
      normalized[normalizeKey(key)] = value ?? "";
    });

    const classeRaw = normalized.classe || normalized.class || "";
    const classe = classMap[classeRaw.toLowerCase()];
    const custo = Number(normalized.custo || "0");
    const titulo = normalized.titulo || normalized.title || `Carta ${index + 1}`;
    const descricao = normalized.descricao || normalized.description || "";
    const condicao = normalized.condicao || normalized.condicion || "";
    const quantidade = Number(normalized.quantidade || "1") || 1;

    if (!classe) return;

    for (let i = 0; i < quantidade; i += 1) {
      deck.push({
        id: crypto.randomUUID(),
        classe,
        custo,
        titulo,
        descricao,
        condicao: condicao || null,
      });
    }
  });

  return deck;
};

export const shuffleDeck = (deck: CardData[]) => {
  const array = [...deck];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const drawCard = (deck: CardData[]) => {
  const [card, ...rest] = deck;
  return { card: card ?? null, rest };
};

export const fillMarket = (deck: CardData[], slots = 4) => {
  const market: Array<CardData | null> = [];
  let remaining = [...deck];
  for (let i = 0; i < slots; i += 1) {
    const { card, rest } = drawCard(remaining);
    market.push(card);
    remaining = rest;
  }
  return { market, remaining };
};
