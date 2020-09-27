import startOfWeek from "./startOfWeek";

describe("startOfWeek", () => {
  it("returns the start of the week in date format", () => {
    expect(startOfWeek("2020-01-08T15:22:35.516Z")).toEqual("2020-01-05");
  });

  it("returns the start of the week on a year boundary", () => {
    expect(startOfWeek("2020-01-01T15:22:35.516Z")).toEqual("2019-12-29");
  });

  it("returns the same date when the timestamp is on the start of the week", () => {
    expect(startOfWeek("2020-01-05T00:00:00")).toEqual("2020-01-05");
  });
});
