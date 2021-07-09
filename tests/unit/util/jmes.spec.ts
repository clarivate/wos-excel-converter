import { ExportConfig } from "@/apis/helper/ExportConfig";
import {
  collectionColumnConfigToJMES,
  configArrayToJMES,
  mainPath,
  sheetPath
} from "@/util/jmesPath";

describe("JMES path should", () => {
  it("produce the correct jmes paths ", () => {
    const testConfig: ExportConfig = {
      rowArrayPath: "Data.Test[*]",
      sheetName: "Test",
      api: "WOS",
      columns: [
        {
          name: "test1",
          path: "test1"
        },
        {
          name: "test3",
          path: "test3"
        }
      ],
      columnCollection: [
        {
          mainPath: "someArray[]",
          api: "WOS",
          columns: [
            {
              name: "test2",
              path: "test2"
            }
          ],
          columnCollection: [
            {
              mainPath: "anotherArray[]",
              api: "WOS",
              columns: [{ name: "test5", path: "test5" }]
            }
          ]
        }
      ],
      sheets: [
        {
          sheetName: "test",
          mainPath: "sheetArrow[]",
          referenceColumns: ["test1", "test3"],
          api: "WOS",
          columns: [
            {
              name: "test1",
              path: "test1"
            },
            {
              name: "test3",
              path: "test3"
            }
          ],
          columnCollection: [
            {
              mainPath: "someArray[]",
              api: "WOS",
              columns: [
                {
                  name: "test2",
                  path: "test2"
                }
              ],
              columnCollection: [
                {
                  api: "WOS",
                  mainPath: "anotherArray[]",
                  columns: [{ name: "test5", path: "test5" }]
                }
              ]
            }
          ]
        }
      ]
    };

    expect(configArrayToJMES(testConfig.columns)).toEqual("test1,test3");
    if (testConfig.columnCollection) {
      expect(
        collectionColumnConfigToJMES(testConfig.columnCollection[0])
      ).toEqual("someArray[].[test2,anotherArray[].[test5]]");
    }
    if (testConfig.sheets) {
      expect(
        sheetPath(0, testConfig.sheets[0], "Data.Test[*]", ["test1", "test3"])
      ).toEqual(
        "Data.Test[0].sheetArrow[].['test1','test3',test1,test3,someArray[].[test2,anotherArray[].[test5]]]"
      );
    }

    expect(mainPath(testConfig)).toEqual(
      "Data.Test[*].[test1,test3,someArray[].[test2,anotherArray[].[test5]]]"
    );
  });
});
