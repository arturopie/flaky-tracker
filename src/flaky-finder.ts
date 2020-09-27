import { IFlakyTestStore } from "./i-flaky-test-store";
import { IFlakyTestInfo } from "./i-flaky-test-info";
import IExtractionStrategy from "./i-extraction-strategy";

export default async function (
  extractionStrategy: IExtractionStrategy,
  store: IFlakyTestStore,
): Promise<void> {
  const createdAtTo = new Date().toISOString();
  const createdAtFrom = subtractDays(createdAtTo, 2);

  const flakyRspecExamples = await extractionStrategy.extract(createdAtFrom, createdAtTo);

  await saveFlakyRspecExamples(store, flakyRspecExamples);
}

function subtractDays(createdAtTo: string, days: number) {
  const createdAtFromD = new Date(createdAtTo);
  createdAtFromD.setDate(createdAtFromD.getDate() - days);
  return createdAtFromD.toISOString();
}

async function saveFlakyRspecExamples(store, flakyRspecExamples: IFlakyTestInfo[]) {
  await store.appendFlakyTests(flakyRspecExamples);
}
