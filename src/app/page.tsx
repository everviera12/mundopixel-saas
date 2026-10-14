import { Button } from "@/components/ui/button";
import { getUserInfo, signOut } from "@/lib/actions/auth";

export default async function HomePage() {
    const response = await getUserInfo()
    const user = response.data?.user_metadata
    console.log(user);

    return (
        <div>
            <form action={signOut}>
                <Button type="submit" variant={'destructive'}>Sign Out</Button>
            </form>
        </div>
    );
}