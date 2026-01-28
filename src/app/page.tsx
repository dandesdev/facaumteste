import LoginButton from "~/components/LoginButton";
import { Button } from "~/components/ui/button";
import { createSupabaseServerClient } from "~/server/supabaseServer";
import { Info } from "lucide-react";

// import { LatestPost } from "~/app/_components/post";
import { HydrateClient } from "~/trpc/server";
import { LastLocationRestorer } from "~/components/LastLocationRestorer";
import { env } from "~/env";
import LogoutButton from "~/components/LogoutButton";

export default async function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" });

  // void api.post.getLatest.prefetch();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const environment = env.NODE_ENV;
  const authEnabled = environment !== "production";

  //if (error || !data?.user) redirect("/");

  return (
    <HydrateClient>
      <LastLocationRestorer fallback="/select-space" />
      <main className="flex min-h-screen flex-col items-center justify-center">

        <menu className="flex flex-1 flex-col flex-nowrap justify-center gap-2">
          <span className="block">
            <LoginButton disabled={!authEnabled} />
          </span>
          <span className="relative flex justify-center"><div className="w-fit bg-background px-4 z-10"><p className="opacity-50">ou</p></div><div className="border-b-2 border-accent-foreground opacity-10 absolute w-full top-[50%]"></div></span>
          <span className="flex w-full">
            <Button className="flex-1 font-bold sm:min-w-[185] py-3 text-[1rem]" variant={"default"} size={null}>Crie</Button>
          </span>
        </menu>
        <span className="hidden w-full sm:flex">
          <span className="flex flex-1 px-4 py-2">
            <Info className="ml-auto" />
          </span>
        </span>
      </main>
    </HydrateClient>
  );
}
