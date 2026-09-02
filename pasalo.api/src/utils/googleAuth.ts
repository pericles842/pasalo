import { OAuth2Client } from 'google-auth-library';

export interface GoogleProfile {
    email: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
    /** Id estable de la cuenta de Google (claim "sub" del id_token) */
    google_id: string;
}

let client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
    if (client) return client;

    const client_id = process.env.GOOGLE_CLIENT_ID;
    if (!client_id) throw new Error('GOOGLE_CLIENT_ID no esta configurado en el .env');

    client = new OAuth2Client(client_id);
    return client;
}

/**
 * Verifica el id_token que manda el frontend (Google Identity Services) y
 * devuelve los datos ya confirmados por Google. Lanza si el token es
 * invalido, expirado, o no fue emitido para nuestro GOOGLE_CLIENT_ID.
 */
export async function verifyGoogleToken(id_token: string): Promise<GoogleProfile> {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    if (!client_id) throw new Error('GOOGLE_CLIENT_ID no esta configurado en el .env');

    const ticket = await getClient().verifyIdToken({ idToken: id_token, audience: client_id });
    const payload = ticket.getPayload();

    if (!payload?.email) throw new Error('El token de Google no trae un correo verificado.');

    return {
        email: payload.email,
        first_name: payload.given_name ?? '',
        last_name: payload.family_name ?? '',
        photo_url: payload.picture ?? null,
        google_id: payload.sub
    };
}
