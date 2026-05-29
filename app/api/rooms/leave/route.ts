import { NextResponse } from "next/server";
import type { RoomState } from "@/lib/types";
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
    return NextResponse.json({ ok: true });
  }

  const players = { ...room.players };
  delete players[body.playerId];

  const nextMasterId =
    room.master_id === body.playerId
      ? Object.values(players)
          .sort((left, right) => {
            const leftTime = Number.isFinite(left.joinedAt) ? left.joinedAt : 0;
            const rightTime = Number.isFinite(right.joinedAt) ? right.joinedAt : 0;
            if (leftTime !== rightTime) return leftTime - rightTime;
            return left.id.localeCompare(right.id);
          })[0]?.id || null
      : room.master_id;

  await supabaseAdmin
    .from("rooms")
    .update({ players, master_id: nextMasterId })
    .eq("id", room.id);

  return NextResponse.json({ ok: true });
}