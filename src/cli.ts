import fg from 'fast-glob';
import chalk from 'chalk';
import {getConfig, generateAbsolutePath} from './utils';
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

  const routeConfig = getConfig<RouterConfig>(generateAbsolutePath('route.config.js'));

  if (!routeConfig) {
    console.error(chalk.red('route.config.js 파일을 추가해주세요.'));
    process.exit(-1);
  }

  const defaultMode = routeConfig.mode ?? 'single';

  const defaultBasePath = `${generateAbsolutePath(routeConfig.basePath || '')}/`;
  const defaultConfig = {isStrict: Boolean(routeConfig.strict), basePath: defaultBasePath};
  const ignore = routeConfig.ignorePaths
    ? [...defaultIgnoreList, ...routeConfig.ignorePaths.map((ignorePath) => generateAbsolutePath(ignorePath))]
    : defaultIgnoreList;

  const matchPaths = fg.sync(generateAbsolutePath('**', 'pages', '**', '*.{tsx,jsx}'), {
    onlyFiles: true,
    ignore,
  });

  const RoutesTypeGeneratorClass = RoutesTypeGeneratorFactory(defaultMode);
  const RoutesTypeGenerator = new RoutesTypeGeneratorClass();

  RoutesTypeGenerator.write(matchPaths, defaultConfig);

  console.log(chalk.green(`✅ 파일 생성 완료`));
};
