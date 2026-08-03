import { userLogoutAction } from "@/app/actions";
export default function Suspended() { return <main className="grid min-h-screen place-items-center"><section className="text-center"><h1 className="text-2xl font-bold">Access suspended</h1><p>Please contact an administrator.</p><form action={userLogoutAction}><button className="mt-4 underline">Log out</button></form></section></main>; }
