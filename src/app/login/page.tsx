import { LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { signIn } from "@/app/login/actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextUrl = params.next?.startsWith("/") ? params.next : "/admin";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-card/90 p-6 shadow-2xl shadow-black/30">
        <div className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">
            <ShieldCheck className="size-3" />
            Admin access
          </div>
          <h1 className="text-3xl font-black">Masuk Control Room</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Login pakai akun admin yang dibuat di Supabase Auth.
          </p>
        </div>

        {params.error ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {params.error}
          </div>
        ) : null}

        <form action={signIn} className="space-y-4">
          <input name="next" type="hidden" value={nextUrl} />
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="h-10 w-full rounded-md border border-white/10 bg-background/70 px-3 text-sm outline-none ring-primary/40 transition focus:ring-2"
              id="email"
              name="email"
              placeholder="admin@domain.com"
              required
              type="email"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="h-10 w-full rounded-md border border-white/10 bg-background/70 px-3 text-sm outline-none ring-primary/40 transition focus:ring-2"
              id="password"
              name="password"
              placeholder="password"
              required
              type="password"
            />
          </div>
          <Button className="w-full" size="lg" type="submit">
            <LockKeyhole />
            Login
          </Button>
        </form>

        <div className="mt-4">
          <Link className={buttonVariants({ variant: "ghost" })} href="/">
            Kembali ke public page
          </Link>
        </div>
      </section>
    </main>
  );
}
