import fs from 'fs';
import {isEqual, getConfig} from '../utils';
import chalk from 'chalk';
import {NextConfig} from 'next';
import path from 'path';

export interface NextJsService {
  serviceName: string;
  link: string;
  pagePath: string;
  rootPath: string;
}

export interface WriteRoutesTypeProps {
  nextJsServicesInfo: NextJsService[];
  packageName: string;
  config: RoutesTypeGeneratorConfig;
}

interface RoutesTypeGeneratorConfig {
  isStrict: boolean;
  basePath: string;
}

export abstract class RoutesTypeGeneratorTemplate {
  /**
   * path에있는 next.config.js의 pageExtensions을 읽어온 후 regex로 변환하여 return
   */
  private getNextJsPageExtensionsRegex(inputPath: string) {
    const nextJsConfig = getConfig<NextConfig>(path.join(inputPath, 'next.config.js'));
    const nextJsPageExtensions = nextJsConfig?.pageExtensions ?? ['tsx', 'jsx', 'ts', 'js'];

    return new RegExp(`(index)?\\.(${nextJsPageExtensions.map((extension) => extension).join('|')})`);
  }

  /**
   * currentPath로부터 path를 한단계식 줄여가며 targetFile을 찾고 그 path를 return하는 함수
   * @example
   * return "a/b/c/"
   * currentPath="a/b/c/d/e/f", targetFile:next.config.js(a/b/c/에 있다면)
   */
  private findPathIncludeFileFromCurrentPath(currentPath: string, targetFile: string): string {
    if (!currentPath) return '';
    if (fs.existsSync(`${currentPath}/${targetFile}`)) return currentPath;
    return this.findPathIncludeFileFromCurrentPath(currentPath.split('/').slice(0, -1).join('/'), targetFile);
  }

  /**
   * 주어진 path로부터 link를 추출
   * @param path 추출할 대상(apps/pages/production/[detail]/index.tsx 형태)
   * @example
   * return "/production/[detail]/index.tsx"
   * extractLink("src/pages/production/[detail]/index.tsx")
   */
  private extractLink(path: string) {
    const pathSegments = path.split('/');
    const pageDirectoryIndex = pathSegments.findIndex(isEqual('pages'));

    const link = pathSegments.slice(pageDirectoryIndex + 1).join('/');

    return link;
  }

  private generateNextJsServicesInfo(paths: string[], basePath: string): NextJsService[] {
    return paths.map((path) => {
      const rootPath = this.findPathIncludeFileFromCurrentPath(path, 'next.config.js');

      return {
        serviceName: rootPath.replace(basePath, '').split('/').join('/'),
        rootPath,
        pagePath: path,
        link: `/${this.extractLink(path).replace(this.getNextJsPageExtensionsRegex(rootPath), '').replace(/\/$/, '')}`,
      };
    });
  }

  /**
   * nextjs 프로젝트 root에 next/link, next/router overriding type을 만들 함수
   */
  protected abstract writeNextRoutesType(props: WriteRoutesTypeProps): void;

  /**
   * 전체 프로젝트 page하위의 path를 추출하여 link type을 만들 함수
   */
  protected abstract writeLinkType(props: WriteRoutesTypeProps): void;

  public write(paths: string[], config: RoutesTypeGeneratorConfig) {
    const nextJsServicesInfo = this.generateNextJsServicesInfo(paths, config.basePath);
    const packageName = 'next-route-typesafe';

    try {
      this.writeNextRoutesType({
        packageName,
        nextJsServicesInfo,
        config,
      });

      this.writeLinkType({
        packageName,
        nextJsServicesInfo,
        config,
      });
    } catch (error) {
      console.log(chalk.red(`write function error: ${error}`));
      process.exit(-1);
    }
  }
}
