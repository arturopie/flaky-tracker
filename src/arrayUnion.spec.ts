import arrayUnion from "./arrayUnion";

describe("arrayUnion", () => {
  it("returns empty array when both arrays are empty", () => {
    expect(arrayUnion([], [], equalityFunc)).toEqual([]);
  });

  it("returns first array when second one is empty", () => {
    expect(arrayUnion([{ a: 1 }, { a: 2 }], [], equalityFunc)).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("returns second array when second one is empty", () => {
    expect(arrayUnion([], [{ a: 2 }], equalityFunc)).toEqual([{ a: 2 }]);
  });

  it("returns concat when arrays have no common elements", () => {
    expect(arrayUnion([{ a: 1 }], [{ a: 2 }], equalityFunc)).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("returns a concat with no duplicates", () => {
    expect(arrayUnion([{ a: 1 }], [{ a: 1 }], equalityFunc)).toEqual([{ a: 1 }]);
  });

  function equalityFunc(item1, item2) {
    return item1.a === item2.a;
  }
});
