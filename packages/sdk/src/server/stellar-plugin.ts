import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint, getSessionFromCtx } from "better-auth/api";
import { z } from "zod";

export const boundlessStellarPlugin = () => {
  return {
    id: "boundless-stellar",

    schema: {
      user: {
        fields: {
          stellarAddress: { type: "string", required: false, input: false },
          credentialId: { type: "string", required: false, input: false }, // From WebAuthn
        },
      },
    },
    endpoints: {
      linkStellarAccount: createAuthEndpoint(
        "/stellar/link",
        {
          method: "POST",
          body: z.object({
            stellarAddress: z
              .string()
              .min(56)
              .max(56)
              .regex(/^C[A-Z0-9]{55}$/, "Invalid Stellar address format"),
            credentialId: z.string().min(1, "Credential ID is required"),
          }),
        },
        async (ctx) => {
          const session = await getSessionFromCtx(ctx);
          console.log(session);
          if (!session) {
            return ctx.json(
              { success: false, error: "Unauthorized" },
              { status: 401 },
            );
          }

          const { stellarAddress, credentialId } = ctx.body;

          await ctx.context.adapter.update({
            model: "user",
            where: [{ field: "id", value: session.user.id }],
            update: {
              stellarAddress,
              credentialId,
            },
          });
          return ctx.json({ success: true });
        },
      ),
    },
  } satisfies BetterAuthPlugin;
};
