import {RoutesTypeGeneratorTemplate, WriteRoutesTypeProps} from './RoutesTypeGeneratorTemplate';
import fs from 'fs';
import {generateAbsolutePath, generateNextJsRoutesTypeOverridingDeclare} from '../utils';

interface GenerateLinkTypeDeclareProps {
  packageName: string;
  links: string[];
  isStrict: boolean;
}

export class SingleRoutesTypeGenerator extends RoutesTypeGeneratorTemplate {
  private LINK_TYPE_NAME = 'GeneratedLinkTypes';
  private LINK_TYPE_DECLARE_NAME = 'routes.d.ts';
  private NEXT_ROUTES_OVERRIDING_TYPE_NAME = 'next-routes-overriding.d.ts';

  /**
   * nextjs 프로젝트 root에 next/link, next/router overriding type을 만들 함수
   */
  protected writeNextRoutesType(packageName: string): void {
    const template = this.generateRoutesTypeWithUtilDeclare(packageName);

    fs.writeFileSync(generateAbsolutePath(this.NEXT_ROUTES_OVERRIDING_TYPE_NAME), template);
  }

  /**
   * 전체 프로젝트 page하위의 path를 추출하여 link type을 만들 함수
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

  /**
   * @Override
   */
  protected writeRoutesTypeDeclare({packageName, nextJsServicesInfo, config}: WriteRoutesTypeProps): void {
    this.writeNextRoutesType(packageName);
    this.writeLinkType({packageName, nextJsServicesInfo, config});
  }

  private generateLinkTypeDeclare({packageName, links, isStrict}: GenerateLinkTypeDeclareProps) {
    const GENERATED_LINK_MODEL_TYPE_NAME = `${this.LINK_TYPE_NAME}WithLinkModel`;

    return `\
// prettier-ignore
/* eslint-disable */
declare module '${packageName}' {
  import type { Link, LinkModel, PathParams } from "${packageName}/dist/lib/types"
  
  export * from "${packageName}/dist/lib/types"

  type ExternalLink = ${this.LINK_TYPE_NAME} & ""
  
  export type ${GENERATED_LINK_MODEL_TYPE_NAME} = (${links
      .map((link) => `LinkModel<'${link}', ${isStrict}>`)
      .join(' | ')})

  export type ${this.LINK_TYPE_NAME} = ${links.map((link) => `'${link}'`).join(' | ')}
  

  // export function generateInternalLink(routes: ${GENERATED_LINK_MODEL_TYPE_NAME}, origin?: string): ${
      this.LINK_TYPE_NAME
    };
  export function generateInternalLink(routes: ${this.LINK_TYPE_NAME}, origin?: string): ${this.LINK_TYPE_NAME};
  export function generateInternalLink(routes: string, origin?: string): ${this.LINK_TYPE_NAME};

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
