import { flattenArrays } from "@/util/parse";

describe("Cartesian should", () => {
  it("calculate cartesian product of numbers", () => {
    // expect(cartesian([1, 2, [3, 4]])).toEqual([[1, 2, 3, 4]]);
    expect(flattenArrays([])).toEqual([]);

    expect(flattenArrays([1, 2, [3, 4]])).toEqual([[1, 2, 3, 4]]);

    expect(flattenArrays([1, 2, [3], [4]])).toEqual([[1, 2, 3, 4]]);

    expect(flattenArrays([1, 2, [[3]]])).toEqual([[1, 2, 3]]);

    expect(flattenArrays([1, 2, [[3], [4]]])).toEqual([
      [1, 2, 3],
      [1, 2, 4]
    ]);

    expect(flattenArrays([1, 2, [[null], [4]]])).toEqual([
      [1, 2, null],
      [1, 2, 4]
    ]);

    expect(
      flattenArrays([
        1,
        2,
        [
          [3, 4],
          [5, 6]
        ]
      ])
    ).toEqual([
      [1, 2, 3, 4],
      [1, 2, 5, 6]
    ]);

    expect(
      flattenArrays([
        1,
        2,
        [
          [3, "4"],
          ["5", 6]
        ],
        7
      ])
    ).toEqual([
      [1, 2, 3, "4", 7],
      [1, 2, "5", 6, 7]
    ]);

    expect(
      flattenArrays([
        1,
        2,
        [
          [3, 4],
          [5, 6]
        ],
        [7, 8]
      ])
    ).toEqual([
      [1, 2, 3, 4, 7, 8],
      [1, 2, 5, 6, 7, 8]
    ]);

    expect(
      flattenArrays([
        1,
        2,
        [
          [3, 4],
          [5, 6]
        ],
        [[7], [8]]
      ])
    ).toEqual([
      [1, 2, 3, 4, 7],
      [1, 2, 3, 4, 8],
      [1, 2, 5, 6, 7],
      [1, 2, 5, 6, 8]
    ]);
  });
});
