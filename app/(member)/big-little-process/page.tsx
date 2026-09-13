import { CopyCard, NmePage } from "@/components/nme/page";
import { getCurrentUser } from "@/lib/auth";
import { syncDateFeedbackCompletions } from "@/lib/date-feedback";
import { prisma } from "@/lib/prisma";

export default async function BigLittle() {
  const user = await getCurrentUser();
  await syncDateFeedbackCompletions();
  const assignments = user ? await prisma.dateAssignment.findMany({ where: { OR: [{ memberOne: user.name }, { memberTwo: user.name }] }, orderBy: { week: "asc" } }) : [];
  const completions = user && assignments.length ? await prisma.dateFeedbackCompletion.findMany({ where: { userId: user.id, assignmentId: { in: assignments.map((assignment) => assignment.id) } } }) : [];
  const completed = new Set(completions.map((completion) => completion.assignmentId));

  return <NmePage title="Big/Little Process"><SisterDateStatus assignments={assignments} userName={user?.name} completed={completed} /><div className="mt-6 grid gap-6 lg:grid-cols-[.7fr_1.3fr]"><CopyCard title="Schedule"><p>All events, including their location and duration, are in the calendar on the homepage.</p></CopyCard><CopyCard title="Big/Little Process"><p><b>What is a big? What should you be looking for?</b></p><p>A guide, cheerleader, and non-academic role model! Every relationship is different - look for someone who makes you happy.</p><p>You will be paired with a big during reveals, so it is time to get to know the class above you.</p><p>First, fill out the <a className="font-semibold text-[#7d1d2b] underline" href="https://forms.gle/U1PHyTbuBbkJxcfq6" target="_blank" rel="noreferrer">PC 25/26 Profiles</a>. It helps the chapter get to know you and helps you get to know the class above you.</p><p>You will go on 2-3 sister dates a week for the next five weeks. We will also hold Ivy Linkers during NME for you to speed date the sophomores, then you will fill out feedback forms after each date.</p><p>Sophie and Macy will use these forms and feedback to pair you with members you would love, so it is <b>so important</b> to fill them out on time.</p></CopyCard></div><div className="mt-6"><CopyCard title="FAQ"><p><b>What if I feel like I am not finding someone I click with?</b><br />Go to NME Office Hours. The better we know you, the more we can help.</p><p><b>What if I cannot schedule a sister date or have a busy week?</b><br />Let that member know over text, then schedule it for the following week.</p><p><b>How do I pay for sister dates?</b><br />Sister dates are personal, and each member approaches them differently. If sister dates ever put emotional, social, or fiscal stress on you, please text Macy, Sophie, and Saachi to discuss the Inclusivity Fund or more cost-effective approaches.</p></CopyCard></div></NmePage>;
}

function SisterDateStatus({ assignments, userName, completed }: { assignments: { id: string; memberOne: string; memberTwo: string; week: number }[]; userName?: string; completed: Set<string> }) {
  const weeks = [1, 2, 3, 4];
  const assignmentsByWeek = weeks.map((week) => assignments.filter((assignment) => assignment.week === week));
  const slotCount = Math.max(3, ...assignmentsByWeek.map((dates) => dates.length));

  return (
    <div className="mt-6">
      <CopyCard title="Your sister-date status">
        <p className="text-sm text-[#806d72]">Dates will be released the Sunday before the week.</p>
        <div className="overflow-x-auto rounded-xl border border-[#e2dfe1]">
          <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
            <caption className="sr-only">Your sister dates by week and feedback status</caption>
            <thead>
              <tr className="bg-[#fcf5f6]">
                {weeks.map((week) => <th key={week} scope="col" className="border-b border-[#e2dfe1] px-4 py-3 font-bold text-[#4a3036]">Week #{week}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: slotCount }, (_, slot) => (
                <tr key={slot}>
                  {assignmentsByWeek.map((dates, weekIndex) => {
                    const assignment = dates[slot];
                    const isComplete = assignment ? completed.has(assignment.id) : false;
                    const partner = assignment && (assignment.memberOne === userName ? assignment.memberTwo : assignment.memberOne);
                    return (
                      <td key={weeks[weekIndex]} className="border-b border-[#e2dfe1] p-3 align-top">
                        {assignment ? (
                          <div className={`rounded-lg border p-3 ${isComplete ? "border-green-200 bg-green-100 text-green-900" : "border-yellow-200 bg-yellow-100 text-yellow-900"}`}>
                            <p className="font-bold">{partner}</p>
                            <p className="mt-1 text-sm font-semibold">{isComplete ? "Feedback submitted" : "Feedback needed"}</p>
                            <a href="https://forms.gle/A2Fw2Po2JUe3b6As7" target="_blank" rel="noreferrer" className="mt-2 inline-block rounded-md bg-[#7d1d2b] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#5c1520] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d1d2b]">fill out sister date feedback form here</a>
                          </div>
                        ) : <p className="rounded-lg bg-[#f4f1ee] p-3 text-sm text-[#806d72]">Not assigned yet</p>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CopyCard>
    </div>
  );
}
