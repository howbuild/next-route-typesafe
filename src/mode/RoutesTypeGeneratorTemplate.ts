import {extractLink, getNextJsPageExtensions, findPathIncludeFileFromCurrentPath} from '../utils';
import chalk from 'chalk';
import packageJson from '../../package.json';

export interface NextJsService {
  serviceName: string;
  link: string;
  pagePath: string;
  rootPath: string;
}

interface GenerateNextJsRoutesTypeOverridingDeclareProps {
  generatedTypeName: string;
  linkTypeDeclareFileName: string;
  internalTypeName?: string;
}

export interface WriteNextRoutesTypeProps {
  nextJsServicesInfo: NextJsService[];
  packageName: string;
  generateNextJsRoutesTypeOverridingDeclare: (props: GenerateNextJsRoutesTypeOverridingDeclareProps) => string;
}

export interface WriteLinkTypeProps {
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

  private generateNextJsServicesInfo(paths: string[], basePath: string): NextJsService[] {
    return paths.map((path) => {
      const rootPath = findPathIncludeFileFromCurrentPath(path, 'next.config.js');

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
  protected abstract writeNextRoutesType(props: WriteNextRoutesTypeProps): void;

  /**
   * 전체 프로젝트 page하위의 path를 추출하여 link type을 만듦
   */
  protected abstract writeLinkType(props: WriteLinkTypeProps): void;

  public write(paths: string[], config: RoutesTypeGeneratorConfig) {
    const nextJsServicesInfo = this.generateNextJsServicesInfo(paths, config.basePath);
    const packageName = packageJson.name;

    try {
      this.writeNextRoutesType({
        packageName,
        nextJsServicesInfo,
        generateNextJsRoutesTypeOverridingDeclare: this.generateNextJsRoutesTypeOverridingDeclare,
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

  private generateNextJsRoutesTypeOverridingDeclare({
    generatedTypeName,
    linkTypeDeclareFileName,
    internalTypeName,
  }: GenerateNextJsRoutesTypeOverridingDeclareProps) {
    return `\
// prettier-ignore
declare module 'next/link' {
  import type {ComponentProps} from 'react';
        
  import { ${generatedTypeName} } from '${linkTypeDeclareFileName}';
  import NextLink, {LinkProps as NextLinkProps} from 'next/dist/client/link';
        
  export * from 'next/dist/client/link';
        
  export interface LinkProps extends Omit<ComponentProps<typeof NextLink>, 'href'> {
    href: ${internalTypeName};
  }
    
  declare function Link(props: LinkProps): ReturnType<typeof NextLink>;
  
  export default Link;
}
  
// prettier-ignore
declare module 'next/router' {
  import type {${generatedTypeName}} from '${linkTypeDeclareFileName}';
  import type {NextRouter as OriginalNextRouter, SingletonRouter} from 'next/dist/client/router';
  import OriginalRouter from 'next/dist/client/router';
        
  export * from 'next/dist/client/router';

  interface OverridingRouterType {
    push: (route: ${internalTypeName}) => ReturnType<OriginalNextRouter['push']>;
    replace: (
      route: ${internalTypeName},
    ) => ReturnType<OriginalNextRouter['replace']>;
    prefetch: (
      route: ${internalTypeName},
    ) => ReturnType<OriginalNextRouter['prefetch']>;
  }
  
  interface Router
    extends Omit<SingletonRouter, 'push' | 'replace' | 'prefetch'>,
      OverridingRouterType {}

  export interface NextRouter
    extends Omit<OriginalNextRouter, 'push' | 'replace' | 'prefetch'>,
      OverridingRouterType {}

  declare const _default: Router;
  export default _default;
  export declare function useRouter(): NextRouter;
}
`;
  }
}
