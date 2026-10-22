import { Suspense } from "react";

import { getSafeInternalPath } from "@/lib/redirects";
import { SignUpForm } from "./sign-up-form";

function getSingleValue(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
        return value[0] ?? "";
    }

    return value ?? "";
}

export default function SignUpPage({ searchParams }: PageProps<"/auth/sign-up">) {
    return (
        <Suspense fallback={<SignUpForm email="" next="" />}>
            <SignUpContent searchParams={searchParams} />
        </Suspense>
    );
}

async function SignUpContent({
    searchParams,
}: Pick<PageProps<"/auth/sign-up">, "searchParams">) {
    const params = await searchParams;
    const email = getSingleValue(params.email).trim();
    const next = getSafeInternalPath(getSingleValue(params.next), "");

    return <SignUpForm email={email} next={next} />;
}
