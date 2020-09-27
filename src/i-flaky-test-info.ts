export interface IFlakyTestInfo {
  flakySpec: string;
  occurredAt: string;
  jobUrl: string;
}

export function flakyTestInfoEquality(item1: IFlakyTestInfo, item2: IFlakyTestInfo): boolean {
  return (
    item1.flakySpec === item2.flakySpec &&
    item1.occurredAt === item2.occurredAt &&
    item1.jobUrl === item2.jobUrl
  );
}
