// arr1 and arr2 are arrays of any length; equalityFunc is a function which
// can compare two items and return true if they're equal and false otherwise
export default function <T>(
  arr1: T[],
  arr2: T[],
  equalityFunc: (item1: T, item2: T) => boolean,
): T[] {
  const union = arr1.concat(arr2);

  for (let i = 0; i < union.length; i++) {
    for (let j = i + 1; j < union.length; j++) {
      if (equalityFunc(union[i], union[j])) {
        union.splice(j, 1);
        j--;
      }
    }
  }

  return union;
}
