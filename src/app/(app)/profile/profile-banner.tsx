"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, Edit01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

type ProfileBannerProps = {
    initials: string;
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    emailVerified: boolean;
};

export function ProfileBanner({ initials, firstName, lastName, displayName, email, emailVerified }: ProfileBannerProps) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <Card className="border border-border bg-muted/50 ring-0">
                <CardContent>
                    <ProfileForm
                        defaultFirstName={firstName}
                        defaultLastName={lastName}
                        onCancel={() => setIsEditing(false)}
                        onSuccess={() => setIsEditing(false)}
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-border bg-muted/50 ring-0">
            <CardContent className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-medium text-muted-foreground">
                    {initials}
                </div>

                <div className="grid gap-1">
                    <span className="text-base font-medium">{displayName}</span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {email}
                        {emailVerified ? (
                            <HugeiconsIcon
                                icon={CheckmarkBadge01Icon}
                                strokeWidth={2}
                                className="size-4 text-green-600"
                            />
                        ) : null}
                    </span>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto self-start"
                    aria-label="Editar perfil"
                    onClick={() => setIsEditing(true)}
                >
                    <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />
                </Button>
            </CardContent>
        </Card>
    );
}
