import { Button } from "@/components/ui/button";
import { getUserInfo, signOut } from "@/lib/actions/auth";
import { connection } from "next/server";
import { Suspense } from "react";

async function UserInfo() {
    await connection();

    const response = await getUserInfo()
    const user = response.data?.user_metadata
    const { first_name, last_name, email, email_verified } = user ?? {};

    return (
        <div>
            <h1 className="text-blue-700 text-4xl font-bold">Hello {first_name} {last_name}</h1>
        </div>
    )
}

export default function HomePage() {

    return (
        <div>
            <Suspense fallback={<p>Loading user...</p>}>
                <UserInfo />
            </Suspense>

            <form action={signOut}>
                <Button variant={'destructive'}>Sign Out</Button>
            </form>
        </div>
    );
}