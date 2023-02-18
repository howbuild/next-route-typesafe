import {isEqual} from './isEqual';

/**
 * 주어진 path로부터 pages/ 디렉토리 하위를 탐색해서 link를 추출
 * @param path 추출할 대상(apps/pages/production/[detail]/index.tsx 형태)
 * @example
 * return "/production/[detail]/index.tsx"
 * extractLink("src/pages/production/[detail]/index.tsx")
 */
export const extractLink = (path: string) => {
  const pathSegments = path.split('/');
  const pageDirectoryIndex = pathSegments.findIndex(isEqual('pages'));

  const link = pathSegments.slice(pageDirectoryIndex + 1).join('/');

  return link;
};
