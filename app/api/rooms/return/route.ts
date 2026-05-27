import { NextResponse } from "next/server";
import type { RoomState } from "@/lib/types";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    roomId?: string;
    playerId?: string;
    cardId?: string;
  };

  if (!body.roomId || !body.playerId || !body.cardId) {
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

  const cardIndex = player.hand.findIndex((card) => card.id === body.cardId);
  if (cardIndex === -1) {
    return NextResponse.json({ error: "Card not in hand" }, { status: 409 });
  }

  const card = player.hand[cardIndex];
  const hand = [...player.hand];
  hand.splice(cardIndex, 1);

  const updatedPlayer = { ...player, hand };
  const players = { ...room.players, [body.playerId]: updatedPlayer };
  const deck_queue = [...room.deck_queue, card];

  await supabaseAdmin
    .from("rooms")
    .update({ deck_queue, players })
    .eq("id", room.id);

  return NextResponse.json({ ok: true });
}
