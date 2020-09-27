import flakyFinder from "./flaky-finder";
import { ArtifactFlakyInfo, IBuildkiteApi, JobInfo } from "./i-buildkite-api";
import { IFlakyTestStore } from "./i-flaky-test-store";
import FlakyJobsOutput from "./flaky-jobs-output";
import AggregateArtifact from "./aggregate-artifact";
import arrayContaining = jasmine.arrayContaining;

describe("flakyFinder", () => {
  describe("when using the FlakyJobsOutput strategy", () => {
    it("saves all failed examples from flaky jobs on the batch", async () => {
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
      const buildkiteApi = new BuildkiteApiMock({
        jobUrls: ["https://joburl"],
        logContentResponse: mockLogContent,
      });

      const store = new FlakyTestStoreMock();
      const spy = jest.spyOn(store, "appendFlakyTests");

      await flakyFinder(new FlakyJobsOutput(buildkiteApi), store);

      expect(spy).toHaveBeenCalledWith([
        {
          flakySpec: "./spec/flaky_1_spec.rb:6",
          jobUrl: "https://joburl",
          occurredAt: "2020-06-30T00:00:00Z",
        },
        {
          flakySpec: "./spec/flaky_2_spec.rb:34",
          jobUrl: "https://joburl",
          occurredAt: "2020-06-30T00:00:00Z",
        },
      ]);
    });
  });

  describe("when using the AggregateArtifact strategy", () => {
    it("saves all failed examples from flaky artifact info on the batch", async () => {
      const buildkiteApi = new BuildkiteApiMock({
        jobUrls: ["https://joburl"],
        artifactContent: [
          {
            name: "ApplicationHelper data tags #feature_flag_data_tag escapes script contents",
            file: "./spec/unit/helpers/application_helper_spec.rb",
            job_id: "0869a546-0195-4211-bcf0-5c756b04a2d1",
          },
          {
            name: "Some other spec",
            file: "./other_spec.rb",
            job_id: "deadbeef-0195-4211-bcf0-5c756b04a2d1",
          },
        ],
      });

      const store = new FlakyTestStoreMock();
      const spy = jest.spyOn(store, "appendFlakyTests");

      await flakyFinder(new AggregateArtifact(buildkiteApi), store);

      expect(spy).toHaveBeenCalledWith(
        arrayContaining([
          {
            flakySpec: "./spec/unit/helpers/application_helper_spec.rb",
            jobUrl: "https://joburl",
            occurredAt: "2020-06-30T00:00:00Z",
          },
          {
            flakySpec: "./other_spec.rb",
            jobUrl: "https://joburl",
            occurredAt: "2020-06-30T00:00:00Z",
          },
        ]),
      );
    });

    it("saves all failed examples from flaky artifact info on more than one job", async () => {
      const buildkiteApi = new BuildkiteApiMock({
        jobUrls: ["https://joburl1", "https://joburl2"],
        artifactContent: [
          {
            name: "Some other spec",
            file: "./other_spec.rb",
            job_id: "deadbeef-0195-4211-bcf0-5c756b04a2d1",
          },
        ],
      });

      const store = new FlakyTestStoreMock();
      const spy = jest.spyOn(store, "appendFlakyTests");

      await flakyFinder(new AggregateArtifact(buildkiteApi), store);

      expect(spy).toHaveBeenCalledWith(
        arrayContaining([
          {
            flakySpec: "./other_spec.rb",
            jobUrl: "https://joburl1",
            occurredAt: "2020-06-30T00:00:00Z",
          },
          {
            flakySpec: "./other_spec.rb",
            jobUrl: "https://joburl2",
            occurredAt: "2020-06-30T00:00:00Z",
          },
        ]),
      );
    });
  });
});

class FlakyTestStoreMock implements IFlakyTestStore {
  appendFlakyTests = (): Promise<void> => Promise.resolve();
}

class BuildkiteApiMock implements IBuildkiteApi {
  readonly buildNumberResponse = 123;
  readonly jobIdResponse = "ABC";
  private readonly artifactContent: ArtifactFlakyInfo[];
  private readonly logContentResponse: string;
  private readonly jobUrls: string[];

  constructor({
    artifactContent = [],
    logContentResponse = "",
    jobUrls,
  }: {
    artifactContent?: ArtifactFlakyInfo[];
    logContentResponse?: string;
    jobUrls: string[];
  }) {
    this.artifactContent = artifactContent;
    this.logContentResponse = logContentResponse;
    this.jobUrls = jobUrls;
  }

  findFailedJobsInPassedBuilds(): Promise<JobInfo[]> {
    const result = this.jobUrls.map((jobUrl) => ({
      buildNumber: this.buildNumberResponse,
      jobId: this.jobIdResponse,
      jobUrl: jobUrl,
      finishedAt: "2020-06-30T00:00:00Z",
    }));

    return Promise.resolve(result);
  }

  getJobLogOutput({ buildNumber, jobId }): Promise<string> {
    if (this.buildNumberResponse != buildNumber || this.jobIdResponse != jobId) {
      throw `Expected buildNumber ${this.buildNumberResponse} and jobId '${this.jobIdResponse}'
       but got ${buildNumber} and '${jobId}'`;
    }
    const content = this.logContentResponse;
    return new Promise(function (resolve) {
      resolve(content);
    });
  }

  getAllPassingBuildsWithFlakyArtifact(): Promise<JobInfo[]> {
    return this.findFailedJobsInPassedBuilds();
  }

  getFlakyInfoFromArtifact(): Promise<ArtifactFlakyInfo[]> {
    return Promise.resolve(this.artifactContent);
  }
}
