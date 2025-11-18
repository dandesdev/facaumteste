import { redirect } from "next/navigation";
import LogoutButton from "~/components/LogoutButton";
import { createSupabaseServerClient } from "~/server/supabaseServer";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  console.log("DashboardPage - user data:", data, "error:", error); //test

  //if (error || !data?.user) redirect("/"); //test

  return (
    <>
      <nav>Hello</nav>
      <main>World</main>
      <footer>Camon</footer>
      <LogoutButton />
    </>
  );
}