import { ResumeTemplateProps } from "./types";

/**
 * "Original Enhanced" template — preserves the user's original resume layout
 * but highlights injected ATS keywords with a subtle accent.
 */
const OriginalEnhancedTemplate = ({ data }: ResumeTemplateProps) => {
  const addedKeywords = data.atsKeywords || [];

  return (
    <div
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        padding: "24px 32px",
        background: "#fff",
        color: "#1a1a1a",
        fontFamily: "'Times New Roman', serif",
        fontSize: "11pt",
        lineHeight: "1.5",
      }}
    >
      {/* Header — classic centered */}
      <div style={{ textAlign: "center", marginBottom: "16px", borderBottom: "2px solid #222", paddingBottom: "12px" }}>
        <h1 style={{ fontSize: "20pt", fontWeight: 700, margin: 0, letterSpacing: "1px" }}>
          {data.fullName}
        </h1>
        <div style={{ fontSize: "9pt", color: "#555", marginTop: "4px", display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>| {data.phone}</span>}
          {data.location && <span>| {data.location}</span>}
          {data.linkedin && <span>| {data.linkedin}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ fontSize: "11pt", fontWeight: 700, textTransform: "uppercase", borderBottom: "1px solid #999", marginBottom: "4px", paddingBottom: "2px" }}>
            Professional Summary
          </h2>
          <p style={{ margin: 0, textAlign: "justify" }}>{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience?.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ fontSize: "11pt", fontWeight: 700, textTransform: "uppercase", borderBottom: "1px solid #999", marginBottom: "6px", paddingBottom: "2px" }}>
            Experience
          </h2>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong>{exp.title}</strong>
                {exp.duration && <span style={{ fontSize: "9pt", color: "#555" }}>{exp.duration}</span>}
              </div>
              <div style={{ fontStyle: "italic", fontSize: "10pt", color: "#444" }}>{exp.company}</div>
              <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                {exp.bullets.map((b, j) => (
                  <li key={j} style={{ marginBottom: "2px" }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills?.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ fontSize: "11pt", fontWeight: 700, textTransform: "uppercase", borderBottom: "1px solid #999", marginBottom: "6px", paddingBottom: "2px" }}>
            Skills
          </h2>
          {data.skills.map((cat, i) => (
            <div key={i} style={{ marginBottom: "4px" }}>
              <strong>{cat.category}: </strong>
              <span>{cat.skills.join(", ")}</span>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ fontSize: "11pt", fontWeight: 700, textTransform: "uppercase", borderBottom: "1px solid #999", marginBottom: "6px", paddingBottom: "2px" }}>
            Education
          </h2>
          {data.education.map((edu, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <div>
                <strong>{edu.degree}</strong> — {edu.institution}
              </div>
              {edu.year && <span style={{ fontSize: "9pt", color: "#555" }}>{edu.year}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ fontSize: "11pt", fontWeight: 700, textTransform: "uppercase", borderBottom: "1px solid #999", marginBottom: "6px", paddingBottom: "2px" }}>
            Projects
          </h2>
          {data.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: "6px" }}>
              <strong>{proj.name}</strong>
              <p style={{ margin: "2px 0" }}>{proj.description}</p>
              {proj.technologies && (
                <span style={{ fontSize: "9pt", color: "#555" }}>Technologies: {proj.technologies.join(", ")}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ATS Keywords — highlighted section */}
      {addedKeywords.length > 0 && (
        <div style={{ marginTop: "16px", padding: "12px", border: "1px dashed #0066cc", borderRadius: "4px", background: "#f0f6ff" }}>
          <h2 style={{ fontSize: "10pt", fontWeight: 700, color: "#0066cc", margin: "0 0 6px 0", textTransform: "uppercase" }}>
            ✦ ATS Keywords Added
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {addedKeywords.map((kw, i) => (
              <span
                key={i}
                style={{
                  padding: "2px 8px",
                  borderRadius: "3px",
                  fontSize: "9pt",
                  fontWeight: 600,
                  background: "#dbeafe",
                  color: "#1e40af",
                  border: "1px solid #93c5fd",
                }}
              >
                {kw}
              </span>
            ))}
          </div>
          <p style={{ fontSize: "8pt", color: "#666", marginTop: "6px", marginBottom: 0 }}>
            These keywords were added to improve ATS compatibility. They are woven into the content above.
          </p>
        </div>
      )}
    </div>
  );
};

export default OriginalEnhancedTemplate;
