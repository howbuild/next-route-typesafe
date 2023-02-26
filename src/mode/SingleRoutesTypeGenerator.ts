import {RoutesTypeGeneratorTemplate, WriteRoutesTypeProps} from './RoutesTypeGeneratorTemplate';
import fs from 'fs';
import {generateAbsolutePath, generateNextJsRoutesTypeOverridingDeclare} from '../utils';

interface GenerateLinkTypeDeclareProps {
  packageName: string;
  links: string[];
  isStrict: boolean;
}

export class SingleRoutesTypeGenerator extends RoutesTypeGeneratorTemplate {
  private LINK_TYPE_NAME = 'LinkUrlTypes';
  private LINK_TYPE_DECLARE_NAME = 'routes.d.ts';
  private NEXT_ROUTES_OVERRIDING_TYPE_NAME = 'next-routes-overriding.d.ts';

  /**
   * nextjs 프로젝트 root에 next/link, next/router overriding type을 만들 함수
   */
  protected writeNextRoutesType(packageName: string, isStrict: boolean): void {
    const template = this.generateRoutesTypeWithUtilDeclare(packageName, isStrict);

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
    this.writeNextRoutesType(packageName, config.isStrict);
    this.writeLinkType({packageName, nextJsServicesInfo, config});
  }

  private generateLinkTypeDeclare({packageName, links, isStrict}: GenerateLinkTypeDeclareProps) {
    return `\
// prettier-ignore
/* eslint-disable */
declare module '${packageName}' {
  import {UrlObject} from 'url';
  export * from 'next-route-typesafe/dist/lib/types';

  type ParamValue = string | number | boolean;

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

  export type ${this.LINK_TYPE_NAME} = (${links.map((link) => `'${link}'`).join(' | ')})

  export type LinkHrefProp<Path extends ${this.LINK_TYPE_NAME}, CustomPath extends string> = 
    | Path
    | CustomPath
    | OverridingLinkHref<Path, CustomPath>;

  export function generateInternalLink<
    Path extends ${this.LINK_TYPE_NAME},
    CustomPath extends string
  >(routes: LinkHrefProp<Path, ${isStrict ? 'Path' : 'CustomPath'}>, origin?: string): LinkHrefProp<Path, ${
      isStrict ? 'Path' : 'CustomPath'
    }> & string;

  // export function generateExternalLink<P extends string>(
  //   link: P,
  // ): P;
}
`;
  }

  private generateRoutesTypeWithUtilDeclare(packageName: string, isStrict: boolean) {
    return generateNextJsRoutesTypeOverridingDeclare({
      linkTypeDeclareFileName: packageName,
      generatedTypeName: this.LINK_TYPE_NAME,
      internalTypeName: this.LINK_TYPE_NAME,
      isStrict,
    });
  }
}
