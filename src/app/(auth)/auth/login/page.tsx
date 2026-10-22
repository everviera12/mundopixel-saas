import { Suspense } from "react";

import { getSafeInternalPath } from "@/lib/redirects";
import { LoginForm } from "./login-form";

function getSingleValue(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
        return value[0] ?? "";
    }

    return value ?? "";
}

export default function LoginPage({ searchParams }: PageProps<"/auth/login">) {
    return (
        <Suspense fallback={<LoginForm email="" next="" />}>
            <LoginContent searchParams={searchParams} />
        </Suspense>
    );
}

async function LoginContent({
    searchParams,
}: Pick<PageProps<"/auth/login">, "searchParams">) {
    const params = await searchParams;
    const email = getSingleValue(params.email).trim();
    const next = getSafeInternalPath(getSingleValue(params.next), "");

    return <LoginForm email={email} next={next} />;
}
