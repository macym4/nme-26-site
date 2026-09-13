import Image from "next/image";

import positionChart from "../../../Screenshot 2026-07-31 203510.png";
import sophieImage from "../../../Screenshot 2026-07-31 204910.png";
import macyImage from "../../../Screenshot 2026-07-31 204918.png";
import { CopyCard, NmePage } from "@/components/nme/page";

export default function ChapterInformation() {
  return <NmePage title="Chapter Information"><div className="grid gap-6 md:grid-cols-2"><CopyCard title="Macy Lehrer"><Image src={macyImage} alt="Macy Lehrer" className="mb-5 aspect-[4/3] w-full rounded-xl object-cover" /><p><i>VP of New Member Education & Member Experience (VP NMEME)</i><br /><i>→ Runs new member & general member programming (sisterhood, etc.)</i></p><p>Senior, 6-4, ex-WSoc (love my girls down)</p><p><i>(925)-989-3179 or</i> macy@mit.edu</p></CopyCard><CopyCard title="Sophie Latz"><Image src={sophieImage} alt="Sophie Latz" className="mb-5 aspect-[4/3] w-full rounded-xl object-cover" /><p><i>Director of New Member Support</i><br /><i>→ Helps new members settle into our chapter!</i></p><p>6-9 major, WOW Rowing, Kesem</p><p><i>(404) 450-1714 or</i> salatz@mit.edu</p></CopyCard></div><div className="mt-6"><CopyCard title="Alpha Phi Zeta Phi Position Structure"><Image src={positionChart} alt="Alpha Phi Zeta Phi 2026 position structure" className="w-full rounded-xl" /></CopyCard></div></NmePage>;
}
