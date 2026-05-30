import { NextResponse } from "next/server";
import type { RoomState } from "@/lib/types";
import { normalizePlayerColors } from "@/lib/playerColors";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    roomId?: string;
    playerId?: string;
    color?: string;
  };

  if (!body.roomId || !body.playerId || !body.color) {
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

  const players = normalizePlayerColors(room.players, body.playerId, body.color);
  const assignedColor = players[body.playerId]?.color ?? null;

  await supabaseAdmin.from("rooms").update({ players }).eq("id", room.id);

  return NextResponse.json({ ok: true, color: assignedColor });
}