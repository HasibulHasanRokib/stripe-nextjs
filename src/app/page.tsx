import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Page() {
  return (
    <div className="min-h-screen flex flex-col gap-8 justify-center items-center">
      <h1 className="font-bold text-6xl leading-relaxed">
        Stripe payment gateway
      </h1>
      <Button size={"lg"} className="py-6 px-8">
        <Link href={"/subscriptions"}>Upgrade plan</Link>
      </Button>
    </div>
  );
}
