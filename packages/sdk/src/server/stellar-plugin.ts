import type { BetterAuthPlugin } from "better-auth";

export const boundlessStellarPlugin = (): BetterAuthPlugin =>
  ({
    id: "boundless-stellar",

    schema: {
      user: {
        fields: {
          stellarAddress: {
            type: "string",
            required: false,
            unique: true,
          },
          credentialId: {
            type: "string",
            required: false,
          },
        },
      },
    },

    endpoints: {
      linkStellar: {
        path: "/stellar/link",
        method: ["POST"],
        handler: async (ctx: any) => {
          // ctx is the Better-Auth handler context.
          // ctx.request.body contains the parsed JSON.
          // ctx.context.db  is the database adapter.
          // ctx.context.session.user is the authenticated user (or null).

          const session = await ctx.context.auth.getSession(ctx.request);
          if (!session?.user) {
            return ctx.json({ error: "Unauthorized" }, { status: 401 });
          }

          const body = ctx.request.body as { stellarAddress?: unknown };
          const { stellarAddress } = body;

          // Validate C-address format
          if (
            typeof stellarAddress !== "string" ||
            stellarAddress.length !== 56 ||
            !stellarAddress.startsWith("C")
          ) {
            return ctx.json(
              {
                error:
                  "Invalid stellarAddress. Must be a 56-char Soroban contract ID starting with C.",
              },
              { status: 400 },
            );
          }

          // Persist
          await ctx.context.db.update("user", {
            where: { id: session.user.id },
            update: { stellarAddress },
          });

          return ctx.json({ success: true });
        },
      },
    },
  }) as any;
