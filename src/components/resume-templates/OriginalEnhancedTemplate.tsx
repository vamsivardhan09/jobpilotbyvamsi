import { ResumeTemplateProps } from "./types";

/**
 * "Original Enhanced" template — preserves a clean, traditional resume layout.
 * ATS keywords are naturally woven into Skills and Experience sections
 * rather than shown in a separate highlighted block.
 */
const OriginalEnhancedTemplate = ({ data }: ResumeTemplateProps) => {
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
        <h1 style={{ fontSize: "20pt", fontWeight: 700, margin: 0, letterSpacing: "1px", textTransform: "uppercase" }}>
          {data.fullName}
        </h1>
        <div style={{ fontSize: "9.5pt", color: "#333", marginTop: "6px", display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
          {data.email && <span>{data.email}</span>}
          {data.email && data.phone && <span>|</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.phone && data.location && <span>|</span>}
          {data.location && <span>{data.location}</span>}
          {data.location && data.linkedin && <span>|</span>}
          {data.linkedin && <span>{data.linkedin}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: "14px" }}>
          <h2 style={sectionHeadingStyle}>Professional Summary</h2>
          <p style={{ margin: 0, textAlign: "justify" }}>{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience?.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <h2 style={sectionHeadingStyle}>Professional Experience</h2>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong style={{ fontSize: "11.5pt" }}>{exp.title}</strong>
                {exp.duration && <span style={{ fontSize: "9.5pt", color: "#333", fontStyle: "italic" }}>{exp.duration}</span>}
              </div>
              <div style={{ fontStyle: "italic", fontSize: "10pt", color: "#444", marginBottom: "4px" }}>{exp.company}</div>
              <ul style={{ margin: "2px 0 0 18px", padding: 0, listStyleType: "disc" }}>
                {exp.bullets.map((b, j) => (
                  <li key={j} style={{ marginBottom: "2px", textAlign: "justify" }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills?.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <h2 style={sectionHeadingStyle}>Technical Skills</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {data.skills.map((cat, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, fontSize: "10pt", padding: "3px 12px 3px 0", verticalAlign: "top", whiteSpace: "nowrap", width: "1%" }}>
                    {cat.category}:
                  </td>
                  <td style={{ fontSize: "10.5pt", padding: "3px 0", verticalAlign: "top" }}>
                    {cat.skills.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <h2 style={sectionHeadingStyle}>Education</h2>
          {data.education.map((edu, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
              <div>
                <strong>{edu.degree}</strong>
                <span style={{ color: "#333" }}> — {edu.institution}</span>
              </div>
              {edu.year && <span style={{ fontSize: "9.5pt", color: "#333", fontStyle: "italic" }}>{edu.year}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <h2 style={sectionHeadingStyle}>Projects</h2>
          {data.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: "8px" }}>
              <strong>{proj.name}</strong>
              <p style={{ margin: "2px 0", textAlign: "justify" }}>{proj.description}</p>
              {proj.technologies && proj.technologies.length > 0 && (
                <div style={{ fontSize: "9.5pt", color: "#333", fontStyle: "italic" }}>
                  Technologies: {proj.technologies.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: "11.5pt",
  fontWeight: 700,
  textTransform: "uppercase",
  borderBottom: "1px solid #333",
  marginBottom: "6px",
  paddingBottom: "2px",
  letterSpacing: "0.5px",
};

export default OriginalEnhancedTemplate;
