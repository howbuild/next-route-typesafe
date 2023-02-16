import {NextConfig} from 'next';
import path from 'path';
import {getConfig} from '../utils';

const defaultPageExtensions = ['tsx', 'jsx', 'ts', 'js'];

/**
 * next.config.js에서 정의된 pageExtensions를 return
 */
export const getNextJsPageExtensions = (projectPath: string) => {
  const nextJsConfig = getConfig<NextConfig>(path.join(projectPath, 'next.config.js'));
  return nextJsConfig?.pageExtensions ?? defaultPageExtensions;
};
