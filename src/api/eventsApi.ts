/**
 * Events API (Tournaments)
 * 
 * Tournament and competition management for fashion events.
 * Browsing endpoints are public, registration requires user auth,
 * and creation is restricted to admin-authenticated clients.
 * 
 * @module Events
 */

import { request, APIResponse } from "./core";
import type {
    Tournament,
    CreateTournamentRequest,
    Leaderboard,
} from "./api.types";

// ============================================================================
// Events (Tournaments) API
// ============================================================================

export namespace Events {
    const BASE_PATH = '/tournaments';

    function getUserToken(): string | undefined {
        return localStorage.getItem('token') ?? undefined;
    }

    function getAdminToken(): string | undefined {
        return localStorage.getItem('admin_token') ?? undefined;
    }

    /**
     * List tournaments
     * 
     * Returns all tournaments with basic info: id, name, status,
     * participant count, start/end dates.
     */
    export async function listTournaments(): Promise<APIResponse<Tournament[]>> {
        return request(BASE_PATH, 'GET', undefined, undefined, true);
    }

    /**
     * Get tournament details
     * 
     * Returns full tournament record including description, rules,
     * banner image, prize info, registration fee, max participants,
     * registered users, and featured outfits.
     */
    export async function getTournament(id: string): Promise<APIResponse<Tournament>> {
        return request(`${BASE_PATH}/${id}`, 'GET', undefined, undefined, true);
    }

    /**
     * Get tournament leaderboard
     * 
     * Returns current leaderboard for a tournament with rankings
     * ordered by score. Includes outfit_id, user_id, rank, and score.
     */
    export async function getLeaderboard(id: string): Promise<APIResponse<Leaderboard>> {
        return request(`${BASE_PATH}/${id}/leaderboard`, 'GET', undefined, undefined, true);
    }

    /**
     * Register for tournament
     * 
     * Registers the authenticated user for a tournament.
     * 
     * Common errors:
     * - 400 BAD_REQUEST: registration closed, tournament full, or already registered
     * - 401 UNAUTHORIZED: missing or invalid user token
     * - 404 NOT_FOUND: tournament does not exist
     */
    export async function register(id: string, token?: string): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/${id}/register`, 'POST', {}, token || getUserToken());
    }

    /**
     * Create tournament (admin)
     * 
     * Creates a new tournament. Newly created tournaments start
     * with status 'upcoming'.
     * 
     * Required fields: name, start_date, end_date
     * Optional fields: description, registration_fee, prize
     */
    export async function createTournament(tournament: CreateTournamentRequest, token?: string): Promise<APIResponse<Tournament>> {
        return request(BASE_PATH, 'POST', tournament, token || getAdminToken());
    }
}
