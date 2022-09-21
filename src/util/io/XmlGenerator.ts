import * as fs from "fs";
import { WriteStream } from "fs";
import { select } from "xpath";

export default class XmlGenerator {
  private readonly _writeStream: WriteStream;

  private readonly _xmlSerializer = new XMLSerializer();

  constructor(file: string) {
    this._writeStream = fs.createWriteStream(file, {
      encoding: "utf-8"
    });
    this._writeStream.write(`<Records><records>`);
  }

  exportData(data: Document | null) {
    if (data) {
      const recNodes = select("/records/REC", data) as Node[];
      recNodes.forEach(node => {
        const recString = this._xmlSerializer.serializeToString(node);
        this._writeStream.write(recString);
      });
    }
  }

  commitAll() {
    this._writeStream.write(`</records></Records>`);
    this._writeStream.end();
  }
}
