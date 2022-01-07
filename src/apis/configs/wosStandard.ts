import { ExportConfig } from "@/apis/helper/ExportConfig";

export const wosStandard: ExportConfig = {
  sheetName: "ResearchOutput",
  rowArrayPath: "Records.records.REC[*]",
  api: "WOS",
  csv: {
    rowDelimiter: "\n",
    fieldDelimiter: "\t",
    quote: '"'
  },
  columns: [
    {
      name: "PT",
      path:
        "static_data.summary.pub_info.pubtype|conditionalReplace(['Journal','Book'], ['J','B'])"
    },
    {
      name: "TI",
      path: "static_data.summary.titles.title[?type=='item'].content|[0]"
    }
  ]
};
