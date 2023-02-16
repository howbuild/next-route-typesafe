import {RouterConfig} from '../types';
import {MultipleRoutesType} from './MultipleRoutesTypeGenerator';

import {SingleRoutesTypeGenerator} from './SingleRoutesTypeGenerator';

export const RoutesTypeGeneratorFactory = (mode: RouterConfig['mode']) => {
  const RoutesTypeGeneratorModeMapping = {
    monorepo: MultipleRoutesType,
    single: SingleRoutesTypeGenerator,
  };

  return RoutesTypeGeneratorModeMapping[mode];
};
