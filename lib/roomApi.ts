export const joinRoom = async (
  roomId: string,
  playerId: string,
  playerName: string
) =>
  fetch("/api/rooms/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, playerId, playerName }),
  });

export const drawFromDeck = async (roomId: string, playerId: string) =>
  fetch("/api/rooms/draw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, playerId }),
  });

export const rollDice = async (roomId: string, playerId: string) =>
  fetch("/api/rooms/roll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, playerId }),
  });

export const setPlayerColor = async (
  roomId: string,
  playerId: string,
  color: string
) =>
  fetch("/api/rooms/color", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, playerId, color }),
  });

export const buyFromMarket = async (
  roomId: string,
  playerId: string,
  marketIndex: number
) =>
  fetch("/api/rooms/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, playerId, marketIndex }),
  });

export const returnCard = async (
  roomId: string,
  playerId: string,
  cardId: string,
  action: "used" | "discarded"
) =>
  fetch("/api/rooms/return", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, playerId, cardId, action }),
  });

export const refreshMarket = async (roomId: string, playerId: string) =>
  fetch("/api/rooms/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, playerId }),
  });

export const leaveRoom = async (roomId: string, playerId: string) =>
  fetch("/api/rooms/leave", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, playerId }),
  });

export const kickPlayer = async (
  roomId: string,
  playerId: string,
  targetPlayerId: string
) =>
  fetch("/api/rooms/kick", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, playerId, targetPlayerId }),
  });
