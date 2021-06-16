import {
  registerFunction,
  TYPE_ANY,
  TYPE_NULL,
  TYPE_STRING
} from "@metrichor/jmespath";

let functionRegistered = false;

export const registerConcatFunction = () => {
  if (functionRegistered) {
    try {
      registerFunction(
        "concat",
        resolvedArgs => {
          const [maybeArr, separator] = resolvedArgs;
          if (Array.isArray(maybeArr)) {
            return maybeArr.map(elem => elem.toString()).join(separator);
          } else if (maybeArr != null) {
            return maybeArr.toString();
          }
          return null;
        },
        [
          {
            types: [TYPE_ANY, TYPE_NULL]
          },
          { types: [TYPE_STRING] }
        ]
      );
      functionRegistered = true;
    } catch (e) {
      //noop
    }
  }
};
