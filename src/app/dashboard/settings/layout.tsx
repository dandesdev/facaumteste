"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { useSpace } from "~/contexts/SpaceContext";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  const { activeSpace } = useSpace();

  const sidebarNavItems = [
    {
      title: "Geral",
      href: "/dashboard/settings",
    },
    ...(activeSpace.kind === "organization"
      ? [
          {
            title: "Organização",
            href: "/dashboard/settings/organization",
          },
          {
            title: "Turmas / Grupos",
            href: "/dashboard/settings/groups",
          },
        ]
      : []),
     ...(activeSpace.kind === "group"
      ? [
          {
            title: "Turma",
            href: `/dashboard/settings/groups/${activeSpace.id}`,
          },
      ]
      : []),
     ...(activeSpace.kind === "user"
      ? [
          {
            title: "Perfil",
            href: "/dashboard/settings/personal",
          },
      ]
      : []),
    {
      title: "Aparência",
      href: "/dashboard/settings/appearance",
    },
  ];

  return (
    <div className="space-y-6 p-10 pb-16 md:block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações do seu espaço, aparência e notificações.
        </p>
      </div>
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <nav
            className={cn(
              "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
            )}
          >
            {sidebarNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  pathname === item.href
                    ? "bg-muted hover:bg-muted"
                    : "hover:bg-transparent hover:underline",
                  "justify-start"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
