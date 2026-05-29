import { NextResponse } from "next/server";
import { parseCsvToDeck, shuffleDeck, fillMarket } from "@/lib/cards";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const generateRoomCode = () => {
  const stamp = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ROOM-${stamp}`;
};

export async function POST() {
  const csvUrl = process.env.NEXT_PUBLIC_CSV_URL;
  if (!csvUrl) {
    return NextResponse.json({ error: "CSV URL missing" }, { status: 500 });
  }

  const csvResponse = await fetch(csvUrl, { cache: "no-store" });
  if (!csvResponse.ok) {
    return NextResponse.json({ error: "CSV fetch failed" }, { status: 500 });
  }

  const csvText = await csvResponse.text();
  const deck = await parseCsvToDeck(csvText);
  const shuffled = shuffleDeck(deck);
  const { market, remaining } = fillMarket(shuffled, 4);

  let roomId = generateRoomCode();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await supabaseAdmin.from("rooms").insert({
      id: roomId,
      master_id: null,
      deck_queue: remaining,
      market_cards: market,
      players: {},
      last_dice_roll: null,
    });
    if (!error) break;
    roomId = generateRoomCode();
  }

  return NextResponse.json({ roomId });
}
