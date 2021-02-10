const ConfigSchema = {
  $schema: "http://json-schema.org/draft-04/schema#",
  type: "object",
  properties: {
    sheetName: {
      type: "string"
    },
    rowArrayPath: {
      type: "string"
    },
    columns: {
      type: "array",
      items: {
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
      additionalItems: false,
      minItems: 1
    },
    columnCollection: {
      type: "array",
      items: {
        type: "object",
        properties: {
          mainPath: {
            type: "string"
          },
          columns: {
            type: "array",
            items: {
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
            additionalItems: false,
            minItems: 1
          }
        },
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
          rowArrayPath: {
            type: "array",
            items: {
              type: "string"
            },
            minItems: 1
          },
          referenceColumns: {
            type: "array",
            items: {
              type: "string"
            },
            minItems: 1,
            maxItems: 3
          },
          columns: {
            type: "array",
            items: {
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
            additionalItems: false
          }
        },
        additionalProperties: false,
        required: ["sheetName", "rowArrayPath", "columns"]
      },
      additionalItems: false,
      minItems: 1
    }
  },
  additionalProperties: false,
  required: ["sheetName", "rowArrayPath", "columns"]
};
export default ConfigSchema;
