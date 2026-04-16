import Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature");

    if (!signature) {
      return NextResponse.json("Invalid signature", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    if (event.type === "checkout.session.completed") {
      if (!event.data.object.customer_details?.email) {
        throw new Error("Missing user email");
      }
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;

      const subscriptionId = session.subscription as string;

      if (!userId || !planId || !subscriptionId) {
        throw new Error("Invalid request metadata");
      }

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );

      await db.subscription.create({
        data: {
          planId,
          userId: userId,
          stripePriceId: subscription.items.data[0].price.id,
          currentPeriodStart: new Date(subscription.start_date * 1000),
          currentPeriodEnd: new Date(subscription.ended_at! * 1000),
        },
      });
    }
    return NextResponse.json({ result: event });
  } catch (err) {
    console.error("Stripe Webhook" + err);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
