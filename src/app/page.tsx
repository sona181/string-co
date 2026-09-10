import { auth } from "@/lib/auth";
import HomeClient from "@/components/HomeClient";

export default async function HomePage() {
  const session = await auth();
  return <HomeClient isLoggedIn={!!session?.user} />;
}
