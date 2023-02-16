import {RoutesTypeGeneratorTemplate, WriteLinkTypeProps, WriteNextRoutesTypeProps} from './RoutesTypeGeneratorTemplate';
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
  protected writeNextRoutesType({
    packageName,
    generateNextJsRoutesTypeOverridingDeclare,
  }: WriteNextRoutesTypeProps): void {
    const template = this.generateRoutesTypeWithUtilDeclare(
      generateNextJsRoutesTypeOverridingDeclare({
        generatedTypeName: this.LINK_TYPE_NAME,
        internalTypeName: this.LINK_TYPE_NAME,
        linkTypeDeclareFileName: packageName,
      }),
    );

    fs.writeFileSync(`${process.cwd()}/${this.NEXT_ROUTES_OVERRIDING_TYPE_NAME}`, template);
  }

  /**
   * @Override
   */
  protected writeLinkType({packageName, nextJsServicesInfo, config}: WriteLinkTypeProps): void {
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
  
  export * from '${packageName}';

  export type ${this.LINK_TYPE_NAME} = (${links.map((link) => `Link<'${link}', ${isStrict}>`).join(' | ')})

  export function generateInternalLink<K extends RouteType>(routes: ${this.LINK_TYPE_NAME}, origin?: string): string;
  export function generateExternalLink(link: string): ${this.LINK_TYPE_NAME};
}
`;
  }

  private generateRoutesTypeWithUtilDeclare(nextJsRoutesTypeDeclareTemplate: string) {
    return `\
/* eslint-disable */
${nextJsRoutesTypeDeclareTemplate}
`;
  }
}
