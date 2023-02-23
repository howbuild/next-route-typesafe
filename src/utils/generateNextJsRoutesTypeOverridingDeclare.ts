export interface GenerateNextJsRoutesTypeOverridingDeclareProps {
  generatedTypeName: string;
  linkTypeDeclareFileName: string;
  internalTypeName?: string;
}

export const generateNextJsRoutesTypeOverridingDeclare = ({
  generatedTypeName,
  linkTypeDeclareFileName,
  internalTypeName,
}: GenerateNextJsRoutesTypeOverridingDeclareProps) => {
  return `\
/* eslint-disable */
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
  
  import {UrlObject} from 'url';
  
  import type {
    NextRouter as OriginalNextRouter,
    SingletonRouter as OriginalSingletonRouter,
  } from 'next/dist/client/router';
  
  import OriginalRouter from 'next/dist/client/router';
        
  export * from 'next/dist/client/router';
  
  type Url = UrlObject | string;
  
  interface OverridingRouterType {
    push: (
      route: ${internalTypeName},
      as?: Url,

      // TODO: 타입없음
      options?: TransitionOptions,

    ) => ReturnType<OriginalNextRouter['push']>;
    replace: (
      route: ${internalTypeName},
      as?: Url,

      // TODO: 타입없음
      options?: TransitionOptions,

    ) => ReturnType<OriginalNextRouter['replace']>;
    prefetch: (
      route: ${internalTypeName},
      as?: Url,

      // TODO: 타입없음
      options?: TransitionOptions,
      
    ) => ReturnType<OriginalNextRouter['prefetch']>;
  }
  
  export interface NextRouter
    extends Omit<OriginalNextRouter, 'push' | 'replace' | 'prefetch'>,
      OverridingRouterType {}
  
  interface SingletonRouter extends Omit<OriginalSingletonRouter, 'router'> {
    router: NextRouter;
  }
  
  declare const _default: SingletonRouter;
  export default _default;
  export declare function useRouter(): NextRouter;
}
`;
};
