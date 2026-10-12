'use client'

import { signInWithEmail } from "@/lib/actions/auth";
import Link from "next/link";
import { useActionState } from "react";

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(
        signInWithEmail,
        { error: null, success: null, }
    );

    return (
        <div>
            <h1 className="text-4xl font-semibold text-blue-500">Login Page</h1>

            <form action={formAction} className="grid max-w-sm gap-4">
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    autoComplete="email"
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                />

                <button type="submit" disabled={isPending}>
                    {isPending ? "Creating account..." : "Login"}
                </button>

                {state.error && <p className="text-red-600">{state.error}</p>}
                {state.success && <p className="text-green-600">{state.success}</p>}
            </form>

            <Link href={'/auth/sign-up'}>Sign Up </Link>
        </div>
    );
}