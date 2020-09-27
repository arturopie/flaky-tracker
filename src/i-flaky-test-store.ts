import { IFlakyTestInfo } from "./i-flaky-test-info";

export interface IFlakyTestStore {
  appendFlakyTests: (flakyTests: IFlakyTestInfo[]) => Promise<void>;
}
