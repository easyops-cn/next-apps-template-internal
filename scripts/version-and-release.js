#!/usr/bin/env node

/**
 * 一键发布脚本
 *
 * 功能：
 * 1. 运行 changeset version（生成 CHANGELOG 和更新版本）
 * 2. 自动 git add 所有变更
 * 3. 自动 git commit
 * 4. 打 Git tags
 * 5. 推送到远程（包括 tags）
 */

import { execSync } from 'child_process';

console.log('🚀 开始发布流程...\n');

try {
  // 1. 运行 changeset version
  console.log('📝 [1/5] 生成 CHANGELOG 和更新版本号');
  execSync('npx changeset version', { stdio: 'inherit' });
  console.log('');

  // 2. 检查是否有变更
  console.log('📝 [2/5] 检查变更');
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });

  if (!status.trim()) {
    console.log('ℹ️  没有检测到变更，可能没有待发布的 changeset');
    console.log('');
    console.log('💡 提示：');
    console.log('  - 确保有 .changeset/*.md 文件');
    console.log('  - 运行 pnpm run changeset:status 查看状态');
    console.log('');
    process.exit(0);
  }

  console.log('✅ 检测到以下变更：');
  console.log(status);
  console.log('');

  // 3. Git add 所有变更
  console.log('📝 [3/5] 添加所有变更到 Git');
  execSync('git add .', { stdio: 'inherit' });
  console.log('');

  // 4. Git commit
  console.log('📝 [4/5] 提交版本变更');
  execSync('git commit -m "chore(release): publish" --no-verify', { stdio: 'inherit' });
  console.log('');

  // 5. 打 Git tags 并推送
  console.log('📝 [5/5] 打 Git tags 并推送到远程');

  // 打 tags
  execSync('npx changeset tag', { stdio: 'inherit' });

  // 推送（包括 tags）
  execSync('git push --follow-tags --no-verify --atomic origin master', { stdio: 'inherit' });
  console.log('');

  console.log('='.repeat(50));
  console.log('✅ 发布完成！');
  console.log('='.repeat(50));
  console.log('');

  // 显示最近的 tags
  try {
    const tags = execSync('git tag --sort=-creatordate | head -5', { encoding: 'utf-8' });
    console.log('📦 最近的 tags:');
    tags.split('\n').filter(Boolean).forEach(tag => {
      console.log(`  - ${tag}`);
    });
  } catch (e) {
    // 忽略错误
  }

  console.log('');

} catch (error) {
  console.error('');
  console.error('❌ 发布失败！');
  console.error('');
  console.error('错误信息：', error.message);
  console.error('');
  console.error('🔧 手动发布步骤：');
  console.error('  1. pnpm run changeset:status  # 检查状态');
  console.error('  2. npx changeset version     # 生成 CHANGELOG');
  console.error('  3. git add .');
  console.error('  4. git commit -m "chore(release): publish"');
  console.error('  5. npx changeset tag');
  console.error('  6. git push --follow-tags');
  console.error('');
  process.exit(1);
}
