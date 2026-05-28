import { NextResponse } from "next/server";
import type { CardData, RoomState } from "@/lib/types";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fillMarket } from "@/lib/cards";

export async function POST(request: Request) {
  const body = (await request.json()) as { roomId?: string };

  if (!body.roomId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("rooms")
    .select("*")
    .eq("id", body.roomId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const room = data as RoomState;
  const marketToDeck = room.market_cards.filter((c): c is CardData => Boolean(c));
  const deck_queue = [...room.deck_queue, ...marketToDeck];

  const { market, remaining } = fillMarket(deck_queue, 4);

  await supabaseAdmin
    .from("rooms")
    .update({ deck_queue: remaining, market_cards: market })
    .eq("id", room.id);

  return NextResponse.json({ ok: true });
}
