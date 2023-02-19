import fg from 'fast-glob';
import chalk from 'chalk';
import path from 'path';
import {getConfig} from './utils';
import {RouterConfig} from './types';

import {RoutesTypeGeneratorFactory} from './mode';

export const run = () => {
  console.log(chalk.green('💬 link 추출중...'));

  const defaultIgnoreList = [
    '**/*_app.*',
    '**/*_document.*',
    '**/*404.*',
    '**/*.stories.*',
    '**/*_error.*',
    '**/node_modules/**',
  ];

  const routeConfig = getConfig<RouterConfig>(`${process.cwd()}/route.config.js`);

  const ignore = routeConfig?.ignorePath ? [...defaultIgnoreList, ...routeConfig.ignorePath] : defaultIgnoreList;
  const matchPaths = fg.sync(`${process.cwd()}/**/pages/**/*.{tsx,jsx}`, {
    onlyFiles: true,
    ignore,
  });

  const defaultMode = routeConfig?.mode ?? 'single';

  const RoutesTypeGeneratorClass = RoutesTypeGeneratorFactory(defaultMode);
  const RoutesTypeGenerator = new RoutesTypeGeneratorClass();

  const defaultBasePath = `${path.join(process.cwd(), routeConfig?.basePath || '')}/`;
  const defaultConfig = {isStrict: Boolean(routeConfig?.strict), basePath: defaultBasePath};

  RoutesTypeGenerator.write(matchPaths, defaultConfig);

  console.log(chalk.green(`✅ 파일 생성 완료`));
};
