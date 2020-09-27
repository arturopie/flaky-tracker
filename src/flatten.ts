function flatten<T>(arrayOfArrays: T[][]): T[] {
  return arrayOfArrays.reduce((acc, val) => acc.concat(val), []);
}

export default flatten;
