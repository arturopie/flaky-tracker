export interface JobInfo {
  buildNumber: number;
  jobId: string;
  jobUrl: string;
  finishedAt: string;
  flakyInfoArtifactUrl?: string;
}

export interface ArtifactFlakyInfo {
  name: string;
  file: string;
  job_id: string;
}

export interface IBuildkiteApi {
  getJobLogOutput: ({ buildNumber, jobId }: JobInfo) => Promise<string>;

  findFailedJobsInPassedBuilds(param: {
    createdAtFrom: string;
    createdAtTo: string;
    first: number;
  }): Promise<JobInfo[]>;

  getAllPassingBuildsWithFlakyArtifact(param: {
    createdAtFrom: string;
    createdAtTo: string;
    first: number;
  }): Promise<JobInfo[]>;

  getFlakyInfoFromArtifact(url: string): Promise<ArtifactFlakyInfo[]>;
}
