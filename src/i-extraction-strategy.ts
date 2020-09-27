import { IFlakyTestInfo } from "./i-flaky-test-info";

export default interface IExtractionStrategy {
  extract: (createdAtFrom: string, createdAtTo: string) => Promise<IFlakyTestInfo[]>;
}
