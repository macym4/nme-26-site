import { userLogoutAction } from "@/app/actions";
export default function Denied() { return <main className="grid min-h-screen place-items-center"><section className="text-center"><h1 className="text-2xl font-bold">Access denied</h1><p>Your request was not approved.</p><form action={userLogoutAction}><button className="mt-4 underline">Log out</button></form></section></main>; }
