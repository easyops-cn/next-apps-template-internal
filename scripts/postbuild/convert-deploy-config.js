#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

/**
 * 将 dev-config.yaml 中的部署配置转换为 deploy.txt
 */
export function convertDeployConfig() {
  // 读取 dev-config.yaml
  const yamlContent = readFileSync('dev-config.yaml', 'utf8');
  const config = parse(yamlContent);

  // 提取 deploy 配置
  const deployConfig = config.apps?.deploy;
  if (!deployConfig) {
    console.error('❌ 配置文件中缺少 apps.deploy 配置');
    process.exit(1);
  }

  const defaultHost = deployConfig.default;
  const hostsConfig = deployConfig.hosts || [];

  // 扫描 apps/ 目录，获取所有应用列表
  const appsDir = 'apps';
  const allApps = readdirSync(appsDir).filter(name => {
    const fullPath = join(appsDir, name);
    return statSync(fullPath).isDirectory();
  });

  console.log(`📦 发现 ${allApps.length} 个应用: ${allApps.join(', ')}`);

  // 构建 app -> host 的映射（只处理实际存在的应用）
  const appToHost = new Map();
  const allAppsSet = new Set(allApps);

  // 1. 处理明确配置的应用（只处理存在的应用）
  hostsConfig.forEach(({ host, apps }) => {
    apps.forEach(app => {
      if (allAppsSet.has(app)) {
        appToHost.set(app, host);
      } else {
        console.warn(`  ⚠️  配置中的应用 ${app} 不存在于 apps/ 目录，跳过`);
      }
    });
  });

  // 2. 未配置的应用使用 default host
  allApps.forEach(app => {
    if (!appToHost.has(app)) {
      if (defaultHost) {
        appToHost.set(app, defaultHost);
        console.log(`  ℹ️  ${app} 未配置，使用默认主机: ${defaultHost}`);
      } else {
        console.warn(`  ⚠️  ${app} 未配置且无默认主机，跳过`);
      }
    }
  });

  // 3. 反向构建 host -> apps 的映射
  const hostToApps = new Map();
  appToHost.forEach((host, app) => {
    if (!hostToApps.has(host)) {
      hostToApps.set(host, []);
    }
    hostToApps.get(host).push(app);
  });

  // 4. 生成 deploy.txt
  const lines = Array.from(hostToApps.entries()).map(([host, apps]) => {
    return `${host} ${apps.join(' ')}`;
  });

  const output = [
    '# 此文件由 dev-config.yaml 自动生成，请勿手动编辑',
    '# 格式: IP 应用名1 应用名2...',
    '',
    ...lines
  ].join('\n');

  writeFileSync('deploy.txt', output);

  console.log('');
  console.log('✅ 已生成 deploy.txt:');
  console.log('----------------------------------------');
  hostToApps.forEach((apps, host) => {
    console.log(`   ${host} → ${apps.join(', ')}`);
  });
  console.log('----------------------------------------');
}

// 如果直接运行此脚本，则执行转换
if (import.meta.url === `file://${process.argv[1]}`) {
  convertDeployConfig();
}
