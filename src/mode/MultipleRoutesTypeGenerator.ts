import path from 'path';
import fs from 'fs';
import {RoutesTypeGeneratorTemplate, WriteRoutesTypeProps} from './RoutesTypeGeneratorTemplate';
import {generateAbsolutePath, generateNextJsRoutesTypeOverridingDeclare} from '../utils';

interface GenerateRoutesTypeWithUtilDeclareProps {
  packageName: string;
  linkTypeReferencePath: string;
  nextJsServiceName: string;
  isStrict: boolean;
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
  protected writeNextRoutesType({packageName, nextJsServicesInfo, config}: WriteRoutesTypeProps): void {
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
        isStrict: config.isStrict,
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
      isStrict: config.isStrict,
    });

    fs.writeFileSync(generateAbsolutePath(this.LINK_TYPE_DECLARE_NAME), typeDeclareTemplate);
  }

  /**
   * @Override
   */
  protected writeRoutesTypeDeclare({packageName, nextJsServicesInfo, config}: WriteRoutesTypeProps): void {
    this.writeNextRoutesType({packageName, nextJsServicesInfo, config});
    this.writeLinkType({packageName, nextJsServicesInfo, config});
  }

  private generateRoutesTypeWithUtilDeclare({
    packageName,
    linkTypeReferencePath,
    nextJsServiceName,
    isStrict,
  }: GenerateRoutesTypeWithUtilDeclareProps) {
    const serviceLinkTypeName = `${this.LINK_TYPE_NAME}['${nextJsServiceName}']`;

    return `\
/// <reference path='${linkTypeReferencePath}' />
/* eslint-disable */
// prettier-ignore
declare module '${packageName}' {
  import { ${this.LINK_TYPE_NAME}, ServiceName, LinkHrefProp } from '${this.LINK_TYPE_DECLARE_NAME}';
  
  export * from 'next-route-typesafe/dist/lib/types';

  type GenerateLinkReturnType = ${serviceLinkTypeName} & string & {}

  export function generateInternalLink<
    Path extends ${serviceLinkTypeName},
    CustomPath extends string
  >(routes: LinkHrefProp<Path, ${isStrict ? 'Path' : 'CustomPath'}>, origin?: string): LinkHrefProp<Path, ${
      isStrict ? 'Path' : 'CustomPath'
    }> & string;

  export function generateServiceLink(
    env: Record<ServiceName, string>,
  ): <K extends ServiceName, CustomPath extends string, Path extends ${serviceLinkTypeName}>(
    type: K,
    routes: LinkHrefProp<Path, ${isStrict ? 'Path' : 'CustomPath'}>,
  ) => GenerateLinkReturnType;

  // export function generateExternalLink(link: string): GenerateLinkReturnType;
}
${generateNextJsRoutesTypeOverridingDeclare({
  generatedTypeName: this.LINK_TYPE_NAME,
  internalTypeName: serviceLinkTypeName,
  linkTypeDeclareFileName: this.LINK_TYPE_DECLARE_NAME,
  isStrict,
})}
`;
  }

  private generateLinkTypeDeclare({serviceLinkMapping, isStrict}: GenerateLinkTypeDeclareProps) {
    return `\
// prettier-ignore
/* eslint-disable */
declare module '${this.LINK_TYPE_DECLARE_NAME}' {
  import {ParsedUrlQueryInput} from 'querystring';
  import {UrlObject} from 'url';

  type ParamValue = ParsedUrlQueryInput[number];

  /**
   * union(|) 타입을 intersection(&) 타입으로 변경
   * @example
   * infer {a:1} & {b:1}
   * ConvertUnionToIntersection<{a:1} | {b:1}>
   */
  type ConvertUnionToIntersection<Union> = (
    Union extends any ? (k: Union) => void : never
  ) extends (k: infer Intersection) => void
    ? Intersection
    : never;

    
  /**
   * path에서 주어진 Divider를 기준으로 전부 split
   * @example
   * infer ['', 'test', '[id]', '[user]']
   * SplitByDivider<'/test/[id]/[user]', '/'>
   */
  type SplitByDivider<
    Path extends string,
    Divider extends string,
  > = Path extends \`\${infer LeftString}\${Divider}\${infer RightString}\` ? LeftString | SplitByDivider<RightString, Divider> : Path;

  /**
   * path에서 param을 추출
   * @example
   * infer 'id' | 'user'
   * ExtractPathParam<'[id]' | '[user]'>
   */
  type ExtractPathParam<SplittedPath extends string> = SplittedPath extends \`[\${infer PathParam}]\`
    ? PathParam
    : never;

  type DynamicQuery = Record<string, ParamValue>;

  type ParsePathParam<UnionPathParam extends string> = UnionPathParam extends \`\${infer PathParam}\`
    ? Record<PathParam, ParamValue>
    : undefined;

  export type PathParams<Path extends string> = ConvertUnionToIntersection<
    ParsePathParam<ExtractPathParam<SplitByDivider<Path, '/'>>>
  >;


  type OverridingLinkHref<Path extends string, CustomPath extends string> = (PathParams<CustomPath> extends Record<
    string,
    ParamValue
  >
    ? {
        query: PathParams<CustomPath> & DynamicQuery;
        pathname: CustomPath | Path;
      }
    : {
        query?: PathParams<CustomPath> & DynamicQuery;
        pathname: CustomPath | Path;
      }) &
    Omit<UrlObject, 'pathname' | 'query'>;
    
  export type LinkHrefProp<Path extends string, CustomPath extends string> = 
    | Path
    | CustomPath
    | OverridingLinkHref<Path, CustomPath>
    ${isStrict ? '' : '| UrlObject'};

  export type ${this.LINK_TYPE_NAME} = {
    ${Object.keys(serviceLinkMapping).map((key) => {
      return [`'${key}'`, serviceLinkMapping[key].map((link) => `'${link}'`).join(' | ')].join(':');
    })}
  }

  export type ServiceName = keyof ${this.LINK_TYPE_NAME};
}
`;
  }
}
