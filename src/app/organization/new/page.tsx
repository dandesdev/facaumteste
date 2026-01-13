"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const createOrgMutation = api.organization.create.useMutation({
    onSuccess: async (data) => {
      // Setup the session for the new org
      try {
        await fetch("/api/set-active-space", {
            method: "POST",
            body: JSON.stringify({ kind: "organization", id: data.id }),
            headers: { "Content-Type": "application/json" },
          });
        
        router.push(`/dashboard`); 
        router.refresh();
      } catch (e) {
        console.error("Failed to set active space", e);
        // Fallback or show error
      }
    },
    onError: (error) => {
        if (error.message.includes("slug")) {
            setSlugError("Este identificador (slug) já está em uso.");
        }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSlugError("");
    
    // Auto-generate slug if empty
    const finalSlug = slug || generateSlug(name);
    
    if (finalSlug.length < 3) {
        setSlugError("O identificador deve ter pelo menos 3 caracteres.");
        return;
    }

    createOrgMutation.mutate({
      name,
      slug: finalSlug,
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    
    // Auto-update slug only if user hasn't manually edited it
    if (!slugManuallyEdited) {
      setSlug(generateSlug(newName));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="flex items-center gap-4">
            <Link href="/select-space" className="text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Nova Organização</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Organização</Label>
            <Input
              id="name"
              placeholder="Ex: Escola Futuro"
              value={name}
              onChange={handleNameChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Identificador (URL)</Label>
            <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                <span>facaumteste.com/</span>
                <input 
                    id="slug"
                    className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400 ml-1"
                    placeholder="escola-futuro"
                    value={slug}
                    onChange={handleSlugChange}
                    required
                    minLength={3}
                />
            </div>
            {slugError && <p className="text-xs text-red-500 font-medium">{slugError}</p>}
            <p className="text-xs text-muted-foreground">Este será o endereço único da sua organização.</p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={createOrgMutation.isPending}
          >
            {createOrgMutation.isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                </>
            ) : (
                "Criar Organização"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
