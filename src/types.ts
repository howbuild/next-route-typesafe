type ParamValue = string | number | boolean;

export interface LinkProps {
  pathname: string;
  query?: Record<string, ParamValue>;
}

/**
 * route.config.js에서 사용할 type
 */
export interface RouterConfig {
  basePath?: string;
  ignorePaths?: string[];
  strict?: boolean;
  mode: 'monorepo' | 'single';
}
