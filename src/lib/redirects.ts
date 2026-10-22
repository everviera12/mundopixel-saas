/**
 * Solo permite rutas internas. Evita que un `next` manipulado abra un dominio
 * externo (por ejemplo `//sitio-malicioso.com`) al redirigir después del login.
 */
export function getSafeInternalPath(value: string | null | undefined, fallback: string) {
    const path = (value ?? "").trim();

    if (
        !path.startsWith("/") ||
        path.startsWith("//") ||
        path.includes("\\") ||
        /[\u0000-\u001f\u007f]/.test(path)
    ) {
        return fallback;
    }

    return path;
}
