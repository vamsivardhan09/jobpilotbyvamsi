import { ResumeTemplateProps } from "./types";

const MinimalATSTemplate = ({ data }: ResumeTemplateProps) => (
  <div className="bg-white text-gray-900 p-8 max-w-[800px] mx-auto font-sans text-[13px] leading-relaxed" style={{ fontFamily: "'Arial', sans-serif" }}>
    {/* Header - centered, simple */}
    <div className="text-center mb-5 pb-3 border-b border-gray-300">
      <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">{data.fullName}</h1>
      <div className="flex flex-wrap justify-center gap-2 mt-1.5 text-[11px] text-gray-600">
        {data.email && <span>{data.email}</span>}
        {data.phone && <span>| {data.phone}</span>}
        {data.location && <span>| {data.location}</span>}
        {data.linkedin && <span>| {data.linkedin}</span>}
      </div>
    </div>

    {/* Summary */}
    {data.summary && (
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-1 mb-2">Summary</h2>
        <p className="text-gray-700">{data.summary}</p>
      </div>
    )}

    {/* Skills - inline for ATS */}
    {data.skills?.length > 0 && (
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-1 mb-2">Skills</h2>
        {data.skills.map((cat, i) => (
          <p key={i} className="text-gray-700 mb-1">
            <span className="font-semibold">{cat.category}: </span>
            {cat.skills.join(", ")}
          </p>
        ))}
      </div>
    )}

    {/* Experience */}
    {data.experience?.length > 0 && (
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-1 mb-2">Professional Experience</h2>
        <div className="space-y-3">
          {data.experience.map((exp, i) => (
            <div key={i}>
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">{exp.title}</span>
                {exp.duration && <span className="text-[11px] text-gray-500">{exp.duration}</span>}
              </div>
              <p className="text-gray-600 italic text-[12px]">{exp.company}</p>
              <ul className="mt-1 space-y-0.5 ml-4">
                {exp.bullets.map((b, j) => (
                  <li key={j} className="text-gray-700 list-disc">{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Projects */}
    {data.projects && data.projects.length > 0 && (
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-1 mb-2">Projects</h2>
        {data.projects.map((proj, i) => (
          <div key={i} className="mb-2">
            <span className="font-bold text-gray-900">{proj.name}</span>
            <p className="text-gray-700">{proj.description}</p>
            {proj.technologies && <p className="text-[11px] text-gray-500">Technologies: {proj.technologies.join(", ")}</p>}
          </div>
        ))}
      </div>
    )}

    {/* Education */}
    {data.education && data.education.length > 0 && (
      <div>
        <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-1 mb-2">Education</h2>
        {data.education.map((edu, i) => (
          <div key={i} className="flex justify-between mb-1">
            <div>
              <span className="font-bold text-gray-900">{edu.degree}</span>
              <span className="text-gray-600"> — {edu.institution}</span>
            </div>
            {edu.year && <span className="text-[11px] text-gray-500">{edu.year}</span>}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default MinimalATSTemplate;
