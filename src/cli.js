/**
 * MemClaw - CLI 工具
 */

const { Command } = require('commander');
const MemClaw = require('./index.js');
const chalk = require('chalk');

const program = new Command();
const memclaw = new MemClaw();

program
  .name('memclaw')
  .description('AI Memory Optimizer - 让 Agent 记得更准、更聪明')
  .version('1.0.0');

// 添加记忆
program
  .command('add <content>')
  .description('添加新记忆')
  .option('-t, --type <type>', '记忆类型 (preference/decision/fact/log/summary)', 'log')
  .option('--tags <tags>', '标签，用逗号分隔')
  .action((content, options) => {
    const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : [];
    memclaw.addMemory(content, {
      type: options.type,
      tags
    }, (err, id) => {
      if (err) {
        console.error(chalk.red('✗ 添加失败:', err.message));
        process.exit(1);
      }
      console.log(chalk.green(`✓ 记忆已添加 (ID: ${id})`));
      memclaw.close();
    });
  });

// 压缩记忆
program
  .command('compress')
  .description('执行记忆压缩')
  .action(() => {
    console.log(chalk.yellow('开始压缩记忆...'));
    memclaw.compressMemories((err, result) => {
      if (err) {
        console.error(chalk.red('✗ 压缩失败:', err.message));
        process.exit(1);
      }
      console.log(chalk.green(`✓ 压缩完成:`));
      console.log(`  总计: ${result.total}`);
      console.log(`  压缩: ${result.compressed}`);
      console.log(`  保留: ${result.preserved}`);
      console.log(`  节省: ${result.tokenSaved} tokens`);
      memclaw.close();
    });
  });

// 搜索记忆
program
  .command('search <query>')
  .description('搜索记忆')
  .action(async (query) => {
    console.log(chalk.yellow(`搜索: "${query}"`));
    memclaw.searchMemories(query, (err, results) => {
      if (err) {
        console.error(chalk.red('✗ 搜索失败:', err.message));
        process.exit(1);
      }
      console.log(chalk.green(`✓ 找到 ${results.length} 条相关记忆:`));
      results.forEach((result, index) => {
        console.log(`\n${index + 1}. [${result.score.toFixed(3)}] ${result.content.substring(0, 100)}...`);
      });
      memclaw.close();
    });
  });

// 列出所有记忆
program
  .command('list')
  .description('列出所有记忆')
  .action(() => {
    memclaw.getAllMemories((err, memories) => {
      if (err) {
        console.error(chalk.red('✗ 查询失败:', err.message));
        process.exit(1);
      }
      console.log(chalk.yellow(`共有 ${memories.length} 条记忆:`));
      memories.forEach((mem, index) => {
        const status = mem.compressed ? chalk.gray('[压缩]') : chalk.green('[活跃]');
        console.log(`\n${index + 1}. ${status} [${mem.type}] ${mem.content.substring(0, 80)}...`);
        if (mem.tags) {
          try {
            const tags = JSON.parse(mem.tags);
            if (tags.length > 0) {
              console.log(`   标签: ${tags.join(', ')}`);
            }
          } catch (e) {
            // 忽略 JSON 解析错误
          }
        }
      });
      memclaw.close();
    });
  });

// 显示统计信息
program
  .command('stats')
  .description('显示统计信息')
  .action(() => {
    memclaw.getStats((err, stats) => {
      if (err) {
        console.error(chalk.red('✗ 查询失败:', err.message));
        process.exit(1);
      }
      console.log(chalk.yellow('📊 MemClaw 统计信息:'));
      console.log(`  总记忆数: ${stats.total}`);
      console.log(`  活跃记忆: ${stats.active}`);
      console.log(`  压缩记忆: ${stats.compressed}`);
      console.log(`  Token 节省: ${stats.tokenSaved}`);
      console.log(`  压缩率: ${stats.compressionRate}`);
      memclaw.close();
    });
  });

// 帮助
program
  .command('help')
  .description('显示帮助信息')
  .action(() => {
    program.outputHelp();
  });

program.parse(process.argv);
