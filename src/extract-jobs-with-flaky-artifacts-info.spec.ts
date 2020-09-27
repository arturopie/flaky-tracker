import extractJobsWithFlakyArtifactsInfo from "./extract-jobs-with-flaky-artifacts-info";
import objectContaining = jasmine.objectContaining;

describe("extractJobsWithFlakyArtifactsInfo", () => {
  it("returns artifact info if there is artifacts on a job", () => {
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
                        artifacts: {
                          edges: [
                            {
                              node: {
                                path: "tmp/non-deterministic-and-failures.json",
                                downloadURL: "https://artifact-url",
                              },
                            },
                          ],
                        },
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

    expect(extractJobsWithFlakyArtifactsInfo(data)).toEqual([
      objectContaining({
        buildNumber: 7277,
        jobId: "ca09f47f-24b8-4f6e-a383-3d8243b020f6",
        jobUrl:
          "https://buildkite.com/company/todoapp/builds/7175#ca09f47f-24b8-4f6e-a383-3d8243b020f6",
        finishedAt: "2020-07-30T00:00:00Z",
        flakyInfoArtifactUrl: "https://artifact-url",
      }),
    ]);
  });

  it("does not return flaky artifact info when there are no artifacts on the job", () => {
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
                        artifacts: {
                          edges: [],
                        },
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

    expect(extractJobsWithFlakyArtifactsInfo(data)).toEqual([]);
  });

  it("returns the right flaky artifact info when there more than one artifacts on a job", () => {
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
                        artifacts: {
                          edges: [
                            {
                              node: {
                                path: "tmp/some-other-random-artifact.json",
                                downloadURL: "https://other-artifact-url",
                              },
                            },
                            {
                              node: {
                                path: "tmp/non-deterministic-and-failures.json",
                                downloadURL: "https://artifact-url",
                              },
                            },
                          ],
                        },
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

    expect(extractJobsWithFlakyArtifactsInfo(data)).toEqual([
      objectContaining({
        buildNumber: 7277,
        jobId: "ca09f47f-24b8-4f6e-a383-3d8243b020f6",
        jobUrl:
          "https://buildkite.com/company/todoapp/builds/7175#ca09f47f-24b8-4f6e-a383-3d8243b020f6",
        finishedAt: "2020-07-30T00:00:00Z",
        flakyInfoArtifactUrl: "https://artifact-url",
      }),
    ]);
  });

  it("only returns jobs with flaky artifacts", () => {
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
                        artifacts: {
                          edges: [
                            {
                              node: {
                                path: "tmp/some-other-random-artifact.json",
                                downloadURL: "https://other-artifact-url",
                              },
                            },
                          ],
                        },
                      },
                    },
                    {
                      node: {
                        uuid: "deadbeef-deadbeef-deadbeef-deadbeef-deadbeef",
                        url:
                          "https://buildkite.com/company/todoapp/builds/7175#deadbeef-deadbeef-deadbeef-deadbeef-deadbeef",
                        finishedAt: "2020-07-30T00:00:00Z",
                        artifacts: {
                          edges: [
                            {
                              node: {
                                path: "tmp/non-deterministic-and-failures.json",
                                downloadURL: "https://artifact-url",
                              },
                            },
                          ],
                        },
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

    expect(extractJobsWithFlakyArtifactsInfo(data)).toEqual([
      objectContaining({
        buildNumber: 7277,
        jobId: "deadbeef-deadbeef-deadbeef-deadbeef-deadbeef",
        jobUrl:
          "https://buildkite.com/company/todoapp/builds/7175#deadbeef-deadbeef-deadbeef-deadbeef-deadbeef",
        finishedAt: "2020-07-30T00:00:00Z",
        flakyInfoArtifactUrl: "https://artifact-url",
      }),
    ]);
  });
});
