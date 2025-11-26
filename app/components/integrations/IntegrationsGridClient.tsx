// app/components/integrations/IntegrationsGridClient.tsx
import IntegrationPlatformCard, {
  type Provider,
} from "@/app/components/integrations/IntegrationPlatformCard";

export default function IntegrationsGridClient({
  providers,
}: {
  providers: Provider[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {providers.map((p) => (
        <IntegrationPlatformCard key={p.key} provider={p} />
      ))}
    </div>
  );
}
