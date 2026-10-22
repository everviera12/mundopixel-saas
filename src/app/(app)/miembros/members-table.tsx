"use client";

import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { MemberRowMenu } from "./member-row-menu";

type MemberItem = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    roleId: string | null;
    roleName: string | null;
    roleLabel: string;
};

type RoleOption = {
    id: string;
    label: string;
};

type BranchOption = {
    id: string;
    name: string;
};

type MembersTableProps = {
    members: MemberItem[];
    roles: RoleOption[];
    branches: BranchOption[];
    currentMemberId: string;
    canManage: boolean;
};

function getDisplayName(member: MemberItem) {
    const name = [member.firstName, member.lastName].filter(Boolean).join(" ").trim();

    return name || "Sin nombre";
}

export function MembersTable({ members, roles, branches, currentMemberId, canManage }: MembersTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    {canManage && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
            </TableHeader>

            <TableBody>
                {members.length > 0 ? (
                    members.map((member) => {
                        const displayName = getDisplayName(member);
                        const isOwner = member.roleName === "owner";
                        const isSelf = member.id === currentMemberId;

                        return (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">
                                    {displayName}
                                    {isSelf && (
                                        <span className="ml-2 text-xs font-normal text-muted-foreground">(tú)</span>
                                    )}
                                </TableCell>

                                <TableCell>
                                    <Badge variant={isOwner ? "default" : "outline"}>{member.roleLabel}</Badge>
                                </TableCell>

                                {canManage && (
                                    <TableCell className="text-right">
                                        {!isOwner && (
                                            <MemberRowMenu
                                                memberId={member.id}
                                                memberName={displayName}
                                                roleId={member.roleId}
                                                roles={roles}
                                                branches={branches}
                                                isSelf={isSelf}
                                            />
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })
                ) : (
                    <TableRow>
                        <TableCell
                            colSpan={canManage ? 3 : 2}
                            className="h-24 text-center text-muted-foreground"
                        >
                            Todavía no hay miembros en tu organización.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
