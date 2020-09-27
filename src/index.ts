"use strict";
import "source-map-support/register";
import flakyFinder from "./flaky-finder";
import BuildkiteApi from "./buildkite-api";
import S3Store from "./s3-store";
import FlakyJobsOutput from "./flaky-jobs-output";
import AggregateArtifact from "./aggregate-artifact";
import IExtractionStrategy from "./i-extraction-strategy";

export function flakyJobsOutputStrategy(buildkiteApi: BuildkiteApi): IExtractionStrategy {
  return new FlakyJobsOutput(buildkiteApi);
}

export function aggregateArtifactStrategy(buildkiteApi: BuildkiteApi): IExtractionStrategy {
  return new AggregateArtifact(buildkiteApi);
}

export default async function extractFlakySpec(
  bucket: string,
  account: string,
  pipeline: string,
  pipelineSlug: string,
  flakyJobsExtractionStrategy: (buildkiteApi: BuildkiteApi) => IExtractionStrategy,
): Promise<void> {
  const s3Store = new S3Store(bucket, account, pipeline);
  const data = await s3Store.getAccountConfig();
  const buildkiteApi = new BuildkiteApi({
    pipelineSlug: pipelineSlug,
    buildkiteApiKey: data.buildkite_api_key,
  });
  await flakyFinder(flakyJobsExtractionStrategy(buildkiteApi), s3Store);
}
