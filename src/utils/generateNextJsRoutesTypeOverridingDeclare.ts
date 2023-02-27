export interface GenerateNextJsRoutesTypeOverridingDeclareProps {
  generatedTypeName: string;
  linkTypeDeclareFileName: string;
  isStrict?: boolean;
  internalTypeName?: string;
}

export const generateNextJsRoutesTypeOverridingDeclare = ({
  generatedTypeName,
  linkTypeDeclareFileName,
  internalTypeName,
  isStrict = false,
}: GenerateNextJsRoutesTypeOverridingDeclareProps) => {
  return `\
/* eslint-disable */
// prettier-ignore
declare module 'next/link' {
  import type {ComponentProps} from 'react';
        
  import { ${generatedTypeName}, LinkHrefProp } from '${linkTypeDeclareFileName}';
  import NextLink, {LinkProps as NextLinkProps} from 'next/dist/client/link';
        
  export * from 'next/dist/client/link';
   
  export interface LinkProps<T = ${internalTypeName}, B = string>
    extends Omit<ComponentProps<typeof NextLink>, 'href'> {
    href: LinkHrefProp<T, B>;
  }
    
  export default function Link<T extends ${internalTypeName}, B extends string>(
    props: LinkProps<T, ${isStrict ? 'T' : 'B'}>,
  ): ReturnType<typeof NextLink>;
  
  export default Link;
}
  
// prettier-ignore
declare module 'next/router' {
  import type {
    NextRouter as OriginalNextRouter,
    SingletonRouter as OriginalSingletonRouter,
  } from 'next/dist/client/router';
  import OriginalRouter from 'next/dist/client/router';

  import type {${generatedTypeName}, LinkHrefProp, PathParams} from '${linkTypeDeclareFileName}';
        
  export * from 'next/dist/client/router';
  
  type OverridingRouterType = {
    push: <T extends ${internalTypeName}, B extends string>(
      route: LinkHrefProp<T, ${isStrict ? 'T' : 'B'}>,
      as?: Parameters<OriginalNextRouter['push']>[1],
      options?: Parameters<OriginalNextRouter['push']>[2],
    ) => ReturnType<OriginalNextRouter['push']>;

    replace: <T extends ${internalTypeName}, B extends string>(
      route: LinkHrefProp<T, ${isStrict ? 'T' : 'B'}>,
      as?: Parameters<OriginalNextRouter['replace']>[1],
      options?: Parameters<OriginalNextRouter['replace']>[2],
    ) => ReturnType<OriginalNextRouter['replace']>;

    prefetch: <T extends ${internalTypeName}, B extends string>(
      route: T | B,
      as?: Parameters<OriginalNextRouter['prefetch']>[1],
      options?: Parameters<OriginalNextRouter['prefetch']>[2],
    ) => ReturnType<OriginalNextRouter['prefetch']>;
  } & Omit<OriginalNextRouter, 'push' | 'replace' | 'prefetch'>;
  
  export interface NextRouter extends OverridingRouterType {}
  
  interface SingletonRouter
    extends Omit<OriginalSingletonRouter, 'router' | 'push' | 'replace' | 'prefetch'>,
      OverridingRouterType {
    router: NextRouter;
  }
  
  declare const _default: SingletonRouter;
  export default _default;

  export function useRouter(): NextRouter;
}
`;
};
