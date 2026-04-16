"use server";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { plans } from "@/lib/subscription";

export async function subscriptionSession({ planId }: { planId: string }) {
  try {
    const plan = plans.find((plan) => plan.id === planId);

    if (!plan) {
      throw new Error("Subscription plan not found.");
    }

    const user = await db.user.findUnique({
      where: { id: "user1" },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/my-plan?planId=${plan.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscriptions`,
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: plan.id,
        },
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
            },
            unit_amount: plan.price * 100,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
    });

    if (!stripeSession.url) throw new Error("Stripe session URL not found");
    return { url: stripeSession.url };
  } catch (error) {
    console.error("[subscriptionSession]" + error);
    return {
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}
