import type { ReactNode } from "@tanstack/react-router";
import { renderToString } from 'react-dom/server';
import { envs } from "../server-envs";

export async function sendEmail(
  email: string,
  subject: string,
  html: ReactNode,
) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${envs.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: envs.EMAIL_FROM,
      to: [email],
      subject: subject,
      html: renderToString(html),
    }),
  });

  console.log(res.ok)
  console.log(res.statusText)
  console.log(await res.json())
  if (res.ok) {
    const data = await res.json();
    return Response.json(data);
  }
}
