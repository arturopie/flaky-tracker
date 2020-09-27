import extractFlakyJobsInfo from "./extract-flaky-jobs-info";
import objectContaining = jasmine.objectContaining;
import arrayContaining = jasmine.arrayContaining;

describe("extractFlakyJobsInfo", () => {
  it("returns empty array when no build", () => {
    const data = {
      pipeline: {
        builds: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
    };

    expect(extractFlakyJobsInfo(data)).toEqual([]);
  });

  it("returns empty array when no flaky jobs", () => {
    const data = {
      pipeline: {
        builds: {
          edges: [
            {
              node: {
                finishedAt: "2020-06-28T10:10:04Z",
                number: 7277,
                jobs: {
                  edges: [],
                },
              },
            },
            {
              node: {
                finishedAt: "2020-06-26T20:12:35Z",
                number: 7274,
                jobs: {
                  edges: [],
                },
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
    };

    expect(extractFlakyJobsInfo(data)).toEqual([]);
  });

  it("returns job info when there is a flaky job", () => {
    const data = {
      pipeline: {
        builds: {
          edges: [
            {
              node: {
                finishedAt: "2020-06-28T10:10:04Z",
                number: 7277,
                jobs: {
                  edges: [
                    {
                      node: {
                        uuid: "ca09f47f-24b8-4f6e-a383-3d8243b020f6",
                        url:
                          "https://buildkite.com/company/todoapp/builds/7175#ca09f47f-24b8-4f6e-a383-3d8243b020f6",
                        finishedAt: "2020-07-30T00:00:00Z",
                      },
                    },
                  ],
                },
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
    };

    expect(extractFlakyJobsInfo(data)).toEqual(
      arrayContaining([
        objectContaining({
          buildNumber: 7277,
          jobId: "ca09f47f-24b8-4f6e-a383-3d8243b020f6",
          jobUrl:
            "https://buildkite.com/company/todoapp/builds/7175#ca09f47f-24b8-4f6e-a383-3d8243b020f6",
          finishedAt: "2020-07-30T00:00:00Z",
        }),
      ]),
    );
  });

  it("returns job info when there is 2 flaky jobs on the same build", () => {
    const data = {
      pipeline: {
        builds: {
          edges: [
            {
              node: {
                number: 7277,
                jobs: {
                  edges: [
                    {
                      node: {
                        uuid: "job1",
                        url: "https://buildkite.com/company/todoapp/builds/7175#job1",
                        finishedAt: "2020-06-01T10:10:04Z",
                      },
                    },
                    {
                      node: {
                        uuid: "job2",
                        url: "https://buildkite.com/company/todoapp/builds/7175#job2",
                        finishedAt: "2020-06-30T10:10:04Z",
                      },
                    },
                  ],
                },
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
    };

    expect(extractFlakyJobsInfo(data)).toEqual(
      arrayContaining([
        objectContaining({
          buildNumber: 7277,
          jobId: "job1",
          jobUrl: "https://buildkite.com/company/todoapp/builds/7175#job1",
          finishedAt: "2020-06-01T10:10:04Z",
        }),
        objectContaining({
          buildNumber: 7277,
          jobId: "job2",
          jobUrl: "https://buildkite.com/company/todoapp/builds/7175#job2",
          finishedAt: "2020-06-30T10:10:04Z",
        }),
      ]),
    );
  });

  it("returns job info when there is 1 flaky jobs on 2 different builds", () => {
    const data = {
      pipeline: {
        builds: {
          edges: [
            {
              node: {
                number: 7277,
                jobs: {
                  edges: [
                    {
                      node: {
                        uuid: "job1",
                        url: "https://buildkite.com/company/todoapp/builds/7175#job1",
                        finishedAt: "2020-06-01T10:10:04Z",
                      },
                    },
                  ],
                },
              },
            },
            {
              node: {
                number: 7278,
                jobs: {
                  edges: [
                    {
                      node: {
                        uuid: "job2",
                        url: "https://buildkite.com/company/todoapp/builds/7175#job2",
                        finishedAt: "2020-06-30T10:10:04Z",
                      },
                    },
                  ],
                },
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
    };

    expect(extractFlakyJobsInfo(data)).toEqual(
      arrayContaining([
        objectContaining({
          buildNumber: 7277,
          jobId: "job1",
          jobUrl: "https://buildkite.com/company/todoapp/builds/7175#job1",
          finishedAt: "2020-06-01T10:10:04Z",
        }),
        objectContaining({
          buildNumber: 7278,
          jobId: "job2",
          jobUrl: "https://buildkite.com/company/todoapp/builds/7175#job2",
          finishedAt: "2020-06-30T10:10:04Z",
        }),
      ]),
    );
  });
});
