import { NextResponse } from "next/server";
import type { RoomState } from "@/lib/types";
import { DEFAULT_PLAYER_COLOR } from "@/lib/playerColors";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    roomId?: string;
    playerId?: string;
    cardId?: string;
    action?: "used" | "discarded";
  };

  if (!body.roomId || !body.playerId || !body.cardId || !body.action) {
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
  const card_history = [
    ...(room.card_history || []),
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      action: body.action,
      card,
      playerId: body.playerId,
      playerName: player.name,
      playerColor: player.color || DEFAULT_PLAYER_COLOR,
      createdAt: Date.now(),
    },
  ];
  const historyEntry = card_history[card_history.length - 1];

  const updateResult = await supabaseAdmin
    .from("rooms")
    .update({ deck_queue, players, card_history })
    .eq("id", room.id);

  if (!updateResult.error) {
    return NextResponse.json({ ok: true });
  }

  const fallbackResult = await supabaseAdmin.from("rooms").update({ deck_queue, players }).eq("id", room.id);

  if (fallbackResult.error) {
    return NextResponse.json({ error: fallbackResult.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, historyEntry });
}
