
"use client";

import { useActionState } from "react";
import { signUpNewUser } from "@/lib/actions/auth";
import Link from "next/link";

export default function SignUpPage() {
    const [state, formAction, isPending] = useActionState(
        signUpNewUser,
        { error: null, success: null, }
    );

    return (
        <main className="grid gap-4">
            <h1 className="text-4xl font-bold text-blue-600">Sign Up</h1>

            <form action={formAction} className="grid max-w-sm gap-4">
                <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    required
                />

                <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    required
                />

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
                    {isPending ? "Creating account..." : "Sign Up"}
                </button>

                {state.error && <p className="text-red-600">{state.error}</p>}
                {state.success && <p className="text-green-600">{state.success}</p>}
            </form>

            <Link href={'/auth/login'}>Login</Link>
        </main>
    );
}