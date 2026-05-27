import { NextResponse } from "next/server";
import type { PlayerState, RoomState } from "@/lib/types";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    roomId?: string;
    playerId?: string;
  };

  if (!body.roomId || !body.playerId) {
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
  if (!room.players[body.playerId]) {
    const player: PlayerState = { id: body.playerId, hand: [] };
    const players = { ...room.players, [body.playerId]: player };
    await supabaseAdmin
      .from("rooms")
      .update({ players })
      .eq("id", room.id);
  }

  return NextResponse.json({ ok: true });
}
