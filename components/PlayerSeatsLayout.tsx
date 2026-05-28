"use client";

import type { PlayerState } from "@/lib/types";
import GameCard from "./GameCard";

interface PlayerSeatProps {
  player: PlayerState;
  displayName: string;
  isSelf: boolean;
  scale: number;
  onClickHand?: () => void;
}

function PlayerSeat({ player, displayName, isSelf, scale, onClickHand }: PlayerSeatProps) {
  const cards = player.hand ?? [];
  const visible = cards.slice(0, 8);
  const selfScale = isSelf ? 1.5 : 1;

  return (
    <div
      className={`flex flex-col items-center ${isSelf ? "cursor-pointer" : "pointer-events-none"}`}
      style={{ transform: `scale(${scale * selfScale})`, transformOrigin: "center" }}
      onClick={onClickHand}
    >
      <span className="mb-2 whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-white/70">
        {displayName}
      </span>

      <div className="relative h-24 w-44">
        {visible.length === 0 ? (
          <span className="text-[10px] uppercase tracking-widest text-white/30">
            Sem cartas
          </span>
        ) : (
          visible.map((card, i) => {
            const fanAngle = i * 6 - visible.length * 2.5;
            const fanOffset = i * 10;
            return (
              <div
                key={`${player.id}-${card.id}-${i}`}
                className="absolute bottom-0 left-1/2"
                style={{
                  transform: `translateX(${fanOffset}px) rotate(-90deg) rotate(${fanAngle}deg)`,
                  transformOrigin: "bottom center",
                }}
              >
                <GameCard card={card} isFaceUp={false} size="sm" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Seat layout                                                        */
/* ------------------------------------------------------------------ */

const SEAT_ANGLES: number[] = [0, 90, 90, 90, 180, 180];

interface SeatSlot {
  angle: number;
  left: string;
  top: string;
}

function computeSeats(count: number): SeatSlot[] {
  const margin = Math.max(0.06, Math.min(0.16, 0.16 - Math.max(0, count - 2) * 0.02));
  const m = margin * 100;
  const mc = 100 - m;
  return [
    { angle: SEAT_ANGLES[0], left: "50%", top: `${mc-10}%` },
    { angle: SEAT_ANGLES[1], left: `${m}%`,  top: "80%" },
    { angle: SEAT_ANGLES[2], left: `${m}%`, top: "50%" },
    { angle: SEAT_ANGLES[3], left: `${m}%`,  top: "20%" },
    { angle: SEAT_ANGLES[4], left: `50%`, top: `${m}%` },
    { angle: SEAT_ANGLES[5], left: `${mc-15}%`, top: `${m}%` },
  ];
}

function computeScale(sectionW: number, sectionH: number): number {
  if (!sectionW || !sectionH) return 1;
  return Math.max(0.45, Math.min(1, Math.min(sectionW, sectionH) / 800));
}

/* ------------------------------------------------------------------ */
/*  Exported layout                                                    */
/* ------------------------------------------------------------------ */

interface PlayerSeatsLayoutProps {
  orderedPlayers: PlayerState[];
  playerId: string;
  playerName: string;
  handCardsLength: number;
  viewport: { width: number; height: number };
  onOpenHand: () => void;
}

export default function PlayerSeatsLayout({
  orderedPlayers,
  playerId,
  playerName,
  handCardsLength,
  viewport,
  onOpenHand,
}: PlayerSeatsLayoutProps) {
  const seats = computeSeats(orderedPlayers.length);
  const scale = computeScale(viewport.width / 2, viewport.height);

  return (
    <>
      {orderedPlayers.slice(0, seats.length).map((seatPlayer, index) => {
        const slot = seats[index];
        if (!slot) return null;
        const isSelf = seatPlayer.id === playerId;
        const displayName = seatPlayer.name || (isSelf ? playerName : "Jogador");
        const label = isSelf ? `${displayName} (voce)` : displayName;

        return (
          <div
            key={seatPlayer.id}
            className="absolute"
            style={{
              left: slot.left,
              top: slot.top,
              transform: `translate(-50%, -50%) rotate(${slot.angle}deg)`,
            }}
            onClick={() => {
              if (!isSelf || handCardsLength === 0) return;
              onOpenHand();
            }}
          >
            <PlayerSeat
              player={seatPlayer}
              displayName={label}
              isSelf={isSelf}
              scale={scale}
            />
          </div>
        );
      })}
    </>
  );
}
