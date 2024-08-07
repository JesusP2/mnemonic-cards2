import { generateState } from "arctic";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { createUserSession } from "../../data-access/sessions.js";
import { userModel } from "../../data-access/users.js";
import { db } from "../../db/pool.js";
import { oauthAccountTable } from "../../db/schema/index.js";
import { github } from "../../lucia.js";
import { createUlid } from "../../utils/ulid.js";
import { uploadFile } from "../../utils/r2.js";

export const githubLoginRouter = new Hono();

githubLoginRouter.get("/auth/github", async (c) => {
  const state = generateState();
  const url = await github.createAuthorizationURL(state);
  setCookie(c, "github_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "Lax",
  });
  return c.redirect(url.toString());
});

githubLoginRouter.get("/auth/github/callback", async (c) => {
  const code = c.req.query("code")?.toString() ?? null;
  const state = c.req.query("state")?.toString() ?? null;
  const storedState = getCookie(c).github_oauth_state ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    return c.redirect("/auth/signin");
  }
  try {
    const tokens = await github.validateAuthorizationCode(code);
    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const githubUser: GitHubUser = await githubUserResponse.json();
    const [existingUser] = await db
      .select()
      .from(oauthAccountTable)
      .where(
        and(
          eq(oauthAccountTable.providerId, "github"),
          eq(oauthAccountTable.providerUserId, githubUser.id),
        ),
      );
    if (existingUser) {
      await createUserSession(c, existingUser.userId);
      setCookie(c, "revalidate", "true", {
        path: "/",
        maxAge: 10,
      });
      return c.redirect("/me");
    }
    const userId = createUlid();
    let avatarKey = null;
    if (githubUser.avatar_url) {
      const pictureRes = await fetch(githubUser.avatar_url);
      const resType = pictureRes.headers.get("Content-Type");
      const allowedContentTypes = ["image/png", "image/jpeg", "image/webp"];
      if (resType && allowedContentTypes.includes(resType)) {
        const buf = Buffer.from(await pictureRes.arrayBuffer());
        const extension = resType.split("/")[1];
        avatarKey = `${createUlid()}.${extension}`;
        await uploadFile(buf, avatarKey);
      }
    }
    await db.transaction(async (tx) => {
      const oauthId = createUlid();
      await tx.insert(oauthAccountTable).values({
        id: oauthId,
        userId: userId,
        providerId: "github",
        providerUserId: githubUser.id,
      });
      await userModel.create(
        {
          id: userId,
          username: githubUser.login,
          email: null,
          password: null,
          avatar: avatarKey,
        },
        tx,
      );
    });
    await createUserSession(c, userId);
    setCookie(c, "revalidate", "true", {
      path: "/",
      maxAge: 10,
    });
    return c.redirect("/me");
  } catch (e) {
    return c.redirect("/auth/signin");
  }
});

interface GitHubUser {
  id: string;
  login: string;
  avatar_url: string;
  email: string | null;
}
