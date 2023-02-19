import chalk from 'chalk';

/**
 * config 파일을 가져오는 함수
 * filePath는 파일명까지 포함한 경로 (ex: apps/service/next.config.js)
 */
export const getConfig = <T = any>(filePath: string): T | undefined => {
  let config;
  try {
    config = require(filePath);
  } catch (error) {
    console.error(chalk.red(`${filePath}를 찾을 수 없습니다 : ${error}`));
  }

  return config as T | undefined;
};
