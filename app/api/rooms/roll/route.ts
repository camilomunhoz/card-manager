import { NextResponse } from "next/server";
import type { DiceRollState, RoomState } from "@/lib/types";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const outcomes = ["+Eco", "+Motiv.", "+Regen."] as const;

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
    return NextResponse.json({ error: "Player not in room" }, { status: 404 });
  }

  const roll: DiceRollState = {
    value: outcomes[Math.floor(Math.random() * outcomes.length)],
    playerId: body.playerId,
    rolledAt: Date.now(),
  };

  await supabaseAdmin
    .from("rooms")
    .update({ last_dice_roll: roll })
    .eq("id", room.id);

  return NextResponse.json({ ok: true, roll });
}