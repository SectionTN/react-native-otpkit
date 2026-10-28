export function validGroups(groups: readonly number[], length: number): boolean {
  return (
    groups.every((size) => Number.isInteger(size) && size > 0) &&
    groups.reduce((sum, size) => sum + size, 0) === length
  );
}

export function separatorsAfter(
  groups: readonly number[] | undefined,
  length: number,
): ReadonlySet<number> {
  const after = new Set<number>();
  if (!groups || !validGroups(groups, length)) return after;
  let end = 0;
  for (const size of groups.slice(0, -1)) {
    end += size;
    after.add(end - 1);
  }
  return after;
}
