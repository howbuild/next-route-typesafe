import chalk from 'chalk';

export const assert = (errorCondition: boolean, message: string) => {
  if (errorCondition) {
    console.error(chalk.red(message));
    process.exit(-1);
  }
};
