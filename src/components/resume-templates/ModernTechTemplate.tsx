import { ResumeTemplateProps } from "./types";

const ModernTechTemplate = ({ data }: ResumeTemplateProps) => (
  <div className="bg-white text-gray-900 p-8 max-w-[800px] mx-auto font-sans text-[13px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
    {/* Header */}
    <div className="border-b-2 border-blue-600 pb-4 mb-5">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{data.fullName}</h1>
      <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-gray-600">
        {data.email && <span>{data.email}</span>}
        {data.phone && <span>• {data.phone}</span>}
        {data.location && <span>• {data.location}</span>}
        {data.linkedin && <span>• {data.linkedin}</span>}
      </div>
    </div>

    {/* Summary */}
    {data.summary && (
      <div className="mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Professional Summary</h2>
        <p className="text-gray-700 leading-relaxed">{data.summary}</p>
      </div>
    )}

    {/* Skills */}
    {data.skills?.length > 0 && (
      <div className="mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Technical Skills</h2>
        <div className="space-y-1.5">
          {data.skills.map((cat, i) => (
            <div key={i} className="flex gap-2">
              <span className="font-semibold text-gray-800 min-w-[120px]">{cat.category}:</span>
              <span className="text-gray-700">{cat.skills.join(", ")}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Experience */}
    {data.experience?.length > 0 && (
      <div className="mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Experience</h2>
        <div className="space-y-4">
          {data.experience.map((exp, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-gray-900">{exp.title}</span>
                {exp.duration && <span className="text-[11px] text-gray-500">{exp.duration}</span>}
              </div>
              <p className="text-gray-600 text-[11px] mb-1">{exp.company}</p>
              <ul className="space-y-1 ml-4">
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
      <div className="mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Projects</h2>
        <div className="space-y-3">
          {data.projects.map((proj, i) => (
            <div key={i}>
              <span className="font-semibold text-gray-900">{proj.name}</span>
              <p className="text-gray-700 mt-0.5">{proj.description}</p>
              {proj.technologies && (
                <p className="text-[11px] text-gray-500 mt-0.5">Tech: {proj.technologies.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Education */}
    {data.education && data.education.length > 0 && (
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Education</h2>
        {data.education.map((edu, i) => (
          <div key={i} className="flex justify-between">
            <div>
              <span className="font-semibold text-gray-900">{edu.degree}</span>
              <p className="text-gray-600 text-[11px]">{edu.institution}</p>
            </div>
            {edu.year && <span className="text-[11px] text-gray-500">{edu.year}</span>}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default ModernTechTemplate;
