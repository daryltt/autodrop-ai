import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Phase 2 planned</CardTitle>
          <CardDescription>This workspace is reserved for the next milestone.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-zinc-500 dark:text-zinc-400">
          We intentionally ship the route now so navigation, authorization, and layout are in place from day one.
        </CardContent>
      </Card>
    </div>
  );
}
