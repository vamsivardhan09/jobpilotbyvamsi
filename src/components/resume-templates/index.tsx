import { TemplateName, ResumeData } from "./types";
import ModernTechTemplate from "./ModernTechTemplate";
import MinimalATSTemplate from "./MinimalATSTemplate";
import CorporateTemplate from "./CorporateTemplate";

export { TEMPLATE_OPTIONS } from "./types";
export type { ResumeData, TemplateName } from "./types";

interface Props {
  template: TemplateName;
  data: ResumeData;
}

const ResumeTemplate = ({ template, data }: Props) => {
  switch (template) {
    case "modern-tech":
      return <ModernTechTemplate data={data} />;
    case "minimal-ats":
      return <MinimalATSTemplate data={data} />;
    case "corporate-professional":
      return <CorporateTemplate data={data} />;
    default:
      return <ModernTechTemplate data={data} />;
  }
};

export default ResumeTemplate;
