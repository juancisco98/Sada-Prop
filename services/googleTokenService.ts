import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import type { Session } from '@supabase/supabase-js';

/**
 * Persist Google OAuth tokens after sign-in.
 * Supabase only exposes provider_token during the SIGNED_IN event,
 * so we store it in our google_tokens table for later Calendar/Gmail use.
 */
export async function persistGoogleTokens(session: Session): Promise<void> {
    if (!session.provider_token) return;

    const { error } = await supabase
        .from('google_tokens')
        .upsert({
            user_id: session.user.id,
            provider_token: session.provider_token,
            provider_refresh_token: session.provider_refresh_token || null,
            token_expires_at: null,
            scopes: 'calendar gmail.send',
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

    if (error) {
        logger.error('[GoogleTokens] Failed to persist:', error);
    } else {
        logger.log('[GoogleTokens] Tokens persisted successfully.');
    }
}

/**
 * Retrieve the stored Google provider token for API calls.
 * Returns null if no token is stored.
 */
export async function getGoogleToken(): Promise<string | null> {
    const { data, error } = await supabase
        .from('google_tokens')
        .select('provider_token')
        .single();

    if (error || !data) {
        logger.warn('[GoogleTokens] No stored token found.');
        return null;
    }
    return data.provider_token;
}

/**
 * Save calendar sync state (sync token for incremental sync).
 */
export async function saveSyncToken(userId: string, syncToken: string): Promise<void> {
    const { error } = await supabase
        .from('calendar_sync_state')
        .upsert({
            user_id: userId,
            sync_token: syncToken,
            last_synced_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

    if (error) {
        logger.error('[CalendarSync] Failed to save sync token:', error);
    }
}

/**
 * Get the stored sync token for incremental calendar sync.
 */
export async function getSyncToken(userId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('calendar_sync_state')
        .select('sync_token')
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;
    return data.sync_token;
}
