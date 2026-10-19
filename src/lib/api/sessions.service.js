import { apiClient } from "./client";

/** Study sessions: one per game, only for signed-in players. */
export const sessionsApi = {
  /** @returns {Promise<{ session: { id: string, startedAt: string } }>} */
  start: () => apiClient.post("/sessions"),
  /** @param {string} id @param {{ movesPlayed: number, hintsUsed: number, accuracy: number | null }} body */
  end: (id, body) => apiClient.patch(`/sessions/${id}`, body),
};
