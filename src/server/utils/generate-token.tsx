import { parseWithZod } from "@conform-to/zod";
import type { Context } from "hono";
import { resetTokenSchema } from "../../lib/schemas";
import { userModel } from "../data-access/users";
import { generateIdFromEntropySize } from "lucia";
import { encodeHex } from "oslo/encoding";
import { sha256 } from "oslo/crypto";
import { createUlid } from "../lucia";
import { createDate, TimeSpan } from "oslo";
import { sendEmail } from "./email";
import type { ResetPasswordEmail } from "../emails/reset-password";
import type * as schema from '../db/schema'
import type { ResetTokenModel } from "../data-access/reset-token";

export function generateTokenEndpoint(
  Template: typeof ResetPasswordEmail,
  subject: string,
  model: ResetTokenModel<typeof schema>
) {
  return async (c: Context) => {
    const loggedInUser = c.get('user');
    if (loggedInUser) {
      return c.json(null, 403);
    }
    const submission = parseWithZod(await c.req.formData(), {
      schema: resetTokenSchema,
    });
    if (submission.status !== 'success') {
      return c.json(submission.reply(), 400);
    }
    try {
      const user = await userModel.findByEmail(submission.value.email);
      if (!user) {
        return c.json(null, 200);
      }

      await model.deleteByUserId(user.id);
      const tokenId = generateIdFromEntropySize(25); // 40 character
      const tokenHash = encodeHex(
        await sha256(new TextEncoder().encode(tokenId)),
      );

      await model.create({
        id: createUlid(),
        token: tokenHash,
        userId: user.id,
        expiresAt: createDate(new TimeSpan(2, 'h')).toISOString(),
      });
      const origin = c.req.header('origin') as string;
      await sendEmail(
        submission.value.email,
        subject,
        <Template origin={origin} tokenId={tokenId} />,
      );
      return c.json(null, 200);
    } catch (err) {
      return c.json(
        submission.reply({
          fieldErrors: {
            email: ['Something went wrong, please try again'],
          },
        }),
      );
    }
  };
}
