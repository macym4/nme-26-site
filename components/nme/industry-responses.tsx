import careerResponses from "@/lib/career-responses.json";

type CareerResponse = {
  major: string;
  industry: string;
  category: string;
  answers: { question: string; answer: string }[];
};

const categoryOrder = [
  "Management Consulting",
  "Finance",
  "Software Engineering, AI & Research",
  "Pharma, Biotechnology & Academia",
  "Bioengineering & Climate Research",
  "Mechanical Engineering, Robotics & Controls",
  "Quant Trading",
  "Policy & Law",
  "AI & Finance",
];

export function IndustryResponses() {
  const responses = careerResponses as CareerResponse[];

  return (
    <div className="mt-4 space-y-4">
      {categoryOrder.map((category) => {
        const people = responses.filter((response) => response.category === category);
        if (!people.length) return null;

        return (
          <details key={category} className="group rounded-xl border border-[#eadfe1] bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-serif text-xl font-semibold text-[#4a3036]">
              {category}
              <span aria-hidden="true" className="text-sm transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="space-y-5 border-t border-[#f0e7e8] p-5">
              {people.map((person, personIndex) => (
                <article key={`${person.industry}-${person.major}-${personIndex}`} className="rounded-xl bg-[#fcf8f8] p-5">
                  <div className="border-b border-[#eadfe1] pb-3">
                    <p className="text-sm font-semibold text-[#806d72]">Major of the respondee: {person.major || "Not provided"}</p>
                  </div>
                  <div className="mt-4 space-y-5">
                    {person.answers.map(({ question, answer }, index) => (
                      <section key={`${person.industry}-${personIndex}-${index}`}>
                        <h4 className="text-sm font-bold leading-6 text-[#4a3036]">{question}</h4>
                        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#655258]">{answer}</p>
                      </section>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
