export default function (rawDate: string): string {
  const date = new Date(rawDate);
  const diff = date.getDate() - date.getDay();
  const result = new Date(date.setDate(diff));

  return result.toISOString().substring(0, 10);
}
