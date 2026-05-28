import { NextResponse } from "next/server";
import type { PlayerState, RoomState } from "@/lib/types";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    roomId?: string;
    playerId?: string;
    playerName?: string;
  };

  const name = body.playerName?.trim();

  if (!body.roomId || !body.playerId || !name) {
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
  const existing = room.players[body.playerId];
  if (!existing) {
    const player: PlayerState = {
      id: body.playerId,
      name,
      hand: [],
      joinedAt: Date.now(),
    };
    const players = { ...room.players, [body.playerId]: player };
    await supabaseAdmin.from("rooms").update({ players }).eq("id", room.id);
  } else {
    const needsNameUpdate = existing.name !== name;
    const needsJoinUpdate = !Number.isFinite(existing.joinedAt);
    if (needsNameUpdate || needsJoinUpdate) {
      const player: PlayerState = {
        ...existing,
        name,
        joinedAt: needsJoinUpdate ? Date.now() : existing.joinedAt,
      };
      const players = { ...room.players, [body.playerId]: player };
      await supabaseAdmin.from("rooms").update({ players }).eq("id", room.id);
    }
  }

  return NextResponse.json({ ok: true });
}
