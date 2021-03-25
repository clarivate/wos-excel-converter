export type ScalarValue = string | number | null | undefined | Date;
export type RawValue = ScalarValue | Array<RawValue>;
/**
 * This method converts the JMES parsed values to flat structure of rows
 * @param a the parsed JMES array
 */
export const flattenArrays = (
  a: Array<RawValue>
): Array<Array<ScalarValue>> => {
  let result: ScalarValue[][] = [];

  for (let i = 0; i < a.length; i++) {
    if (!Array.isArray(a[i])) {
      const rawValue: ScalarValue = a[i] as ScalarValue;
      if (result.length == 0) {
        result.push([rawValue]);
      } else {
        result.forEach((unfinishedRow, index) => {
          unfinishedRow.push(rawValue);
          result[index] = unfinishedRow;
        });
      }
    } else {
      let arr = a[i] as Array<RawValue>;
      let multipleValues: Array<Array<ScalarValue>>;
      if (result.length == 0) {
        multipleValues = [];
        do {
          const rows = flattenArrays(arr);
          rows.forEach(row => {
            multipleValues.push(row);
          });
          i++;
          arr = a[i] as Array<RawValue>;
        } while (i < a.length);

        result = multipleValues;
      } else {
        multipleValues = flattenArrays(arr);
        const resultTemp = new Array<Array<ScalarValue>>(0);
        result.forEach(currArray => {
          multipleValues.forEach(mVal => {
            const currArrayTmp = currArray.map(elem => elem); //clone trick
            mVal.forEach(singleValue => {
              currArrayTmp.push(singleValue);
            });

            resultTemp.push(currArrayTmp);
          });
        });
        result = resultTemp;
      }
    }
  }
  return result;
};
