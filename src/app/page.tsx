import { signOut } from "@/lib/actions/auth";

export default function HomePage() {

    return (
        <div>
            <button onClick={signOut} className="px-7 py-2 text-white bg-red-700 rounded">Sign Out</button>
            
            <h1 className="text-3xl text-blue-600 font-bold">Welcome to the Home Page</h1>
        </div>
    );
}