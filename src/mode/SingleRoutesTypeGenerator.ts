import {RoutesTypeGeneratorTemplate, WriteRoutesTypeProps} from './RoutesTypeGeneratorTemplate';
import fs from 'fs';

interface GenerateLinkTypeDeclareProps {
  packageName: string;
  links: string[];
  isStrict: boolean;
}

export class SingleRoutesTypeGenerator extends RoutesTypeGeneratorTemplate {
  private LINK_TYPE_NAME = 'LinkTypes';
  private LINK_TYPE_DECLARE_NAME = 'routes.d.ts';
  private NEXT_ROUTES_OVERRIDING_TYPE_NAME = 'next-routes-overriding.d.ts';

  /**
   * @Override
   */
  protected writeNextRoutesType({packageName}: WriteRoutesTypeProps): void {
    const template = this.generateRoutesTypeWithUtilDeclare(packageName);

    fs.writeFileSync(`${process.cwd()}/${this.NEXT_ROUTES_OVERRIDING_TYPE_NAME}`, template);
  }

  /**
   * @Override
   */
  protected writeLinkType({packageName, nextJsServicesInfo, config}: WriteRoutesTypeProps): void {
    const links = nextJsServicesInfo.map((nextJsServiceInfo) => nextJsServiceInfo.link);

    const template = this.generateLinkTypeDeclare({
      packageName,
      links,
      isStrict: Boolean(config.isStrict),
    });

    fs.writeFileSync(`${process.cwd()}/${this.LINK_TYPE_DECLARE_NAME}`, template);
  }

  private generateLinkTypeDeclare({packageName, links, isStrict}: GenerateLinkTypeDeclareProps) {
    return `\
// prettier-ignore
/* eslint-disable */
declare module '${packageName}' {
  import type { Link } from "${packageName}/dist/src/types"
  
  export * from "${packageName}/dist/src/types"

  export type ${this.LINK_TYPE_NAME} = (${links.map((link) => `Link<'${link}', ${isStrict}>`).join(' | ')})

  export function generateInternalLink<K extends RouteType>(routes: ${this.LINK_TYPE_NAME}, origin?: string): ${
      this.LINK_TYPE_NAME
    };
  export function generateExternalLink(link: string): ${this.LINK_TYPE_NAME};
}
`;
  }

  private generateRoutesTypeWithUtilDeclare(packageName: string) {
    return `\
/* eslint-disable */
// prettier-ignore
declare module 'next/link' {
  import type {ComponentProps} from 'react';
        
  import { ${this.LINK_TYPE_NAME} } from '${packageName}';
  import NextLink, {LinkProps as NextLinkProps} from 'next/dist/client/link';
        
  export * from 'next/dist/client/link';
        
  export interface LinkProps extends Omit<ComponentProps<typeof NextLink>, 'href'> {
    href: ${this.LINK_TYPE_NAME};
  }
    
  declare function Link(props: LinkProps): ReturnType<typeof NextLink>;
  
  export default Link;
}
  
// prettier-ignore
declare module 'next/router' {
  import type { ${this.LINK_TYPE_NAME} } from '${packageName}';
  import type {NextRouter as OriginalNextRouter, SingletonRouter} from 'next/dist/client/router';
  import OriginalRouter from 'next/dist/client/router';
        
  export * from 'next/dist/client/router';

  interface OverridingRouterType {
    push: (route: ${this.LINK_TYPE_NAME}) => ReturnType<OriginalNextRouter['push']>;
    replace: (
      route: ${this.LINK_TYPE_NAME},
    ) => ReturnType<OriginalNextRouter['replace']>;
    prefetch: (
      route: ${this.LINK_TYPE_NAME},
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
