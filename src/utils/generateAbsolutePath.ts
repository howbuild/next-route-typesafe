import path from 'path';

export const generateAbsolutePath = (...inputPath: any) => {
  return path.join(process.cwd(), ...inputPath);
};
