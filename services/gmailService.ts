import { GoogleAuthExpiredError } from '../utils/googleErrors';
import { logger } from '../utils/logger';

const GMAIL_API = 'https://www.googleapis.com/gmail/v1';

export interface EmailMessage {
    to: string;
    subject: string;
    body: string;
}

/**
 * Send an email via Gmail API.
 * Requires a valid Google OAuth token with gmail.send scope.
 */
export async function sendEmail(message: EmailMessage, token: string): Promise<boolean> {
    // Build RFC 2822 formatted email
    const emailLines = [
        `To: ${message.to}`,
        `Subject: ${message.subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        message.body,
    ];
    const rawEmail = emailLines.join('\r\n');

    // Base64url encode
    const encodedMessage = btoa(unescape(encodeURIComponent(rawEmail)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        const res = await fetch(`${GMAIL_API}/users/me/messages/send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw: encodedMessage }),
        });

        if (res.status === 401) {
            throw new GoogleAuthExpiredError();
        }

        if (res.ok) {
            logger.log('[Gmail] Email sent successfully to:', message.to);
            return true;
        }

        const errorData = await res.json().catch(() => ({}));
        logger.error('[Gmail] Failed to send email:', res.status, errorData);
        return false;
    } catch (e) {
        if (e instanceof GoogleAuthExpiredError) throw e;
        logger.error('[Gmail] Error sending email:', e);
        return false;
    }
}
