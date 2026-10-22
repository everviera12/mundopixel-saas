import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type OrganizationBannerProps = {
    name: string;
    slug?: string;
    roleLabel?: string;
};

export function OrganizationBanner({ name, slug, roleLabel }: OrganizationBannerProps) {
    return (
        <Card className="border border-border bg-muted/50 ring-0">
            <CardContent className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-6 text-muted-foreground" />
                </div>

                <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-medium">{name}</span>
                        {roleLabel ? <Badge variant="outline">{roleLabel}</Badge> : null}
                    </div>
                    {slug ? <span className="text-sm text-muted-foreground">{slug}</span> : null}
                </div>
            </CardContent>
        </Card>
    );
}
