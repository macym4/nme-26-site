import { NmePage, CopyCard } from "@/components/nme/page";
import { requireUserAdmin } from "@/lib/auth";
export default async function PairingHistory() { await requireUserAdmin(); return <NmePage title="Pairing History"><CopyCard title="Pairing history"><p>This page is intentionally blank to start.</p></CopyCard></NmePage>; }
