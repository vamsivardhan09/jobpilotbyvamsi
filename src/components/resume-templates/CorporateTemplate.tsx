import { ResumeTemplateProps } from "./types";

const CorporateTemplate = ({ data }: ResumeTemplateProps) => (
  <div className="bg-white text-gray-900 p-8 max-w-[800px] mx-auto font-serif text-[13px] leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>
    {/* Header with left accent bar */}
    <div className="flex gap-4 mb-6 pb-4 border-b-2 border-gray-800">
      <div className="w-1 bg-gray-800 shrink-0 rounded" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{data.fullName}</h1>
        <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>• {data.phone}</span>}
          {data.location && <span>• {data.location}</span>}
          {data.linkedin && <span>• {data.linkedin}</span>}
        </div>
      </div>
    </div>

    {/* Summary */}
    {data.summary && (
      <div className="mb-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>Executive Summary</h2>
        <p className="text-gray-700 italic leading-relaxed">{data.summary}</p>
      </div>
    )}

    {/* Experience */}
    {data.experience?.length > 0 && (
      <div className="mb-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Professional Experience</h2>
        <div className="space-y-4">
          {data.experience.map((exp, i) => (
            <div key={i} className="pl-4 border-l-2 border-gray-200">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-gray-900 text-[14px]">{exp.title}</span>
                {exp.duration && <span className="text-[10px] text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>{exp.duration}</span>}
              </div>
              <p className="text-gray-600 text-[12px] mb-1.5">{exp.company}</p>
              <ul className="space-y-1 ml-3">
                {exp.bullets.map((b, j) => (
                  <li key={j} className="text-gray-700 list-disc text-[12px]">{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Two column: Skills + Education */}
    <div className="grid grid-cols-2 gap-6">
      {/* Skills */}
      {data.skills?.length > 0 && (
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>Core Competencies</h2>
          {data.skills.map((cat, i) => (
            <div key={i} className="mb-2">
              <p className="font-semibold text-gray-800 text-[11px] uppercase">{cat.category}</p>
              <p className="text-gray-600 text-[12px]">{cat.skills.join(" · ")}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>Education</h2>
            {data.education.map((edu, i) => (
              <div key={i} className="mb-1.5">
                <p className="font-bold text-gray-900 text-[12px]">{edu.degree}</p>
                <p className="text-gray-600 text-[11px]">{edu.institution}{edu.year ? ` — ${edu.year}` : ""}</p>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>Key Projects</h2>
            {data.projects.map((proj, i) => (
              <div key={i} className="mb-1.5">
                <p className="font-bold text-gray-900 text-[12px]">{proj.name}</p>
                <p className="text-gray-600 text-[11px]">{proj.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default CorporateTemplate;
