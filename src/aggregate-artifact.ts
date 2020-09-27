import IExtractionStrategy from "./i-extraction-strategy";
import { IFlakyTestInfo } from "./i-flaky-test-info";
import { IBuildkiteApi, JobInfo } from "./i-buildkite-api";
import flatten from "./flatten";

export default class AggregateArtifact implements IExtractionStrategy {
  private readonly buildkiteApi;

  constructor(buildkiteApi: IBuildkiteApi) {
    this.buildkiteApi = buildkiteApi;
  }

  async extract(createdAtFrom: string, createdAtTo: string): Promise<IFlakyTestInfo[]> {
    const jobsWithFlakyArtifactInfo = await this.buildkiteApi.getAllPassingBuildsWithFlakyArtifact({
      createdAtFrom,
      createdAtTo,
      first: 500,
    });

    return await this.getFlakyInfo(jobsWithFlakyArtifactInfo);
  }

  private async getFlakyInfo(jobsWithFlakyArtifactInfo: JobInfo[]): Promise<IFlakyTestInfo[]> {
    const result = await Promise.all(
      jobsWithFlakyArtifactInfo.map(async (job) => this.extractFlakyTestInfoFromArtifact(job)),
    );
    return flatten(result);
  }

  private async extractFlakyTestInfoFromArtifact(job) {
    const flakyInfo = await this.buildkiteApi.getFlakyInfoFromArtifact(job.flakyInfoArtifactUrl);

    return flakyInfo.map((AFlakyInfo) => ({
      flakySpec: AFlakyInfo.file,
      occurredAt: job.finishedAt,
      jobUrl: job.jobUrl,
    }));
  }
}
