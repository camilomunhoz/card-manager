import { NextResponse } from "next/server";
import type { RoomState } from "@/lib/types";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { drawCard } from "@/lib/cards";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    roomId?: string;
    playerId?: string;
    marketIndex?: number;
  };

  if (!body.roomId || !body.playerId || body.marketIndex === undefined) {
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
  const player = room.players[body.playerId];
  if (!player) {
    return NextResponse.json({ error: "Player not in room" }, { status: 404 });
  }

  const marketCard = room.market_cards[body.marketIndex];
  if (!marketCard) {
    return NextResponse.json({ error: "Market slot empty" }, { status: 409 });
  }

  const { card: nextCard, rest } = drawCard(room.deck_queue);
  const market_cards = [...room.market_cards];
  market_cards[body.marketIndex] = nextCard;

  const updatedPlayer = { ...player, hand: [...player.hand, marketCard] };
  const players = { ...room.players, [body.playerId]: updatedPlayer };

  await supabaseAdmin
    .from("rooms")
    .update({ deck_queue: rest, market_cards, players })
    .eq("id", room.id);

  return NextResponse.json({ ok: true });
}
