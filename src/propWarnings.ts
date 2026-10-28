import { DEFAULT_LENGTH, resolveLength } from './core/cells';
import { filterText } from './core/chars';
import { normalizeDigits } from './core/digits';
import { validGroups } from './core/groups';
import type { CodeType } from './types';

interface WarnedProps {
  length?: number;
  type?: CodeType;
  groups?: readonly number[];
  value?: string;
  defaultValue?: string;
}

export function propWarnings(props: WarnedProps): string[] {
  const warnings: string[] = [];
  const length = resolveLength(props.length);
  const type = props.type ?? 'numeric';
  if (props.length !== undefined && length !== props.length) {
    warnings.push(
      `length ${props.length} is not a positive integer, so the field uses ${DEFAULT_LENGTH}`,
    );
  }
  if (props.groups && !validGroups(props.groups, length)) {
    const sum = props.groups.reduce((total, size) => total + size, 0);
    const groups = JSON.stringify(props.groups);
    warnings.push(
      props.groups.every((size) => Number.isInteger(size) && size > 0)
        ? `groups ${groups} add up to ${sum}, not ${length}, so no separators show`
        : `groups ${groups} must be positive integers, so no separators show`,
    );
  }
  for (const name of ['value', 'defaultValue'] as const) {
    const text = props[name];
    if (text === undefined) continue;
    const kept = filterText(normalizeDigits(text), type);
    if (kept.length !== Array.from(normalizeDigits(text)).length) {
      warnings.push(
        `${name} "${text}" has characters that type ${String(type)} rejects, so the field drops them`,
      );
    }
    if (kept.length > length) {
      warnings.push(
        `${name} "${text}" is longer than length ${length}, so the field keeps the first ${length} characters`,
      );
    }
  }
  return warnings;
}
