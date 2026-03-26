#!/usr/bin/env node

/**
 * 自动从 Git commit message 生成 changeset 文件
 *
 * 功能：
 * 1. 解析 commit message（遵循 Conventional Commits）
 * 2. 判断是否需要生成 changeset
 * 3. 自动确定版本升级类型（major/minor/patch）
 * 4. 自动识别受影响的包
 * 5. 生成 changeset 文件
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * 解析 Conventional Commit message
 * 格式: type(scope): description
 */
function parseCommitMessage(message) {
  const firstLine = message.split('\n')[0].trim();
  const match = firstLine.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);

  if (!match) {
    return null;
  }

  const [, type, scope, description] = match;
  const hasBreakingChange = message.includes('BREAKING CHANGE:') ||
                           message.includes('BREAKING-CHANGE:') ||
                           firstLine.includes('!:');

  return {
    type,
    scope: scope || null,
    description,
    hasBreakingChange,
    fullMessage: message
  };
}

/**
 * 判断 commit 类型是否需要生成 changeset
 */
function shouldCreateChangeset(type) {
  const typesNeedChangeset = ['feat', 'fix', 'refactor', 'perf',"chore","style"];
  return typesNeedChangeset.includes(type);
}

/**
 * 根据 commit 类型确定版本升级类型
 */
function getBumpType(type, hasBreakingChange) {
  if (hasBreakingChange) {
    return 'major';
  }

  switch (type) {
    case 'feat':
      return 'minor';
    case 'fix':
    case 'perf':
    case 'refactor':
      return 'patch';
    default:
      return 'patch';
  }
}

/**
 * 扫描所有包
 */
function scanAllPackages() {
  const packages = [];

  ['apps', 'bricks', 'shared'].forEach(dir => {
    if (!existsSync(dir)) return;

    const items = readdirSync(dir);
    items.forEach(name => {
      const pkgPath = join(dir, name, 'package.json');
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        packages.push({
          name: pkg.name,
          path: join(dir, name),
          dir: dir,
          shortName: name
        });
      }
    });
  });

  return packages;
}

/**
 * 根据 scope 识别受影响的包
 */
function identifyAffectedPackages(scope, packages) {
  if (!scope) {
    return packages.filter(p => p.dir === 'apps');
  }

  const affected = packages.filter(p => {
    if (p.shortName === scope) {
      return true;
    }
    if (p.shortName.includes(scope) || scope.includes(p.shortName)) {
      return true;
    }
    return false;
  });

  if (affected.length === 0) {
    return packages.filter(p => p.dir === 'apps');
  }

  return affected;
}

/**
 * 生成随机的 changeset 文件名
 */
function generateChangesetId() {
  const adjectives = ['cool', 'brave', 'wise', 'gentle', 'swift', 'kind', 'proud', 'smart'];
  const nouns = ['cats', 'dogs', 'birds', 'fish', 'lions', 'bears', 'wolves', 'eagles'];
  const verbs = ['jump', 'run', 'fly', 'swim', 'dance', 'sing', 'laugh', 'smile'];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];

  return `${adj}-${noun}-${verb}`;
}

/**
 * 检查是否已存在相同描述的 changeset
 */
function hasExistingChangeset(description) {
  const changesetDir = '.changeset';
  if (!existsSync(changesetDir)) {
    return false;
  }

  const files = readdirSync(changesetDir).filter(f => f.endsWith('.md') && f !== 'README.md');

  for (const file of files) {
    try {
      const content = readFileSync(join(changesetDir, file), 'utf-8');
      if (content.includes(description)) {
        return true;
      }
    } catch (e) {
      // 忽略读取错误
    }
  }

  return false;
}

/**
 * 创建 changeset 文件
 */
function createChangesetFile(packages, bumpType, description) {
  const changesetId = generateChangesetId();
  const filename = `.changeset/${changesetId}.md`;

  const packageLines = packages.map(p => `"${p.name}": ${bumpType}`).join('\n');

  const content = `---
${packageLines}
---

${description}
`;

  writeFileSync(filename, content, 'utf-8');
  return filename;
}

/**
 * 主函数
 */
function main() {
  const isQuiet = process.argv.includes('--quiet');

  const commitMsgFile = process.argv.find(arg => !arg.startsWith('--')) || '.git/COMMIT_EDITMSG';
  const actualFile = commitMsgFile.replace(/^.*?([^\/]+)$/, '$1') === commitMsgFile ?
                     commitMsgFile : process.argv[2];

  if (!existsSync(actualFile || '.git/COMMIT_EDITMSG')) {
    if (!isQuiet) console.log('ℹ️  未找到 commit message 文件');
    return;
  }

  const commitMessage = readFileSync(actualFile || '.git/COMMIT_EDITMSG', 'utf-8');

  const parsed = parseCommitMessage(commitMessage);

  if (!parsed) {
    if (!isQuiet) console.log('ℹ️  Commit message 格式不符合 Conventional Commits 规范，跳过 changeset 生成');
    return;
  }

  const { type, scope, description, hasBreakingChange } = parsed;

  if (!shouldCreateChangeset(type)) {
    if (!isQuiet) console.log(`ℹ️  Commit 类型 "${type}" 不需要生成 changeset`);
    return;
  }

  const allPackages = scanAllPackages();

  if (allPackages.length === 0) {
    if (!isQuiet) console.log('⚠️  未找到任何包');
    return;
  }

  const affectedPackages = identifyAffectedPackages(scope, allPackages);

  if (affectedPackages.length === 0) {
    if (!isQuiet) console.log('⚠️  未识别到受影响的包');
    return;
  }

  const bumpType = getBumpType(type, hasBreakingChange);

  if (hasExistingChangeset(description)) {
    if (!isQuiet) {
      console.log('ℹ️  已存在相同描述的 changeset，跳过生成');
    }
    return;
  }

  const filename = createChangesetFile(affectedPackages, bumpType, description);

  if (isQuiet) {
    console.log(`📝 生成 changeset: ${affectedPackages.map(p => p.name).join(', ')} (${bumpType})`);
  } else {
    console.log('');
    console.log('✅ 已自动生成 changeset 文件:');
    console.log(`   ${filename}`);
    console.log('');
    console.log('📝 变更详情:');
    console.log(`   类型: ${type} → 版本升级: ${bumpType}`);
    console.log(`   受影响的包 (${affectedPackages.length}):${affectedPackages.map(p => ` ${p.name}`).join(',')}`);
    console.log(`   描述: ${description}`);
    console.log('');
    console.log('💡 提示:');
    console.log('   - Changeset 文件已生成，你可以 review 和编辑');
    console.log('   - 如果不需要，可以删除该文件');
    console.log('   - 使用 git add .changeset/*.md 来添加到 commit');
    console.log('');
  }
}

main();
