import fs from 'fs';

export const findPathIncludeFileFromCurrentPath = (currentPath: string, targetFile: string): string => {
  if (!currentPath) return '';
  if (fs.existsSync(`${currentPath}/${targetFile}`)) return currentPath;
  return findPathIncludeFileFromCurrentPath(currentPath.split('/').slice(0, -1).join('/'), targetFile);
};
