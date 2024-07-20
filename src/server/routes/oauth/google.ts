import { generateState } from 'arctic';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { createUserSession } from '../../data-access/sessions.js';
import { userModel } from '../../data-access/users.js';
import { db } from '../../db/pool.js';
import { oauthAccountTable } from '../../db/schema/index.js';
import { createUlid, google } from '../../lucia';
import { uploadFile } from '../../utils/r2.js';

export const googleLoginRouter = new Hono();

googleLoginRouter.get('/auth/google', async (c) => {
  const state = generateState();
  const url = await google.createAuthorizationURL(state, state, {
    scopes: ['profile', 'email', 'openid'],
  });
  setCookie(c, 'google_oauth_state', state, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'Lax',
  });
  return c.redirect(url.toString());
});

googleLoginRouter.get('/auth/google/callback', async (c) => {
  const code = c.req.query('code')?.toString() ?? null;
  const state = c.req.query('state')?.toString() ?? null;
  const storedState = getCookie(c).google_oauth_state ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    return c.redirect('/auth/signin');
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, state);
    const googleUserResponse = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      },
    );
    const googleUser: GoogleUser = await googleUserResponse.json();
    const [existingUser] = await db
      .select()
      .from(oauthAccountTable)
      .where(
        and(
          eq(oauthAccountTable.providerId, 'google'),
          eq(oauthAccountTable.providerUserId, googleUser.sub),
        ),
      );
    if (existingUser) {
      await createUserSession(c, existingUser.userId);
      return c.redirect('/');
    }
    let avatarKey = null;
    if (googleUser.picture) {
      const pictureRes = await fetch(googleUser.picture);
      const resType = pictureRes.headers.get('Content-Type');
      const allowedContentTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (resType && allowedContentTypes.includes(resType)) {
        const buf = Buffer.from(await pictureRes.arrayBuffer());
        const extension = resType.split('/')[1];
        avatarKey = `${createUlid()}.${extension}`;
        await uploadFile(buf, avatarKey);
      }
    }
    const userId = createUlid();
    await db.transaction(async (tx) => {
      const oauthId = createUlid();
      await tx.insert(oauthAccountTable).values({
        id: oauthId,
        userId: userId,
        providerId: 'google',
        providerUserId: googleUser.sub,
      });
      await userModel.create(
        {
          id: userId,
          username: googleUser.name,
          email: null,
          password: null,
          avatar: avatarKey,
        },
        tx,
      );
    });
    await createUserSession(c, userId);
    return c.redirect('/');
  } catch (err) {
    console.log(err);
    return c.redirect('/auth/signin');
  }
});

interface GoogleUser {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}
