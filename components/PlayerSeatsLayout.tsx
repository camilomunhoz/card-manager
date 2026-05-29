"use client";

import { motion } from "framer-motion";
import type { PlayerState } from "@/lib/types";
import type { GameScale } from "@/hooks/useGameScale";
import ScaledCard from "./ScaledCard";
import type { CardRenderMode } from "./GameCard";
import {
  DEFAULT_PLAYER_COLOR,
  getPlayerColorInfo,
  getReadableTextColor,
} from "@/lib/playerColors";

interface PlayerSeatProps {
  player: PlayerState;
  displayName: string;
  isSelf: boolean;
  isMaster: boolean;
  seatScale: number;
  cardScale: number;
  onClickHand?: () => void;
  onClickOtherPlayer?: () => void;
  onEditProfile?: () => void;
  renderMode: CardRenderMode;
}

function PlayerSeat({
  player,
  displayName,
  isSelf,
  isMaster,
  seatScale,
  cardScale,
  onClickHand,
  onClickOtherPlayer,
  onEditProfile,
  renderMode,
}: PlayerSeatProps) {
  const cards = player.hand ?? [];
  const visible = cards.slice(0, 8);
  const selfScale = isSelf ? 1.36 : 1;
  const colorInfo = getPlayerColorInfo(player.color || DEFAULT_PLAYER_COLOR);
  const fanCenterShift = 34 * cardScale;

  return (
    <motion.div
      className={`flex flex-col items-center ${isSelf || onClickOtherPlayer ? "cursor-pointer" : "pointer-events-none"}`}
      style={{ scale: seatScale * selfScale, transformOrigin: "center" }}
      onClick={isSelf ? onClickHand : onClickOtherPlayer}
    >
      <div className="relative z-20 mb-1 whitespace-nowrap">
        {isSelf ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEditProfile?.();
            }}
            className="inline-flex items-center gap-2 rounded-full px-1 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/75 transition hover:text-white"
          >
            <span>{displayName}</span>
            {isMaster && (
              <span
                aria-label="Master da sala"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--accent)]/35 bg-[color:var(--accent)]/15 text-[10px] leading-none text-[color:var(--accent)]"
              >
                M
              </span>
            )}
            <span
              className="inline-flex h-5 min-w-6 items-center justify-center rounded-full border border-white/15 px-2 text-[10px] font-black uppercase leading-none tabular-nums tracking-[0.18em]"
              style={{
                backgroundColor: colorInfo.value,
                color: getReadableTextColor(colorInfo.value),
                boxShadow: `0 0 0 1px rgba(255,255,255,0.08)`,
              }}
            >
              {cards.length}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/70">
              {displayName}
            </span>
            {isMaster && (
              <span
                aria-label="Master da sala"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--accent)]/35 bg-[color:var(--accent)]/15 text-[10px] leading-none text-[color:var(--accent)]"
              >
                M
              </span>
            )}
            <span
              className="inline-flex h-5 min-w-6 items-center justify-center rounded-full border border-white/15 px-2 text-[10px] font-black uppercase leading-none tabular-nums tracking-[0.18em]"
              style={{
                backgroundColor: colorInfo.value,
                color: getReadableTextColor(colorInfo.value),
                boxShadow: `0 0 0 1px rgba(255,255,255,0.08)`,
              }}
            >
              {cards.length}
            </span>
          </div>
        )}
      </div>

      <div
        className="relative z-0 pointer-events-none"
        style={{ width: 240 * cardScale, height: 144 * cardScale + 24 }}
      >
        {visible.length === 0 ? (
          <span className="text-[10px] uppercase tracking-widest text-white/30">
            Sem cartas
          </span>
        ) : (
          visible.map((card, i) => {
            const fanAngle = i * 5 - visible.length * 2;
            const fanOffset = i * 8 - (visible.length - 1) * 4;
            return (
              <div
                key={`${player.id}-${card.id}-${i}`}
                className="absolute bottom-0 left-1/2"
                style={{
                  transform: `translateX(calc(${fanOffset}px - 50% + ${fanCenterShift}px)) rotate(-90deg) rotate(${fanAngle}deg)`,
                  transformOrigin: "bottom center",
                }}
              >
                <ScaledCard
                  card={card}
                  isFaceUp={false}
                  scale={cardScale}
                  renderMode={renderMode}
                />
              </div>
            );
          })
        )}
      </div>
    </motion.div>
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
    { angle: SEAT_ANGLES[0], left: "50%", top: `${mc - 10}%` },
    { angle: SEAT_ANGLES[1], left: `${m}%`, top: "80%" },
    { angle: SEAT_ANGLES[2], left: `${m}%`, top: "50%" },
    { angle: SEAT_ANGLES[3], left: `${m}%`, top: "20%" },
    { angle: SEAT_ANGLES[4], left: "50%", top: `${m}%` },
    { angle: SEAT_ANGLES[5], left: `${mc - 15}%`, top: `${m}%` },
  ];
}

function computeScale(sectionW: number, sectionH: number, gameScale: GameScale): number {
  if (!sectionW || !sectionH) return 1;
  return Math.max(0.4, Math.min(1, gameScale.scale * 1.2));
}

/* ------------------------------------------------------------------ */
/*  Exported layout                                                    */
/* ------------------------------------------------------------------ */

interface PlayerSeatsLayoutProps {
  orderedPlayers: PlayerState[];
  playerId: string;
  playerName: string;
  masterId: string | null;
  handCardsLength: number;
  viewport: { width: number; height: number };
  gameScale: GameScale;
  onOpenHand: () => void;
  onEditProfile: () => void;
  onKickPlayer?: (playerId: string) => void;
  renderMode?: CardRenderMode;
}

export default function PlayerSeatsLayout({
  orderedPlayers,
  playerId,
  playerName,
  masterId,
  handCardsLength,
  viewport,
  gameScale,
  onOpenHand,
  onEditProfile,
  onKickPlayer,
  renderMode = "safe",
}: PlayerSeatsLayoutProps) {
  const seats = computeSeats(orderedPlayers.length);
  const seatScale = computeScale(viewport.width / 2, viewport.height, gameScale);

  // Fan cards scale down further — single point of control
  const fanCardScale = Math.round(gameScale.scale * 55) / 100;

  return (
    <>
      {orderedPlayers.slice(0, seats.length).map((seatPlayer, index) => {
        const slot = seats[index];
        if (!slot) return null;
        const isSelf = seatPlayer.id === playerId;
        const isMaster = seatPlayer.id === masterId;
        const displayName = seatPlayer.name || (isSelf ? playerName : "Jogador");
        const label = isSelf ? `${displayName} (você)` : displayName;

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
              isMaster={isMaster}
              seatScale={seatScale}
              cardScale={fanCardScale}
              onEditProfile={isSelf ? onEditProfile : undefined}
              onClickOtherPlayer={
                !isSelf && onKickPlayer ? () => onKickPlayer(seatPlayer.id) : undefined
              }
              renderMode={renderMode}
            />
          </div>
        );
      })}
    </>
  );
}
