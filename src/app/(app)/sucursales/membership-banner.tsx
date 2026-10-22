import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon, LockKeyIcon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type MembershipBannerProps = {
    organizationName: string;
    roleLabel: string;
};

export function MembershipBanner({ organizationName, roleLabel }: MembershipBannerProps) {
    return (
        <Card className="max-w-xl border border-border bg-muted/50 ring-0">
            <CardContent className="grid gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted">
                            <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-6 text-muted-foreground" />
                        </div>

                        <div className="grid gap-0.5">
                            <span className="text-sm text-muted-foreground">Miembro de</span>
                            <span className="font-heading text-lg font-semibold tracking-tight">{organizationName}</span>
                        </div>
                    </div>

                    <div className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 sm:w-auto sm:min-w-32">
                        <span className="text-xs text-muted-foreground">Tu cargo</span>
                        <p className="text-sm font-medium">{roleLabel}</p>
                    </div>
                </div>

                <Separator />

                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <HugeiconsIcon icon={LockKeyIcon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
                    <span>No puedes agregar sucursales porque no eres dueño de la organización.</span>
                </div>
            </CardContent>
        </Card>
    );
}
