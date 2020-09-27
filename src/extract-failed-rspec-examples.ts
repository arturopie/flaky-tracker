function extractFailedRspecExamples(logOutputContent: string): string[] {
  const rspecSummaryOutput = extractRspecSummary(logOutputContent);

  const specFileRegex = /rspec (.*:\d*).*#/g;
  let specFileMatch;
  const flakySpecOccurrences: string[] = [];

  while ((specFileMatch = specFileRegex.exec(rspecSummaryOutput))) {
    flakySpecOccurrences.push(specFileMatch[1]);
  }
  return flakySpecOccurrences;
}

function extractRspecSummary(logOutputContent: string): string {
  const rspecSummaryRegex = /Failed examples:([\s\S]*)^.*seed/gm;
  const rspecSummaryMatch = rspecSummaryRegex.exec(logOutputContent);

  if (rspecSummaryMatch) {
    return rspecSummaryMatch[1];
  } else {
    return "";
  }
}

export default extractFailedRspecExamples;
