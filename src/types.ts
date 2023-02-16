type ParamValue = string | number | boolean;
export interface LinkProps {
  pathname: string;
  query?: Record<string, ParamValue>;
}

/**
 * router.config.js에서 사용할 type
 */
export interface RouterConfig {
  basePath?: string;
  ignorePath?: string[];
  strict?: boolean;
  mode: 'monorepo' | 'single';
}

/**
 * union(|) 타입을 intersection(&) 타입으로 변경
 * @example
 * infer {a:1} & {b:1}
 * ConvertUnionToIntersection<{a:1} | {b:1}>
 */
type ConvertUnionToIntersection<Union> = (Union extends any ? (k: Union) => void : never) extends (
  k: infer Intersection,
) => void
  ? Intersection
  : never;

/**
 * path에서 주어진 Divider를 기준으로 전부 split
 * @example
 * infer ['', 'test', '[id]', '[user]']
 * SplitByDivider<'/test/[id]/[user]', '/'>
 */
type SplitByDivider<Path extends string, Divider extends string> = Path extends `${infer L}${Divider}${infer R}`
  ? L | SplitByDivider<R, Divider>
  : Path;

/**
 * path에서 param을 추출
 * @example
 * infer 'id' | 'user'
 * ExtractPathParam<'[id]' | '[user]'>
 */
type ExtractPathParam<SplittedPath extends string> = SplittedPath extends `[${infer PathParam}]` ? PathParam : never;

type DynamicQuery = Record<string, ParamValue>;

type ParsePathParam<UnionPathParam extends string> = UnionPathParam extends `${infer PathParam}`
  ? Record<PathParam, ParamValue>
  : undefined;

type PathParams<P extends string> = ConvertUnionToIntersection<
  ParsePathParam<ExtractPathParam<SplitByDivider<P, '/'>>>
>;

type LinkModel<Path extends string> = PathParams<Path> extends Record<string, ParamValue>
  ? {
      query: PathParams<Path> & DynamicQuery;
      pathname: Path;
    }
  : {
      query?: PathParams<Path> | DynamicQuery;
      pathname: Path;
    };

export type Link<Path extends string, Strict extends boolean> = Strict extends true
  ? PathParams<Path> extends Record<string, ParamValue>
    ? LinkModel<Path>
    : Path | LinkModel<Path>
  : // eslint-disable-next-line @typescript-eslint/ban-types
    LinkModel<Path> | Path | {};
