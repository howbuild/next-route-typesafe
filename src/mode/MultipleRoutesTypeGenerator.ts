import path from 'path';
import fs from 'fs';
import {RoutesTypeGeneratorTemplate, WriteLinkTypeProps, WriteNextRoutesTypeProps} from './RoutesTypeGeneratorTemplate';

interface GenerateRoutesTypeWithUtilDeclareProps {
  packageName: string;
  linkTypeReferencePath: string;
  nextJsServiceName: string;
  nextJsRoutesTypeDeclareTemplate: string;
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
  protected writeNextRoutesType({
    packageName,
    nextJsServicesInfo,
    generateNextJsRoutesTypeOverridingDeclare,
  }: WriteNextRoutesTypeProps): void {
    const serviceRootPathMapping = nextJsServicesInfo.reduce((group, nextJsServiceInfo) => {
      group[nextJsServiceInfo.serviceName] = nextJsServiceInfo.rootPath;
      return group;
    }, {} as Record<string, string>);

    Object.entries(serviceRootPathMapping).forEach(([nextJsServiceName, rootPath]) => {
      const relativePath = path.relative(rootPath, process.cwd());
      fs.writeFileSync(
        `${rootPath}/${this.NEXT_ROUTES_OVERRIDING_TYPE_NAME}`,
        this.generateRoutesTypeWithUtilDeclare({
          packageName,
          linkTypeReferencePath: `${relativePath}/${this.LINK_TYPE_DECLARE_NAME}`,
          nextJsServiceName,
          nextJsRoutesTypeDeclareTemplate: generateNextJsRoutesTypeOverridingDeclare({
            generatedTypeName: this.LINK_TYPE_NAME,
            internalTypeName: `${this.LINK_TYPE_NAME}['${nextJsServiceName}']`,
            linkTypeDeclareFileName: this.LINK_TYPE_DECLARE_NAME,
          }),
        }),
      );
    });
  }

  /**
   * @Override
  
   */
  protected writeLinkType({packageName, nextJsServicesInfo, config}: WriteLinkTypeProps): void {
    const serviceLinkMapping = nextJsServicesInfo.reduce((group, nextJsServiceInfo) => {
      group[nextJsServiceInfo.serviceName] = group[nextJsServiceInfo.serviceName] || [];
      group[nextJsServiceInfo.serviceName].push(nextJsServiceInfo.link);
      return group;
    }, {} as Record<string, string[]>);

    const template = this.generateLinkTypeDeclare({
      packageName,
      serviceLinkMapping,
      isStrict: Boolean(config.isStrict),
    });

    fs.writeFileSync(`${process.cwd()}/${this.LINK_TYPE_DECLARE_NAME}`, template);
  }

  private generateRoutesTypeWithUtilDeclare({
    packageName,
    linkTypeReferencePath,
    nextJsServiceName,
    nextJsRoutesTypeDeclareTemplate,
  }: GenerateRoutesTypeWithUtilDeclareProps) {
    return `\
/// <reference path='${linkTypeReferencePath}' />
/* eslint-disable */
// prettier-ignore
declare module '${packageName}' {
  import {${this.LINK_TYPE_NAME}} from '${this.LINK_TYPE_DECLARE_NAME}';

  type ServiceName = keyof ${this.LINK_TYPE_NAME};

  export type Routes<K extends ServiceName> = ${this.LINK_TYPE_NAME}[K];

  export function generateInternalLink(routes: ${this.LINK_TYPE_NAME}['${nextJsServiceName}'], origin?: string): string;
  export function generateServiceLink(
    env: any,
  ): <K extends ServiceName>(type: K, routes: ${this.LINK_TYPE_NAME}[K]) => string;

  export function generateExternalLink(link: string): ${this.LINK_TYPE_NAME};
}

${nextJsRoutesTypeDeclareTemplate}
`;
  }

  private generateLinkTypeDeclare({packageName, serviceLinkMapping, isStrict}: GenerateLinkTypeDeclareProps) {
    return `\
// prettier-ignore
/* eslint-disable */
declare module '${this.LINK_TYPE_DECLARE_NAME}' {
  import type { Link } from "${packageName}/dist/src/types"

  export type ${this.LINK_TYPE_NAME} = {
    ${Object.keys(serviceLinkMapping).map((key) => {
      return [`'${key}'`, serviceLinkMapping[key].map((link) => `Link<'${link}', ${isStrict}>`).join(' | ')].join(':');
    })}
  }
}
`;
  }
}
