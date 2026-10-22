"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type InvitationLinkProps = {
    inviteUrl: string;
    inputId: string;
};

export function InvitationLink({ inviteUrl, inputId }: InvitationLinkProps) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    }

    return (
        <Field>
            <FieldLabel htmlFor={inputId}>Enlace de invitación</FieldLabel>

            <div className="flex items-center gap-2">
                <Input
                    id={inputId}
                    readOnly
                    value={inviteUrl}
                    className="font-mono text-xs"
                    onFocus={(event) => event.currentTarget.select()}
                />

                <Button
                    type="button"
                    variant="outline"
                    disabled={!inviteUrl}
                    onClick={handleCopy}
                >
                    <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
                    {copied ? "Copiado" : "Copiar"}
                </Button>
            </div>

            <FieldDescription>El enlace expira en 7 días.</FieldDescription>
        </Field>
    );
}
