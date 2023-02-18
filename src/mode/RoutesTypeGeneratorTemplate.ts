import fs from 'fs';
import {extractLink, getNextJsPageExtensions} from '../utils';
import chalk from 'chalk';
import packageJson from '../../package.json';

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

export interface RoutesTypeGeneratorConfig {
  isStrict: boolean;
  basePath: string;
}

export abstract class RoutesTypeGeneratorTemplate {
  /**
   * path에있는 nextjs serivce의 pageExtensions을 읽어와서 regex를 만듦
   */
  private getNextJsPageExtensionsRegex(path: string) {
    return new RegExp(
      `(index)?\\.(${getNextJsPageExtensions(path)
        .map((extension: any) => extension)
        .join('|')})`,
    );
  }

  private findPathIncludeFileFromCurrentPath(currentPath: string, targetFile: string): string {
    if (!currentPath) return '';
    if (fs.existsSync(`${currentPath}/${targetFile}`)) return currentPath;
    return this.findPathIncludeFileFromCurrentPath(currentPath.split('/').slice(0, -1).join('/'), targetFile);
  }

  private generateNextJsServicesInfo(paths: string[], basePath: string): NextJsService[] {
    return paths.map((path) => {
      const rootPath = this.findPathIncludeFileFromCurrentPath(path, 'next.config.js');

      return {
        serviceName: rootPath.replace(basePath, '').split('/').join('/'),
        rootPath,
        pagePath: path,
        link: `/${extractLink(path).replace(this.getNextJsPageExtensionsRegex(rootPath), '').replace(/\/$/, '')}`,
      };
    });
  }

  /**
   * nextjs 프로젝트 root에 next/link, next/router overriding type을 만듦
   */
  protected abstract writeNextRoutesType(props: WriteRoutesTypeProps): void;

  /**
   * 전체 프로젝트 page하위의 path를 추출하여 link type을 만듦
   */
  protected abstract writeLinkType(props: WriteRoutesTypeProps): void;

  public write(paths: string[], config: RoutesTypeGeneratorConfig) {
    const nextJsServicesInfo = this.generateNextJsServicesInfo(paths, config.basePath);
    const packageName = packageJson.name;

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
