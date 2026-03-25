import { select, intro, isCancel, cancel } from '@clack/prompts';
import { execSync } from 'node:child_process';
import { buildAndPublish } from './build.js';

const runDev = async () => {
  execSync('pnpm dev', { stdio: 'inherit' });
};

const runTest = async () => {
  intro('测试用例待完善');
};

const MODE_MAP = {
  development: runDev,
  test: runTest,
  build: buildAndPublish,
};

const main = async () => {
  const mode = await select({
    message: '请选择运行模式?',
    options: [
      { label: '开发环境 (dev)', value: 'development' },
      { label: '测试用例 (test)', value: 'test' },
      { label: '打包构建 (build)', value: 'build' },
    ],
  });
  if (isCancel(mode)) {
    cancel('已取消操作');
    return;
  }
  await MODE_MAP[mode]();
};

main();
