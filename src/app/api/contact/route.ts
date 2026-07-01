/**
 * Contact form handler — STUB.
 *
 * Right now this only validates the payload and returns success; it does NOT yet
 * deliver the message anywhere. Before launch, wire one of the options below so
 * enquiries actually reach you, then delete this notice:
 *
 *   • Resend / Postmark / SendGrid — send yourself an email (recommended).
 *     e.g. `await resend.emails.send({ from, to: site.email, subject, text })`
 *     Put the API key in an env var (RESEND_API_KEY) — never hard-code secrets.
 *   • A form service (Formspree, Basin) — POST the body to their endpoint.
 *   • A database / Slack webhook — whatever fits your workflow.
 *
 * Keep the validation + JSON contract ({ ok, error }) so the client stays unchanged.
 */

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  // basic, dependency-free validation
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return Response.json({ ok: false, error: "Add a valid email so I can reply." }, { status: 422 });
  }
  if (message.length < 2) {
    return Response.json({ ok: false, error: "Add a short note about the project." }, { status: 422 });
  }

  // TODO: deliver the enquiry (see the options in the file header above).
  // For now we just log it server-side so nothing is silently lost in dev.
  console.log("[contact] new enquiry", {
    name: typeof body.name === "string" ? body.name : "",
    email,
    project: typeof body.project === "string" ? body.project : "",
    message,
  });

  return Response.json({ ok: true });
}
