import LoginButton from "~/components/LoginButton";
import { Button } from "~/components/ui/button";
import { createSupabaseServerClient } from "~/server/supabaseServer";
import { Info } from "lucide-react";

import { HydrateClient } from "~/trpc/server";
import { LastLocationRestorer } from "~/components/LastLocationRestorer";
import { env } from "~/env";
import LogoutButton from "~/components/LogoutButton";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const environment = env.NODE_ENV;
  const authEnabled = environment !== "production";

  return (
    <HydrateClient>
      <LastLocationRestorer fallback="/select-space" />
      <main className="flex min-h-screen flex-col items-center justify-center">
        <menu className="flex flex-1 flex-col flex-nowrap justify-center gap-2">
          <span className="block">
            <LoginButton disabled={!authEnabled} />
          </span>
          <span className="relative flex justify-center">
            <div className="bg-background z-10 w-fit px-4">
              <p className="opacity-50">ou</p>
            </div>
            <div className="border-accent-foreground absolute top-[50%] w-full border-b-2 opacity-10"></div>
          </span>
          <span className="flex w-full">
            <Button
              className="flex-1 py-3 text-[1rem] font-bold sm:min-w-[185]"
              variant={"default"}
              size={null}
            >
              Crie
            </Button>
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
