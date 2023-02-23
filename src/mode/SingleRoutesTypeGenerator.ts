import {RoutesTypeGeneratorTemplate, WriteRoutesTypeProps} from './RoutesTypeGeneratorTemplate';
import fs from 'fs';
import {generateAbsolutePath, generateNextJsRoutesTypeOverridingDeclare} from '../utils';

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

    fs.writeFileSync(generateAbsolutePath(this.NEXT_ROUTES_OVERRIDING_TYPE_NAME), template);
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

    fs.writeFileSync(generateAbsolutePath(this.LINK_TYPE_DECLARE_NAME), template);
  }

  private generateLinkTypeDeclare({packageName, links, isStrict}: GenerateLinkTypeDeclareProps) {
    return `\
// prettier-ignore
/* eslint-disable */
declare module '${packageName}' {
  import type { Link } from "${packageName}/dist/lib/types"
  
  export * from "${packageName}/dist/lib/types"

  type ExternalLink = ${this.LINK_TYPE_NAME} & ""
  export type ${this.LINK_TYPE_NAME} = (${links.map((link) => `Link<'${link}', ${isStrict}>`).join(' | ')})
  
  export function generateInternalLink<K extends RouteType>(routes: ${this.LINK_TYPE_NAME}, origin?: string): ${
      this.LINK_TYPE_NAME
    };
  export function generateExternalLink(link: string): ExternalLink;
}
`;
  }

  private generateRoutesTypeWithUtilDeclare(packageName: string) {
    return generateNextJsRoutesTypeOverridingDeclare({
      linkTypeDeclareFileName: packageName,
      generatedTypeName: this.LINK_TYPE_NAME,
      internalTypeName: this.LINK_TYPE_NAME,
    });
  }
}
