import {LinkProps} from './types';
import {isEqual} from './utils';

/**
 * @example
 * return "/project/2?a=query"
 * generateInternalLink({pathname: "/project/[no]", query:{no:2, a:"query"}})
 *
 * return "/project?no=2&a=query"
 * generateInternalLink({pathname: "/project", query:{no:2, a:"query"}})
 *
 * return "https://dev-www.howbuild.com/project/2?a=query"
 * generateInternalLink({pathname: "/project/[no]", query:{no:2, a:"query"}}, "https://dev-www.howbuild.com")
 *
 * return "/auth/user"
 * generateInternalLink("/auth/user")
 */
export const generateInternalLink = (linkProps: LinkProps, origin?: string) => {
  if (typeof linkProps === 'string') return linkProps;
  if (!linkProps.query) return linkProps.pathname;

  const {query, pathname} = linkProps;

  const pathParamRegex = /\[(.*?)]/g;

  /**
   * pathname중 path param에 해당하는 값을 data.query에서 찾아서 반영
   * @example
   * return "/154/stw/progress"
   * data: { pathname:"/[no]/[test]/progress", query:{no:154, test:"stw", q1:1, q2:2}
   */
  const pathWithParamValue = pathname.replace(pathParamRegex, (_, key: keyof typeof query) => {
    if (!query) return '';
    return query[key] as string;
  });

  /**
   * query중 path param이외의 query값들을 querystring으로 convert
   * @example
   * return "/154/test5/progress?q1=1&q2=2"
   * data: { pathname:"/[no]/[test]/progress", query:{no:154, test:"test5", q1:1, q2:2} }
   */
  const queryString = Object.keys(query)
    .reduce((total, key) => {
      const isPathParamMatch = pathname.match(pathParamRegex)?.some(isEqual(`[${key}]`));

      return isPathParamMatch ? total : `${total}&${key}=${query[key]}`;
    }, '')
    .slice(1);

  const pathWithoutBaseInput = queryString ? pathWithParamValue.concat(`?${queryString}`) : pathWithParamValue;

  const path = origin ? `${origin}${pathWithoutBaseInput}` : pathWithoutBaseInput;

  return path;
};
