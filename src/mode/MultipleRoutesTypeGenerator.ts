import path from 'path';
import fs from 'fs';
import {RoutesTypeGeneratorTemplate, WriteRoutesTypeProps} from './RoutesTypeGeneratorTemplate';
import {generateAbsolutePath, generateNextJsRoutesTypeOverridingDeclare} from '../utils';

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
   * nextjs 프로젝트 root에 next/link, next/router overriding type을 만들 함수
   */
  protected writeNextRoutesType(
    packageName: WriteRoutesTypeProps['packageName'],
    nextJsServicesInfo: WriteRoutesTypeProps['nextJsServicesInfo'],
  ): void {
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
   * 전체 프로젝트 page하위의 path를 추출하여 link type을 만들 함수
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

    fs.writeFileSync(generateAbsolutePath(this.LINK_TYPE_DECLARE_NAME), typeDeclareTemplate);
  }

  /**
   * @Override
   */
  protected writeRoutesTypeDeclare({packageName, nextJsServicesInfo, config}: WriteRoutesTypeProps): void {
    this.writeNextRoutesType(packageName, nextJsServicesInfo);
    this.writeLinkType({packageName, nextJsServicesInfo, config});
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
    env: Record<ServiceName, string>,
  ): <K extends ServiceName>(type: K, routes: ${this.LINK_TYPE_NAME}[K]) => GenerateLinkReturnType;

  export function generateExternalLink(link: string): GenerateLinkReturnType;
}
${generateNextJsRoutesTypeOverridingDeclare({
  generatedTypeName: this.LINK_TYPE_NAME,
  internalTypeName: serviceLinkTypeName,
  linkTypeDeclareFileName: this.LINK_TYPE_DECLARE_NAME,
})}
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
