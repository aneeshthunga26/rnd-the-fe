import { useSearchParams } from "@solidjs/router";
import type { Accessor } from "solid-js";

export type SortDir = "asc" | "desc";

export interface UrlQueryParams {
  /** Page size (rows per page). */
  first: number;
  /** Row offset into the full server-side list. */
  offset: number;
  /** Active sort, if any. */
  sortBy?: { key: string; desc: boolean };
  /** Raw (string) filter values, keyed by filter name. Screens map these to a typed filter. */
  filterBy: Record<string, string>;
}

export interface UseUrlQueryParams {
  /** The list params derived from the URL — pass to a server-side list query. */
  queryParams: Accessor<UrlQueryParams>;
  /** Table-style pagination view of the URL state. */
  pagination: Accessor<{ pageIndex: number; pageSize: number }>;
  /** Set the current page by 0-based index. */
  setPage: (pageIndex: number) => void;
  /** Set the page size (resets to the first page). */
  setPageSize: (pageSize: number) => void;
  /** Active sort, if any. */
  sort: Accessor<{ key: string; dir: SortDir } | undefined>;
  /** Toggle/select the sort column (same key toggles direction). */
  setSort: (key: string) => void;
  /** Read a single filter value. */
  getFilter: (key: string) => string | undefined;
  /** Set (or, with `undefined`/empty, clear) a filter value; resets to page 1. */
  setFilter: (key: string, value?: string) => void;
}

// URL param names owned by the hook itself; everything else is treated as a filter.
const RESERVED = new Set(["page", "pageSize", "sort", "dir"]);

/**
 * Owns the stocktake list's UI state in the URL search params so it is shareable
 * and survives back/forward. Maps the URL to the server-side list params.
 *
 * URL params: `page` (1-indexed), `pageSize`, `sort`, `dir`, plus one param per
 * filter key. `offset = (page - 1) * pageSize`. Changing a filter resets to page 1.
 */
export function useUrlQueryParams(opts?: {
  initialSort?: { key: string; dir: SortDir };
  pageSize?: number;
}): UseUrlQueryParams {
  const defaultPageSize = opts?.pageSize ?? 20;
  const [params, setParams] = useSearchParams();

  const one = (v: string | string[] | undefined): string | undefined =>
    Array.isArray(v) ? v[0] : v;

  const pageSize = () => {
    const n = Number(one(params.pageSize));
    return Number.isFinite(n) && n > 0 ? n : defaultPageSize;
  };
  const page = () => {
    const n = Number(one(params.page));
    return Number.isFinite(n) && n >= 1 ? n : 1;
  };

  const sort = () => {
    const key = one(params.sort) ?? opts?.initialSort?.key;
    if (!key) return undefined;
    const dir = ((one(params.dir) as SortDir) ?? opts?.initialSort?.dir ?? "asc") as SortDir;
    return { key, dir };
  };

  const filterBy = (): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const key of Object.keys(params)) {
      if (RESERVED.has(key)) continue;
      const v = one(params[key]);
      if (v != null && v !== "") out[key] = v;
    }
    return out;
  };

  const pagination = () => ({ pageIndex: page() - 1, pageSize: pageSize() });

  const queryParams = (): UrlQueryParams => {
    const s = sort();
    return {
      first: pageSize(),
      offset: (page() - 1) * pageSize(),
      sortBy: s ? { key: s.key, desc: s.dir === "desc" } : undefined,
      filterBy: filterBy(),
    };
  };

  const setPage = (pageIndex: number) => {
    setParams({ page: pageIndex <= 0 ? undefined : String(pageIndex + 1) });
  };
  const setPageSize = (n: number) => {
    setParams({ pageSize: n === defaultPageSize ? undefined : String(n), page: undefined });
  };
  const setSort = (key: string) => {
    const current = sort();
    const nextDir: SortDir = current?.key === key && current.dir === "asc" ? "desc" : "asc";
    setParams({ sort: key, dir: nextDir });
  };
  const getFilter = (key: string) => one(params[key]);
  const setFilter = (key: string, value?: string) => {
    setParams({ [key]: value == null || value === "" ? undefined : value, page: undefined });
  };

  return { queryParams, pagination, setPage, setPageSize, sort, setSort, getFilter, setFilter };
}
