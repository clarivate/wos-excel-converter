import * as fs from "fs";
import { JSONValue } from "@metrichor/jmespath";
import { WriteStream } from "fs";

export default class JsonGenerator {
  private readonly _writeStream: WriteStream;

  private first = true;

  constructor(file: string) {
    this._writeStream = fs.createWriteStream(file, {
      encoding: "utf-8"
    });
    this._writeStream.write(`{
    "Records": {
      "records": {
        "REC": [
    `);
  }

  exportData(data: { Records: { records: { REC: Array<JSONValue> } } }) {
    data.Records.records.REC.forEach(rec => {
      let recString: string;
      if (this.first) {
        recString = JSON.stringify(rec, null, 2);
        this.first = false;
      } else {
        recString = "," + JSON.stringify(rec, null, 2);
      }
      this._writeStream.write(recString);
    });
  }

  commitAll() {
    this._writeStream.write(`]
        }
      }
    }
    `);
    this._writeStream.end();
  }
}
