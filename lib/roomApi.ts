export const joinRoom = async (roomId: string, playerId: string) =>
  fetch("/api/rooms/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, playerId }),
  });

export const drawFromDeck = async (roomId: string, playerId: string) =>
  fetch("/api/rooms/draw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, playerId }),
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
  cardId: string
) =>
  fetch("/api/rooms/return", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, playerId, cardId }),
  });

export const refreshMarket = async (roomId: string) =>
  fetch("/api/rooms/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId }),
  });
