import { CopyCard, NmePage } from "@/components/nme/page";
import { IndustryResponses } from "@/components/nme/industry-responses";

const companies = ["Morgan Stanley", "Goldman Sachs", "D. E. Shaw", "Lilly", "NBA", "Fidelity", "Dropbox", "Apple", "PJT Partners", "Google", "Duolingo", "BCG"];

export default function AcademicCareer() {
  return <NmePage title="Academic & Career" subtitle="Resources from the chapter to help you learn, connect, and plan your next steps.">
    <div className="grid gap-6 lg:grid-cols-2"><AcademicResources /><CareerResources /></div>
    <CopyCard title="Our APhi Network"><p>If you&apos;re interested in a particular industry, <b>ask Macy or Sophie!</b> We promise we know people in every field. Our sisters are ridiculously accomplished.</p><p className="font-semibold text-[#4a3036]">Some companies our current members have worked or work at/with:</p><div className="flex flex-wrap gap-2">{companies.map((company) => <span key={company} className="rounded-full bg-[#f4e5e7] px-3 py-1.5 text-sm font-semibold text-[#7d1d2b]">{company}</span>)}</div></CopyCard>
    <section className="mt-6">
      <div className="rounded-2xl border border-[#eadfe1] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#90777d]">From our members</p>
        <h2 className="mt-1 font-serif text-2xl font-semibold text-[#4a3036]">Industry Resources</h2>
        <p className="mt-2 text-[15px] leading-7 text-[#655258]">Questions and responses are organized by industry. Answers are shown as submitted, with only grammatical corrections where needed.</p>
      </div>
      <IndustryResponses />
      <p className="mt-4 rounded-xl bg-[#fcf5f6] px-4 py-3 text-sm leading-6 text-[#655258]">If you want information about an industry and it&apos;s not here, reach out to Sophie and Macy! We can get that information for you.</p>
    </section>
  </NmePage>;
}

function AcademicResources() {
  return <CopyCard title="Academic"><Resource title="Academic Big/Littles">You can sign up later in the semester to be paired with an older member in a similar academic or professional area. They can be a huge resource.</Resource><Resource title="Your sisters!">Our older sisters taught us so much, and we <i>love</i> passing it on. Don&apos;t be afraid to ask for help! It&apos;ll be your responsibility to pass on that kindness when you&apos;re older too &lt;3</Resource><Resource title="TSR²"><p>Weekly PSET nights, online and in-person exam reviews, specific help, and study groups that meet twice a week for one hour during the semester. Vouched for by seniors.</p><p>&ldquo;The TSR2 provides one-on-one appointments for a variety of MIT courses, with a focus on first-year GIRs.&rdquo;</p><a className="font-semibold text-[#7d1d2b] underline" href="https://oaces.mit.edu/tsr2/tsr2-services" target="_blank" rel="noreferrer">Explore TSR² services</a></Resource><Resource title="Plan your MIT roadmap"><p><a className="font-semibold text-[#7d1d2b] underline" href="https://courseroad.mit.edu/road/64850" target="_blank" rel="noreferrer">CourseRoad</a> is great for mapping out your overall college plan. It&apos;s very normal to ask upperclassmen for their CourseRoad!</p><p><a className="font-semibold text-[#7d1d2b] underline" href="https://hydrant.mit.edu/" target="_blank" rel="noreferrer">Hydrant</a> is useful for day-to-day class schedules.</p></Resource><Resource title="Campus maps"><p><a className="font-semibold text-[#7d1d2b] underline" href="https://whereis.mit.edu/" target="_blank" rel="noreferrer">WhereIs MIT</a> is the original campus map.</p><p><a className="font-semibold text-[#7d1d2b] underline" href="https://mitmapit.org/" target="_blank" rel="noreferrer">MIT Map It</a> is the improved, room-by-room campus map (requires Kerberos access).</p></Resource></CopyCard>;
}

function CareerResources() {
  return <CopyCard title="Career"><Resource title="CAPD"><p>MIT&apos;s career advising office has some of the most knowledgeable people on campus. Even if they aren&apos;t the right place for a question, they can direct you to who is.</p><p>They offer one-on-one career meetings, résumé reviews, the career fair, and other events with companies.</p></Resource><Resource title="LinkedIn Network & Alumni"><p>Join the APhi LinkedIn network. Alumni are an incredible resource—email them!</p><p><b>Cold email them. Warm email them. Just email them.</b> They genuinely get excited when Phis reach out, and they&apos;re <i>so</i> helpful.</p></Resource><Resource title="Alumni events">Look out for APhi alum events, including alumni coffee chats and the alumni career panel.</Resource></CopyCard>;
}

function Resource({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className="rounded-xl bg-[#fcf5f6] p-4"><h3 className="font-bold text-[#4a3036]">{title}</h3><div className="mt-1 space-y-2 text-sm leading-6 text-[#655258]">{children}</div></article>;
}

