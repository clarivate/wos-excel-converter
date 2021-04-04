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
      required: ["mainPath", "columns"]
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
        required: ["sheetName", "mainPath", "columns"]
      },
      additionalItems: false,
      minItems: 1
    }
  },
  additionalProperties: false,
  required: ["sheetName", "rowArrayPath", "columns"]
};
export default ConfigSchema;
