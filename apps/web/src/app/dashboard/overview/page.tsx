import { getAiProviderConfiguration, getEnv } from "@autodrop/config";
import { prisma } from "@autodrop/db";
import type { DashboardMetricCard } from "@autodrop/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

async function getOverviewMetrics(userId: string): Promise<{ cards: DashboardMetricCard[]; storeName: string | null; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stores: {
          include: {
            _count: {
              select: {
                customers: true,
                orders: true,
                products: true
              }
            }
          }
        }
      }
    });

    const store = user?.stores[0];
    if (!store) {
      return {
        storeName: null,
        cards: [
          { label: "Products", value: "0", helperText: "Create your first product catalog." },
          { label: "Orders", value: "0", helperText: "Orders will appear here once connected." },
          { label: "Customers", value: "0", helperText: "Customer insights start after your first sale." },
          { label: "AI Providers", value: "0", helperText: "AI is optional and can be added later." }
        ]
      };
    }

    const revenue = await prisma.order.aggregate({
      where: { storeId: store.id },
      _sum: { totalAmount: true }
    });

    const configuredAi = await prisma.aiProvider.count({
      where: { storeId: store.id, status: "ACTIVE" }
    });

    return {
      storeName: store.name,
      cards: [
        { label: "Products", value: String(store._count.products), helperText: "Catalog items ready for listing." },
        { label: "Orders", value: String(store._count.orders), helperText: "Tracked customer orders." },
        { label: "Customers", value: String(store._count.customers), helperText: "Customers with purchase history." },
        { label: "Revenue", value: `$${revenue._sum.totalAmount?.toString() ?? "0.00"}`, helperText: "Lifetime order total." },
        { label: "AI Providers", value: String(configuredAi), helperText: "Enabled AI integrations for this store." }
      ]
    };
  } catch (error) {
    return {
      storeName: null,
      error: error instanceof Error ? error.message : "Unable to load metrics.",
      cards: [
        { label: "Products", value: "-", helperText: "Database unavailable." },
        { label: "Orders", value: "-", helperText: "Database unavailable." },
        { label: "Customers", value: "-", helperText: "Database unavailable." },
        { label: "Revenue", value: "-", helperText: "Database unavailable." }
      ]
    };
  }
}

export default async function OverviewPage() {
  const session = await auth();
  const env = getEnv();
  const aiProviders = getAiProviderConfiguration(env);
  const metrics = await getOverviewMetrics(session?.user.id ?? "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {metrics.storeName ? `Store snapshot for ${metrics.storeName}.` : "Connect your stack and start operating from one place."}
        </p>
      </div>

      {metrics.error ? <p className="text-sm text-amber-600 dark:text-amber-400">{metrics.error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl">{card.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-500 dark:text-zinc-400">{card.helperText}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Supported AI providers</CardTitle>
            <CardDescription>Phase 1 keeps the seams clean without requiring any API keys.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {aiProviders.map((provider) => (
              <Badge key={provider.name}>{provider.name}: {provider.configured ? "configured" : "optional"}</Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Storage mode</CardTitle>
            <CardDescription>Use local disk for zero-cost setups or MinIO for S3-compatible object storage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <p>Provider: <span className="font-medium text-zinc-900 dark:text-zinc-100">{env.STORAGE_PROVIDER}</span></p>
            <p>OAuth: {env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? "Google enabled" : "Credentials-only mode"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
