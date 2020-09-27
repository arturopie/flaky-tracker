import { IFlakyTestStore } from "./i-flaky-test-store";
import { flakyTestInfoEquality, IFlakyTestInfo } from "./i-flaky-test-info";
import { S3 } from "aws-sdk";
import startOfWeek from "./startOfWeek";
import arrayUnion from "./arrayUnion";

export default class S3Store implements IFlakyTestStore {
  private readonly bucket: string;
  private readonly account: string;
  private readonly pipeline: string;
  private s3: S3;

  constructor(bucket: string, account: string, pipeline: string) {
    this.bucket = bucket;
    this.account = account;
    this.pipeline = pipeline;
    this.s3 = new S3({ apiVersion: "2006-03-01" });
  }

  async appendFlakyTests(flakyTests: IFlakyTestInfo[]): Promise<void> {
    const byWeek = groupBy(flakyTests, (test) => startOfWeek(test.occurredAt));

    Array.from(byWeek.entries()).map(async ([week, flakyTestsGroup]) => {
      const previousData = await this.getStoreDataForTheWeek(week);

      const flakyTestInfos = arrayUnion(previousData, flakyTestsGroup, flakyTestInfoEquality);
      await this.putStoreDataForTheWeek(flakyTestInfos, week);
    });
  }

  async putStoreDataForTheWeek(flakyTestInfos: IFlakyTestInfo[], week: string): Promise<void> {
    const params = {
      Body: JSON.stringify(flakyTestInfos),
      ServerSideEncryption: "AES256",
      ContentType: "application/json",
      ...this.s3ObjectParams(week),
    };

    await this.s3.putObject(params).promise();
  }

  async getAccountConfig(): Promise<{ buildkite_api_key: string }> {
    const params = {
      Bucket: this.bucket,
      Key: `${this.account}/config.json`,
    };

    return await this.s3GetObject(params);
  }

  async getStoreDataForTheWeek(week: string): Promise<IFlakyTestInfo[]> {
    const params = this.s3ObjectParams(week);

    try {
      return await this.s3GetObject(params);
    } catch (e) {
      if (e.code === "NoSuchKey") {
        return [];
      } else {
        throw e;
      }
    }
  }

  private async s3GetObject(params: { Bucket: string; Key: string }) {
    const data = await this.s3.getObject(params).promise();

    if (data.Body === undefined) {
      throw `Error: Couldn't retrieve data for key ${params.Key}. The S3 object body was undefined`;
    }

    return JSON.parse(data.Body.toString());
  }

  private s3ObjectParams(week) {
    return {
      Bucket: this.bucket,
      Key: `flaky-occurrences/${this.account}/${this.pipeline}/${week}.json`,
    };
  }
}

function groupBy<T>(list: T[], keyGetter: (T) => string) {
  const map = new Map();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}
