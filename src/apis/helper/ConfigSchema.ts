const ConfigSchema = {
  $schema: "http://json-schema.org/draft-04/schema#",
  definitions: {
    column: {
      id: "#column",
      type: "object",
      properties: {
        name: {
          type: "string"
        },
        path: {
          type: "string"
        }
      },
      additionalProperties: false,
      required: ["name", "path"]
    },
    columnCollection: {
      id: "#colCollection",
      type: "object",
      properties: {
        mainPath: {
          type: "string"
        },
        api: {
          type: "string",
          enum: ["WOS", "InCites", "Journals"]
        },
        columns: {
          type: "array",
          items: {
            $ref: "#column"
          },
          additionalItems: false,
          minItems: 1
        },
        columnCollection: {
          type: "array",
          items: {
            $ref: "#colCollection"
          },
          additionalItems: false,
          minItems: 1
        }
      },
      additionalProperties: false,
      required: ["mainPath", "columns", "api"]
    },
    csv: {
      id: "#csv",
      type: "object",
      properties: {
        fieldDelimiter: {
          type: "string"
        },
        rowDelimiter: {
          type: "string"
        },
        quote: {
          type: "string"
        }
      },
      additionalProperties: false,
      required: ["fieldDelimiter", "rowDelimiter", "quote"]
    }
  },

  type: "object",
  properties: {
    sheetName: {
      type: "string"
    },
    rowArrayPath: {
      type: "string"
    },
    api: {
      type: "string",
      enum: ["WOS", "InCites", "Journals"]
    },
    citedReferences: {
      type: "boolean"
    },
    citingReferences: {
      type: "boolean"
    },
    csv: {
      type: "object",
      $ref: "#/definitions/csv",
      additionalItems: false
    },
    columns: {
      type: "array",
      items: {
        $ref: "#column"
      },
      additionalItems: false,
      minItems: 1
    },
    columnCollection: {
      type: "array",
      items: {
        $ref: "#colCollection",
        additionalItems: false,
        minItems: 1
      }
    },
    sheets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sheetName: {
            type: "string"
          },
          mainPath: {
            type: "string"
          },
          api: {
            type: "string",
            enum: ["WOS", "InCites", "Journals"]
          },
          csv: {
            type: "object",
            $ref: "#csv"
          },
          referenceColumns: {
            type: "array",
            items: {
              type: "string"
            },
            minItems: 1,
            maxItems: 5
          },
          columns: {
            type: "array",
            items: {
              $ref: "#column"
            },
            additionalItems: false,
            minItems: 1
          },
          columnCollection: {
            type: "array",
            items: {
              $ref: "#colCollection",
              additionalItems: false,
              minItems: 1
            }
          }
        },
        additionalProperties: false,
        required: ["sheetName", "mainPath", "columns", "api"]
      },
      additionalItems: false,
      minItems: 1
    }
  },
  additionalProperties: false,
  required: ["sheetName", "rowArrayPath", "columns", "api"]
};
export default ConfigSchema;
