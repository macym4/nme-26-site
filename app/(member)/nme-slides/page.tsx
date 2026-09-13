import { NmePage, CopyCard } from "@/components/nme/page";

const presentationId = "1FiOQbVtYSLTq1TMa_18YYHpurZ3BJCKMtJ0XtitejNg";

export default function NmeSlides() {
  return <NmePage title="NME Slides" subtitle="New Member presentations and other helpful information"><CopyCard title="Presentation"><div className="overflow-hidden rounded-xl border border-[#e2d4d7] bg-[#fcf8f8]"><iframe title="Alpha Phi NME slides" src={`https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000`} className="aspect-[16/9] w-full" allowFullScreen /></div><a href={`https://docs.google.com/presentation/d/${presentationId}/view`} target="_blank" rel="noreferrer" className="mt-4 inline-block font-semibold text-[#7d1d2b] underline">Open the slides in Google Slides</a></CopyCard></NmePage>;
}
