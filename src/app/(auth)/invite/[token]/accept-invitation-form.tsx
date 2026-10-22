"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/lib/actions/invitations";

type AcceptInvitationFormProps = {
    token: string;
    roleLabel: string;
};

export function AcceptInvitationForm({ token, roleLabel }: AcceptInvitationFormProps) {
    const [state, formAction, isPending] = useActionState(acceptInvitation, {
        error: null,
        success: null,
    });

    return (
        <form action={formAction} className="grid gap-4">
            <input type="hidden" name="token" value={token} />

            <Button disabled={isPending} type="submit">
                {isPending && (
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                )}
                {isPending ? "Aceptando..." : "Aceptar invitación"}
            </Button>

            {state.error && (
                <Alert className="border-none p-0">
                    <AlertDescription className="font-medium text-red-600">
                        {state.error}
                    </AlertDescription>
                </Alert>
            )}

            <p className="text-center text-xs text-muted-foreground">
                Al aceptar, te unirás a la organización con el rol {roleLabel}.
            </p>
        </form>
    );
}
