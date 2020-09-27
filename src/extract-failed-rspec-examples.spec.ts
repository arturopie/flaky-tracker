import extractFailedRspecExamples from "./extract-failed-rspec-examples";

describe("extractFailedRspecExamples", () => {
  it("returns empty array when there is no Rspec summary in log content", () => {
    const mockLogContent = `
[2020-06-16T18:05:02Z] More Output
[2020-06-16T18:05:02Z] Finished in 2 minutes 14.7 seconds (files took 4.8 seconds to load)
[2020-06-16T18:05:02Z] \u001B[31m119 examples, 1 failure, 2 pending\u001B[0m
[2020-06-16T18:05:02Z]
[2020-06-16T18:05:02Z]
[2020-06-16T18:05:02Z] Randomized with seed 47060
[2020-06-16T18:05:02Z]
[2020-06-16T18:05:04Z] More Output
`;

    expect(extractFailedRspecExamples(mockLogContent)).toEqual([]);
  });

  it("returns empty array when there is no output", () => {
    expect(extractFailedRspecExamples("")).toEqual([]);
  });

  it("extracts rspec failure from Buildkite logs on a retried build that passed", () => {
    const mockLogContent = `
[2020-06-16T18:05:02Z] More Output
[2020-06-16T18:05:02Z] Finished in 2 minutes 14.7 seconds (files took 4.8 seconds to load)
[2020-06-16T18:05:02Z] \u001B[31m119 examples, 1 failure, 2 pending\u001B[0m
[2020-06-16T18:05:02Z]
[2020-06-16T18:05:02Z] Failed examples:
[2020-06-16T18:05:02Z]
[2020-06-16T18:05:02Z] \u001B[31mrspec ./spec/request/main_controller_spec.rb:6\u001B[0m \u001B[36m# ClientController responds with a 404 when an unknown JSON endpoint is hit\u001B[0m
[2020-06-16T18:05:02Z]
[2020-06-16T18:05:02Z] Randomized with seed 47060
[2020-06-16T18:05:02Z]
[2020-06-16T18:05:04Z] More Output
`;

    expect(extractFailedRspecExamples(mockLogContent)).toEqual([
      "./spec/request/main_controller_spec.rb:6",
    ]);
  });

  it("returns many matches", () => {
    const mockLogContent = `
[2020-06-16T18:05:02Z] More Output
[2020-06-16T18:05:02Z] Finished in 2 minutes 14.7 seconds (files took 4.8 seconds to load)
[2020-06-16T18:05:02Z] \u001B[31m119 examples, 1 failure, 2 pending\u001B[0m
[2020-06-16T18:05:02Z]
[2020-06-16T18:05:02Z] Failed examples:
[2020-06-16T18:05:02Z]
[2020-06-16T18:05:02Z] \u001B[31mrspec ./spec/flaky_1_spec.rb:6\u001B[0m \u001B[36m# Flaky spec 1\u001B[0m
[2020-06-16T18:05:02Z] \u001B[31mrspec ./spec/flaky_2_spec.rb:34\u001B[0m \u001B[36m# Flaky spec 2\u001B[0m
[2020-06-16T18:05:02Z]
[2020-06-16T18:05:02Z] Randomized with seed 47060
[2020-06-16T18:05:02Z]
[2020-06-16T18:05:04Z] More Output
`;
    expect(extractFailedRspecExamples(mockLogContent)).toEqual([
      "./spec/flaky_1_spec.rb:6",
      "./spec/flaky_2_spec.rb:34",
    ]);
  });
});
