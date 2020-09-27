import IExtractionStrategy from "./i-extraction-strategy";
import { IFlakyTestInfo } from "./i-flaky-test-info";
import { IBuildkiteApi, JobInfo } from "./i-buildkite-api";
import flatten from "./flatten";
import extractFailedRspecExamples from "./extract-failed-rspec-examples";

export default class FlakyJobsOutput implements IExtractionStrategy {
  private readonly buildkiteApi;

  constructor(buildkiteApi: IBuildkiteApi) {
    this.buildkiteApi = buildkiteApi;
  }

  async extract(createdAtFrom: string, createdAtTo: string): Promise<IFlakyTestInfo[]> {
    return await extractFlakyTests(createdAtFrom, createdAtTo, this.buildkiteApi);
  }
}

async function extractFlakyTests(
  createdAtFrom: string,
  createdAtTo: string,
  buildkiteApi: IBuildkiteApi,
): Promise<IFlakyTestInfo[]> {
  const flakyFailedJobs = await getFlakyFailedJobs(createdAtFrom, createdAtTo);
  return await getFlakyRspecExamples(flakyFailedJobs);

  async function getFlakyFailedJobs(createdAtFrom: string, createdAtTo: string) {
    return await buildkiteApi.findFailedJobsInPassedBuilds({
      createdAtFrom: createdAtFrom,
      createdAtTo: createdAtTo,
      first: 500,
    });
  }

  async function getFlakyRspecExamples(flakyFailedJobs: JobInfo[]): Promise<IFlakyTestInfo[]> {
    const result = await Promise.all(
      flakyFailedJobs.map(extractFailedRspecExamplesFromJobLog(buildkiteApi)),
    );
    return flatten(result);
  }
}

function getJobLogOutput(buildkiteApi: IBuildkiteApi, oneFlakyFailedJob): Promise<string> {
  return buildkiteApi.getJobLogOutput(oneFlakyFailedJob);
}

function extractFailedRspecExamplesFromJobLog(buildkiteApi: IBuildkiteApi) {
  return async (jobIdentifier) => {
    const logOutputContent = await getJobLogOutput(buildkiteApi, jobIdentifier);

    const examples = extractFailedRspecExamples(logOutputContent);

    if (examples.length === 0) {
      console.log(`INFO: No example found on Flaky Job: ${jobIdentifier.jobUrl}`);
    }

    return examples.map((spec) => ({
      flakySpec: spec,
      jobUrl: jobIdentifier.jobUrl,
      occurredAt: jobIdentifier.finishedAt,
    }));
  };
}
