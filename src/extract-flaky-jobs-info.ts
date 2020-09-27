import { JobInfo } from "./i-buildkite-api";
import { IBuildkiteJobsQuery } from "./buildkite-api";
import flatten from "./flatten";

function extractFlakyJobsInfo(data: IBuildkiteJobsQuery): JobInfo[] {
  const result = data.pipeline.builds.edges.map((buildEdge) => {
    return extractFlakyJobsOnBuild(buildEdge);
  });

  return flatten(result);
}

function extractFlakyJobsOnBuild(buildEdge) {
  const buildNumber = buildEdge.node.number;
  return buildEdge.node.jobs.edges.map((jobEdge) => {
    const result = {
      buildNumber: buildNumber,
      jobId: jobEdge.node.uuid,
      jobUrl: jobEdge.node.url,
      finishedAt: jobEdge.node.finishedAt,
    };

    return { ...result };
  });
}

export default extractFlakyJobsInfo;
