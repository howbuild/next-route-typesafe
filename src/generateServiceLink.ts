import {generateInternalLink} from './generateInternalLink';
import {LinkProps} from './types';

export const generateServiceLink = (env: Record<string, string>) => (key: string, linkProps: LinkProps) => {
  return `${env[key]}${generateInternalLink(linkProps)}`;
};
