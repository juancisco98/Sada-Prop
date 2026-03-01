export class GoogleAuthExpiredError extends Error {
    constructor(message: string = 'Google token expired') {
        super(message);
        this.name = 'GoogleAuthExpiredError';
    }
}
