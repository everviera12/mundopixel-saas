'use server'

import { redirect } from "next/navigation";
import { createServer } from "../supabase/server";

type AuthStateProps = {
    error: string | null;
    success: string | null;
};

export async function signInWithEmail(_prevState: AuthStateProps, formData: FormData,): Promise<AuthStateProps> {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
        return {
            error: "El correo o la contraseña son incorrectos.", success: null
        };
    }

    const supabase = await createServer()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return {
            error: error.message,
            success: null
        };
    }

    // return {
    //     error: null,
    //     success: "Logged in successfully!",
    // };

    redirect('/')
}

export async function signUpNewUser(_prevState: AuthStateProps, formData: FormData,): Promise<AuthStateProps> {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
        return { error: "Email and password are required.", success: null };
    }

    const supabase = await createServer()

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: '/confirmed'
        }
    });

    if (error) {
        return {
            error: error.message,
            success: null
        };
    }

    return {
        error: null,
        success: "Check your email to confirm your account.",
    };
}

export async function signOut() {
    const supabase = await createServer()
    const { error } = await supabase.auth.signOut();

    if (error) {
        return {
            error: error.message,
            success: null
        };
    }

    // return {
    //     error: null,
    //     success: "Signed out successfully.",
    // };

    redirect('/auth/login')
}