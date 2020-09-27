import { IBuildkiteJobsQuery } from "./buildkite-api";
import { JobInfo } from "./i-buildkite-api";
import flatten from "./flatten";

function extractJobsWithFlakyArtifactsInfo(data: IBuildkiteJobsQuery): JobInfo[] {
  const result = data.pipeline.builds.edges.map((buildEdge) => {
    return extractJobsAndFlakyArtifactsInfo(buildEdge);
  });

  return flatten(result).filter((jobInfo) => jobInfo.flakyInfoArtifactUrl !== null);
}

function extractJobsAndFlakyArtifactsInfo(buildEdge): JobInfo[] {
  const buildNumber = buildEdge.node.number;
  return buildEdge.node.jobs.edges.map((jobEdge) => {
    const result = {
      buildNumber: buildNumber,
      jobId: jobEdge.node.uuid,
      jobUrl: jobEdge.node.url,
      finishedAt: jobEdge.node.finishedAt,
    };

    return { ...result, flakyInfoArtifactUrl: getFlakyInfoArtifactUrl(jobEdge) };
  });
}

function getFlakyInfoArtifactUrl(jobEdge) {
  const artifactEdges = jobEdge.node.artifacts.edges;

  const flakyArtifactEdge = artifactEdges.find(
    (edge) => edge.node.path == "tmp/non-deterministic-and-failures.json",
  );

  return flakyArtifactEdge ? flakyArtifactEdge.node.downloadURL : null;
}

export default extractJobsWithFlakyArtifactsInfo;
