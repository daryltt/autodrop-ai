import { getAiProviderConfiguration, getEnv } from "@autodrop/config";
import { prisma } from "@autodrop/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await auth();
  const env = getEnv();
  const providers = getAiProviderConfiguration(env);
  const storeCount = session?.user.id
    ? await prisma.store.count({ where: { ownerId: session.user.id } }).catch(() => 0)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Profile, access level, storage, and optional integrations.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Current operator identity and tenant access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><span className="font-medium">Email:</span> {session?.user.email}</p>
              <p><span className="font-medium">Name:</span> {session?.user.name ?? "Not set"}</p>
              <p><span className="font-medium">Role:</span> <Badge>{session?.user.role ?? "VIEWER"}</Badge></p>
              <p><span className="font-medium">Owned stores:</span> {storeCount}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security posture</CardTitle>
              <CardDescription>Phase 1 defaults are safe for local development but should be rotated for production.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">JWT sessions</p>
                  <p>Auth.js uses stateless JWT sessions in Phase 1.</p>
                </div>
                <Switch checked disabled aria-label="JWT sessions enabled" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">AES-256-GCM encryption</p>
                  <p>Secret storage encryption is enabled when `ENCRYPTION_KEY` is set.</p>
                </div>
                <Switch checked={Boolean(env.ENCRYPTION_KEY)} disabled aria-label="Encryption enabled" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>AI remains optional, and storage stays self-hostable.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-500 dark:text-zinc-400">
              <p>Storage provider: <span className="font-medium text-zinc-900 dark:text-zinc-100">{env.STORAGE_PROVIDER}</span></p>
              <div className="flex flex-wrap gap-2">
                {providers.map((provider) => (
                  <Badge key={provider.name}>{provider.name}: {provider.configured ? "configured" : "not configured"}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
