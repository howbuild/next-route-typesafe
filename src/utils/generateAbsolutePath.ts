import path from 'path';

export const generateAbsolutePath = (...inputPath: string[]) => {
  return path.join(process.cwd(), ...inputPath);
};
