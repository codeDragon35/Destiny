import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/client";
import { users, accounts, sessions, verificationTokens } from "@/db/auth-schema";

const smtpConfigured = Boolean(process.env.EMAIL_SERVER_HOST);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  pages: { signIn: "/signin", verifyRequest: "/signin/sent" },
  providers: [
    Nodemailer({
      from: process.env.EMAIL_FROM ?? "Destiny <noreply@destiny.local>",
      server: smtpConfigured
        ? {
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
          }
        : { host: "localhost", port: 1025 },
      // Without SMTP configured, print the link so local sign-in still works.
      async sendVerificationRequest({ identifier, url, provider, theme }) {
        if (!smtpConfigured) {
          console.log(`\n[auth] Sign-in link for ${identifier}:\n${url}\n`);
          return;
        }
        const { createTransport } = await import("nodemailer");
        const transport = createTransport(provider.server);
        await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: "Sign in to Destiny",
          text: `Sign in to Destiny:\n${url}\n`,
          html: `<body style="background:#101827;color:#F7F4EA;font-family:system-ui,sans-serif;padding:40px">
            <h1 style="color:#2FBF9F;font-size:20px">Sign in to Destiny</h1>
            <p><a href="${url}" style="display:inline-block;background:#2FBF9F;color:#101827;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600">Sign in</a></p>
            <p style="color:#AAB4C3;font-size:13px">If you didn't request this, ignore this email.</p>
          </body>`,
        });
        void theme;
      },
    }),
  ],
});
