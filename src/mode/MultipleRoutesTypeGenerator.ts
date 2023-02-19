import path from 'path';
import fs from 'fs';
import {RoutesTypeGeneratorTemplate, WriteRoutesTypeProps} from './RoutesTypeGeneratorTemplate';

interface GenerateRoutesTypeWithUtilDeclareProps {
  packageName: string;
  linkTypeReferencePath: string;
  nextJsServiceName: string;
}

interface GenerateLinkTypeDeclareProps {
  packageName: string;
  serviceLinkMapping: Record<string, string[]>;
  isStrict: boolean;
}

export class MultipleRoutesType extends RoutesTypeGeneratorTemplate {
  private LINK_TYPE_NAME = 'InternalServiceLink';
  private LINK_TYPE_DECLARE_NAME = 'routes.d.ts';
  private NEXT_ROUTES_OVERRIDING_TYPE_NAME = 'routes-overriding.d.ts';

  /**
   * @Override
   */
  protected writeNextRoutesType({packageName, nextJsServicesInfo}: WriteRoutesTypeProps): void {
    const serviceRootPathMapping = nextJsServicesInfo.reduce((group, nextJsServiceInfo) => {
      group[nextJsServiceInfo.serviceName] = nextJsServiceInfo.rootPath;
      return group;
    }, {} as Record<string, string>);

    Object.entries(serviceRootPathMapping).forEach(([nextJsServiceName, rootPath]) => {
      const relativePath = path.relative(rootPath, process.cwd());
      const typeDeclareTemplate = this.generateRoutesTypeWithUtilDeclare({
        packageName,
        linkTypeReferencePath: `${relativePath}/${this.LINK_TYPE_DECLARE_NAME}`,
        nextJsServiceName,
      });

      fs.writeFileSync(`${rootPath}/${this.NEXT_ROUTES_OVERRIDING_TYPE_NAME}`, typeDeclareTemplate);
    });
  }

  /**
   * @Override
   */
  protected writeLinkType({packageName, nextJsServicesInfo, config}: WriteRoutesTypeProps): void {
    const serviceLinkMapping = nextJsServicesInfo.reduce((group, nextJsServiceInfo) => {
      group[nextJsServiceInfo.serviceName] = group[nextJsServiceInfo.serviceName] || [];
      group[nextJsServiceInfo.serviceName].push(nextJsServiceInfo.link);
      return group;
    }, {} as Record<string, string[]>);

    const typeDeclareTemplate = this.generateLinkTypeDeclare({
      packageName,
      serviceLinkMapping,
      isStrict: Boolean(config.isStrict),
    });

    fs.writeFileSync(`${process.cwd()}/${this.LINK_TYPE_DECLARE_NAME}`, typeDeclareTemplate);
  }

  private generateRoutesTypeWithUtilDeclare({
    packageName,
    linkTypeReferencePath,
    nextJsServiceName,
  }: GenerateRoutesTypeWithUtilDeclareProps) {
    const serviceLinkTypeName = `${this.LINK_TYPE_NAME}['${nextJsServiceName}']`;

    return `\
/// <reference path='${linkTypeReferencePath}' />
/* eslint-disable */
// prettier-ignore
declare module '${packageName}' {
  import { ${this.LINK_TYPE_NAME} } from '${this.LINK_TYPE_DECLARE_NAME}';

  type ServiceName = keyof ${this.LINK_TYPE_NAME};

  type GenerateLinkReturnType = ${serviceLinkTypeName} & string & {}

  export function generateInternalLink(
    routes: ${serviceLinkTypeName}, origin?: string
  ): ${serviceLinkTypeName};

  export function generateServiceLink(
    env: any,
  ): <K extends ServiceName>(type: K, routes: ${this.LINK_TYPE_NAME}[K]) => GenerateLinkReturnType;

  export function generateExternalLink(link: string): GenerateLinkReturnType;
}

// prettier-ignore
declare module 'next/link' {
  import type { ComponentProps } from 'react';
  import type { LinkType } from '${packageName}';
        
  import { ${this.LINK_TYPE_NAME} } from '${this.LINK_TYPE_DECLARE_NAME}';
  import NextLink, { LinkProps as NextLinkProps } from 'next/dist/client/link';
        
  export * from 'next/dist/client/link';
        
  export interface LinkProps extends Omit<ComponentProps<typeof NextLink>, 'href'> {
    href: ${serviceLinkTypeName};
  }
    
  declare function Link(props: LinkProps): ReturnType<typeof NextLink>;
  
  export default Link;
}
  
// prettier-ignore
declare module 'next/router' {
  import type { ${this.LINK_TYPE_NAME} } from '${this.LINK_TYPE_DECLARE_NAME}';
  import type { NextRouter as OriginalNextRouter, SingletonRouter } from 'next/dist/client/router';
  import OriginalRouter from 'next/dist/client/router';
        
  export * from 'next/dist/client/router';

  interface OverridingRouterType {
    push: (route: ${serviceLinkTypeName}) => ReturnType<OriginalNextRouter['push']>;
    replace: (
      route: ${serviceLinkTypeName},
    ) => ReturnType<OriginalNextRouter['replace']>;
    prefetch: (
      route: ${serviceLinkTypeName},
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

  private generateLinkTypeDeclare({packageName, serviceLinkMapping, isStrict}: GenerateLinkTypeDeclareProps) {
    return `\
// prettier-ignore
/* eslint-disable */
declare module '${this.LINK_TYPE_DECLARE_NAME}' {
  import type { Link } from "${packageName}/dist/lib/types"

  export type ${this.LINK_TYPE_NAME} = {
    ${Object.keys(serviceLinkMapping).map((key) => {
      return [`'${key}'`, serviceLinkMapping[key].map((link) => `Link<'${link}', ${isStrict}>`).join(' | ')].join(':');
    })}
  }
}
`;
  }
}
