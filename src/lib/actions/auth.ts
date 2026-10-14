'use server'

import type { User } from "@supabase/supabase-js";

import { redirect } from "next/navigation";
import { createServer } from "../supabase/server";

type AuthStateProps = {
    error: string | null;
    success: string | null;
};

type UserProps = AuthStateProps & {
    data: User | null;
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
    const first_name = String(formData.get("first_name") ?? "");
    const last_name = String(formData.get("last_name") ?? "");

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = formData.get("confirm_password");

    if (password !== confirmPassword) {
        return {
            error: "Las contraseñas no coinciden.",
            success: null,
        };
    }

    if (password.length < 8) {
        return {
            error: "La contraseña debe tener al menos 8 caracteres.",
            success: null,
        };
    }

    if (!email || !password) {
        return { error: "Email and password are required.", success: null };
    }

    const supabase = await createServer()

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: first_name,
                last_name: last_name,
            },
            emailRedirectTo: '/confirmed' // -> Cambiar a URL valida con SSL
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
        success: "Revisa tu correo electrónico para confirmar tu cuenta.",
    };
}

export async function signOut(): Promise<void> {
    const supabase = await createServer()
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new Error(error.message);
    }

    // return {
    //     error: null,
    //     success: "Signed out successfully.",
    // };

    redirect('/auth/login')
}

export async function getUserInfo(): Promise<UserProps> {
    const supabase = await createServer()

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return {
            error: error?.message ?? "No se encontró un usuario autenticado.",
            success: null,
            data: null,
        };
    }

    return {
        error: null,
        success: "Usuario obtenido correctamente.",
        data: user
    };
}

export async function forgotPassword(_prevState: AuthStateProps, formData: FormData,): Promise<AuthStateProps> {
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
        return {
            error: "El campo de correo electrónico es obligatorio.", success: null
        };
    }

    const supabase = await createServer();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!siteUrl) {
        return {
            error: "No se ha configurado la URL de la aplicación.",
            success: null,
        };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/account/update-password`,
    });



    if (error) {
        console.log("Error al enviar recuperación", error);

        return {
            error: error.message,
            success: null,
        };
    }

    return {
        error: null,
        success: "Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.",
    };
}

export async function updatePassword(_prevState: AuthStateProps, formData: FormData,): Promise<AuthStateProps> {
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (!password || !confirmPassword) {
        return { error: "Por favor, ingresa ambas contraseñas", success: null };
    }

    if (password !== confirmPassword) {
        return {
            error: "Las contraseñas no coinciden",
            success: null,
        };
    }

    if (password.length < 8) {
        return {
            error: "La contraseña debe tener al menos 8 caracteres",
            success: null,
        };
    }

    const supabase = await createServer();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        return { error: error.message, success: null };
    }

    return {
        error: null,
        success: "Tu contraseña se actualizó correctamente",
    };
}