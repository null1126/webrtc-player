import { select, intro, outro, isCancel, cancel } from '@clack/prompts';
import { execSync } from 'child_process';
import { exit } from 'process';

/**
 * 发布到 npm
 * @returns {Promise<string>} 发布结果
 */
const publishPackage = async () => {
  intro('发布中...');
  const result = await execSync('pnpm publish', { stdio: 'inherit' });
  outro('发布完成', {
    text: '发布完成!',
    textColor: 'green',
  });
  return result;
};

/**
 * 构建
 * @returns {Promise<string>} 构建结果
 */
const buildPackage = async () => {
  intro('构建中...');
  const result = await execSync('pnpm run build', { stdio: 'inherit' });
  outro('构建完成', {
    text: '构建完成!',
    textColor: 'green',
  });
  return result;
};

/**
 * 更新版本号
 * @param {string} version 版本号: major | minor | patch
 * @returns {Promise<string>} 更新后的版本号
 */
const updateVersion = async (packageName, versionOption) => {
  return await execSync(`npm version ${versionOption} --workspace ${packageName}`, {
    stdio: 'inherit',
  });
};

/**
 * 请选择更新哪个版本号?
 * @returns {Promise<string>} 版本号: major | minor | patch
 */
const selectUpdateVersion = async () => {
  const version = await select({
    message: '请选择更新哪个版本号?',
    options: [
      { label: '不更新', value: '' },
      { label: '主版本号', value: 'major' },
      { label: '次版本号', value: 'minor' },
      { label: '补丁版本号', value: 'patch' },
    ],
  });
  if (isCancel(version)) {
    cancel('已取消更新版本号操作');
    exit(0);
  }
  return version;
};

/**
 * 请选择要发布的包?
 * @returns {Promise<string>} 发布的包: @webrtc-player
 */
const selectPublishPackage = async () => {
  const packages = await select({
    message: '请选择要发布的包?',
    options: [{ label: '@webrtc-player', value: '@webrtc-player' }],
  });
  if (isCancel(packages)) {
    cancel('已取消发布操作');
    exit(0);
  }
  return packages;
};

/**
 * 请选择是否要发布到 npm?
 * @returns {Promise<string>} 发布选项: yes | no
 */
const selectPublish = async () => {
  const publish = await select({
    message: '请选择是否要发布到 npm?',
    options: [
      { label: '是', value: 'yes' },
      { label: '否', value: 'no' },
    ],
  });
  if (isCancel(publish)) {
    cancel('已取消发布操作');
    exit(0);
  }
  return publish;
};

/**
 * 构建并发布
 * @returns {Promise<void>}
 */
export const buildAndPublish = async () => {
  const publishOption = await selectPublish();
  if (publishOption === 'no') {
    await buildPackage();
    return;
  }
  const packages = await selectPublishPackage();
  const versionOption = await selectUpdateVersion();
  if (versionOption !== '') {
    intro('更新版本号');
    await updateVersion(packages, versionOption);
    outro('版本号更新完成', {
      text: '版本号更新完成!',
      textColor: 'green',
    });
  }
  await buildPackage();
  await publishPackage();
};
