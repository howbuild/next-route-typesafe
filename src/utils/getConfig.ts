/* eslint-disable no-empty */
// import * as fs from 'fs';

/**
 * config 파일을 가져오는 함수
 * filePath는 파일명까지 포함한 경로 (ex: apps/service/next.config.js)
 */
export const getConfig = <T = any>(filePath: string): T | undefined => {
  let config;
  try {
    config = require(filePath);
  } catch (error) {}

  return config as T | undefined;
};
