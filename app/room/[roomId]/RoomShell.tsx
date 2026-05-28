"use client";

import dynamic from "next/dynamic";

const RoomClient = dynamic(() => import("./RoomClient"), { ssr: false });

export default function RoomShell({ roomId }: { roomId: string }) {
  return <RoomClient roomId={roomId} />;
}
