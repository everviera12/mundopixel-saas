import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    redirects() {
        return [
            {
                source: '/auth',
                destination: '/auth/login',
                permanent: true,
            },
        ]
    },
    cacheComponents: true,
    partialPrefetching: true,
    reactCompiler: true,
    turbopack: {
        rules: {
            "*.css": {
                loaders: ["@tailwindcss/turbopack"],
                as: "*.css",
            },
        },
    },
};

export default nextConfig;
