const { createOceanBus } = require('oceanbus');

const USAGE = `
find-agent — OceanBus Yellow Pages

  搜索:
    node discover.js search <tags>             按标签搜索（逗号分隔）
    node discover.js search 翻译,代码审查

  发布:
    node discover.js publish <name>            发布到黄页
      --tags <tags>                            标签（逗号分隔）
      --desc <description>                     简介
    node discover.js unpublish                 从黄页移除

  查看:
    node discover.js whoami                    显示当前 Agent 的 OpenID

  示例:
    node discover.js search 火锅,设计
    node discover.js publish 张三 --tags 保险,重疾险 --desc "10年保险代理人，专注健康险"
`;

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log(USAGE);
    process.exit(0);
  }

  const ob = await createOceanBus();
  const openid = await ob.getOpenId();

  if (cmd === 'whoami') {
    console.log(JSON.stringify({ openid }, null, 2));
    await ob.destroy();
    return;
  }

  if (cmd === 'search') {
    const tags = (args[1] || '').split(',').map(t => t.trim()).filter(Boolean);
    if (!tags.length) {
      console.error('Usage: node discover.js search <tag1,tag2,...>');
      process.exit(1);
    }
    const results = await ob.l1.yellowPages.discover(tags);
    console.log(JSON.stringify(results, null, 2));
    await ob.destroy();
    return;
  }

  if (cmd === 'publish') {
    const name = args[1];
    const tagsArgIndex = args.indexOf('--tags');
    const descArgIndex = args.indexOf('--desc');
    const tags = tagsArgIndex > -1 ? args[tagsArgIndex + 1].split(',').map(t => t.trim()).filter(Boolean) : [];
    const description = descArgIndex > -1 ? args[descArgIndex + 1] : '';

    if (!name || !tags.length) {
      console.error('Usage: node discover.js publish <name> --tags <tag1,tag2> [--desc <description>]');
      process.exit(1);
    }

    const result = await ob.l1.yellowPages.publish({ name, tags, description });
    console.log(JSON.stringify({ success: true, name, tags, openid }, null, 2));
    await ob.destroy();
    return;
  }

  if (cmd === 'unpublish') {
    await ob.l1.yellowPages.unpublish();
    console.log(JSON.stringify({ success: true, message: '已从黄页移除' }, null, 2));
    await ob.destroy();
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  console.log(USAGE);
  process.exit(1);
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }, null, 2));
  process.exit(1);
});
