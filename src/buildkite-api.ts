import axios, { AxiosInstance } from "axios";
import { GraphQLClient } from "graphql-request";
import { ArtifactFlakyInfo, IBuildkiteApi, JobInfo } from "./i-buildkite-api";
import extractFlakyJobsInfo from "./extract-flaky-jobs-info";
import extractJobsWithFlakyArtifactsInfo from "./extract-jobs-with-flaky-artifacts-info";
import fetch from "node-fetch";

// polyfilling Headers for node
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.Headers = global.Headers || fetch.Headers;

class BuildkiteApi implements IBuildkiteApi {
  private axiosInstance: AxiosInstance;
  private graphQLClient: GraphQLClient;
  private readonly pipelineSlug: string;

  constructor(params: { pipelineSlug; buildkiteApiKey }) {
    this.pipelineSlug = params.pipelineSlug;
    this.axiosInstance = axios.create({ headers: BuildkiteApi.apiHeaders(params.buildkiteApiKey) });

    this.graphQLClient = new GraphQLClient("https://graphql.buildkite.com/v1", {
      headers: BuildkiteApi.apiHeaders(params.buildkiteApiKey),
    });
  }

  getJobLogOutput({ buildNumber, jobId }: JobInfo): Promise<string> {
    const organization = this.pipelineSlug.split("/")[0];
    const pipeline = this.pipelineSlug.split("/")[1];
    const url = `https://api.buildkite.com/v2/organizations/${organization}/pipelines/${pipeline}/builds/${buildNumber}/jobs/${jobId}/log`;

    const getData = async (url) => {
      const response = await this.axiosInstance.get(url);
      return response.data.content;
    };
    return getData(url);
  }

  async findFailedJobsInPassedBuilds(param: {
    createdAtFrom: string;
    createdAtTo: string;
    first: number;
  }): Promise<JobInfo[]> {
    const variables = {
      first: param.first,
      createdAtFrom: param.createdAtFrom,
      createdAtTo: param.createdAtTo,
      slug: this.pipelineSlug,
    };

    const query = /* GraphQL */ `
      query($slug: ID!, $first: Int, $createdAtFrom: DateTime, $createdAtTo: DateTime) {
        pipeline(slug: $slug) {
          builds(
            first: $first
            state: [PASSED, BLOCKED]
            createdAtFrom: $createdAtFrom
            createdAtTo: $createdAtTo
          ) {
            edges {
              cursor
              node {
                branch
                number
                url
                createdAt
                jobs(order: RECENTLY_ASSIGNED, first: 100, type: COMMAND, passed: false) {
                  edges {
                    node {
                      ... on JobTypeCommand {
                        finishedAt
                        uuid
                        label
                        command
                        url
                        exitStatus
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `;

    const data: IBuildkiteJobsQuery = await this.graphQLClient.request(query, variables);

    if (data.pipeline.builds.pageInfo.hasNextPage) {
      throw "There was more pages, but pagination has not been implemented";
    }
    return extractFlakyJobsInfo(data);
  }

  async getAllPassingBuildsWithFlakyArtifact(param: {
    createdAtFrom: string;
    createdAtTo: string;
    first: number;
  }): Promise<JobInfo[]> {
    const variables = {
      first: param.first,
      createdAtFrom: param.createdAtFrom,
      createdAtTo: param.createdAtTo,
      slug: this.pipelineSlug,
    };

    const query = /* GraphQL */ `
      query($slug: ID!, $first: Int, $createdAtFrom: DateTime, $createdAtTo: DateTime) {
        pipeline(slug: $slug) {
          builds(
            createdAtFrom: $createdAtFrom
            createdAtTo: $createdAtTo
            first: $first
            state: [PASSED, BLOCKED]
          ) {
            edges {
              cursor
              node {
                finishedAt
                number
                jobs(order: RECENTLY_ASSIGNED, first: 100, type: COMMAND, passed: true) {
                  edges {
                    node {
                      ... on JobTypeCommand {
                        exitStatus
                        finishedAt
                        url
                        uuid
                        artifacts(first: 500) {
                          edges {
                            node {
                              downloadURL
                              path
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `;

    const data: IBuildkiteJobsQuery = await this.graphQLClient.request(query, variables);

    if (data.pipeline.builds.pageInfo.hasNextPage) {
      throw "There was more pages, but pagination has not been implemented";
    }

    return extractJobsWithFlakyArtifactsInfo(data);
  }

  private static apiHeaders(buildkiteApiKey) {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${buildkiteApiKey}`,
    };
  }

  async getFlakyInfoFromArtifact(url: string): Promise<ArtifactFlakyInfo[]> {
    const response = await axios.get(url);
    return response.data;
  }
}

export interface IBuildkiteJobsQuery {
  pipeline: IPipeline;
}

interface IPipeline {
  builds: IBuildConnection;
}

interface IBuildConnection {
  edges: IBuildEdge[];
  pageInfo: IPageInfo;
}

interface IPageInfo {
  hasNextPage: boolean;
}

interface IBuildEdge {
  node: IBuild;
}

interface IBuild {
  jobs: IJobConnection;
  number: number;
}

interface IJob {
  uuid: string;
  url: string;
  finishedAt: string;
  artifacts?: IArtifactConnection;
}

interface IJobEdge {
  node: IJob;
}

interface IJobConnection {
  edges: IJobEdge[];
}

interface IArtifact {
  path: string;
  downloadURL: string;
}

interface IArtifactEdge {
  node: IArtifact;
}

interface IArtifactConnection {
  edges: IArtifactEdge[];
}

export default BuildkiteApi;
