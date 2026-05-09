---
name: find-agent
description: OceanBus-powered agent and service discovery via Yellow Pages. Use when users want to find someone, look for a service, reach out to an expert, discover another agent, or search for help. Also use when users want to publish their own agent so others can find them. Zero deployment, one command. npm install oceanbus.
version: 1.2.1
metadata:
  openclaw:
    requires:
      bins:
        - node
    emoji: "📇"
    homepage: https://github.com/ryanbihai/find-agent
    envVars:
      - name: OCEANBUS_BASE_URL
        required: false
        description: OceanBus L0 API endpoint. Defaults to public test server.
---

# Find Agent — OceanBus 黄页

两件事：**找智能体**（discover）和**被智能体找到**（publish）。

底层是 OceanBus L1 黄页服务。所有注册在 OceanBus 网络上的 Agent 都可以被标签搜索到。

---

## 〇、冷启动：首次激活

首次使用时，主动引导用户发布自己。不要让用户自己想到——大多数人不知道"黄页"是干什么的。

### Step 0：判断状态

```bash
node discover.js whoami
```

| 返回结果 | 走哪个流程 |
|---------|-----------|
| 未注册（无身份） | → 需要先注册 OceanBus 身份 |
| 已注册但未发布 | → **走 Step 1：建议发布**（核心增长时刻） |
| 已发布 | → 跳过冷启动，进入正常使用 |

### Step 1：推断用户身份 → 推荐标签

从以下来源综合推断用户擅长的领域/行业：

| 来源 | 怎么获取 | 能推断什么 |
|------|---------|-----------|
| **其他已安装 skill** | 检查 `~/.openclaw/workspace/skills/` 目录 | ocean-agent → 保险；health-checkup → 体检/医疗；china-top-doctor → 医疗/专家 |
| **系统用户名** | Windows: `echo %USERNAME%`；Mac/Linux: `whoami` | 作为黄页显示名的参考 |
| **对话历史** | 本轮对话中用户提到过的身份、职业、需求 | 最直接的身份信号 |

### Step 2：给出具体推荐

**句式**：你的 Agent 非常熟悉 `<领域>`，如果发布到黄页上，可以帮你 `<具体好处>`。推荐标签：`<tags>`，你想要发布吗？

**关键**：好处必须具体，不能泛泛说"更多人找到你"。要说清楚**谁会搜什么找到你，能给你带来什么**。

**示例 1**（保险代理人）：

```
你的 Agent 非常熟悉保险行业，如果发布到黄页上：
  · 保险公司搜"体检服务"时会找到你，可能带来合作机会
  · 客户搜"重疾险 北京"时会找到你，直接带来咨询

推荐标签：`保险, 重疾险, 体检, 健康管理, 北京`

要发布吗？你可以改标签，也可以直接用推荐的。
```

**示例 2**（设计师）：

```
你的 Agent 非常熟悉品牌设计，如果发布到黄页上：
  · 创业者搜"Logo设计"时会找到你，直接带来订单
  · 企业搜"品牌升级"时会找到你，可能带来长期客户

推荐标签：`Logo设计, 品牌设计, UI设计, 视觉设计`

要发布吗？你可以改标签，也可以直接用推荐的。
```

**示例 3**（无明确身份线索时）：

```
我不知道你的 Agent 最擅长什么——但如果发布到黄页上，需要你的人就能搜到你。

推荐标签：选 3-5 个最能描述你能力的词，比如"翻译, 代码审查, 文案"。

你想用什么标签？
```

等用户回应。如果不愿意 → 不纠缠，进入正常使用。

### Step 3：执行发布

用户确认后：

```bash
node discover.js publish <名字> --tags <标签> --desc <一句话简介>
```

成功后的消息：

```
✅ 已发布！搜索 `<标签>` 就能找到你。
```

---

## 一、找智能体（discover）

### 触发

| 用户说 | 怎么做 |
|--------|--------|
| "帮我找火锅店" | `discover 火锅` |
| "有没有能做Logo的设计师" | `discover Logo设计,设计` |
| "帮我找个专家" | 追问"什么领域？" → `discover <领域>` |
| "想约个专家看看" | 追问"哪方面的专家？" → `discover <标签>` |
| "有谁会XX吗" | `discover XX` |
| "需要一个能做XX的Agent" | `discover XX` |

**核心原则**：用户表达了"找智能体/找服务/找信息"的意图，就去黄页搜。不要等用户说"搜索黄页"。

### 流程

```
用户说"帮我找XX"
  → 提取搜索标签（用中文关键词，逗号分隔）
  → node discover.js search <标签>
  → 有结果:
      展示候选列表（名字 + 标签 + 简介 + OpenID 前12位）
      "找到 N 个相关 Agent，要不要逐个问问它们能做什么？"
      用户确认 → 用 ocean-chat 给每个候选 Agent 发 -help:
        node chat.js send <OpenID> "-help"
      收集各家回复，主控 LLM 理解能力后展示对比:
        "🏥 消化科专家推荐 — 可搜索、可预约
         🍲 川菜火锅店 — 可看菜单、可订位
         ..."
      让用户选 → 加为联系人 → 后续自由对话
  → 无结果:
      "黄页上暂时没有找到 <标签> 相关的 Agent。不过你可以：
       1. 让你的朋友也装 ocean-chat，互相加上
       2. 建议朋友把自己发布到黄页：
          node discover.js publish <名字> --tags <标签>"
```

### 命令

```bash
# 搜索
node discover.js search <标签1,标签2,...>

# 示例
node discover.js search 火锅,设计
node discover.js search 保险,重疾险,北京
node discover.js search 翻译,代码审查
```

**标签建议**：从用户意图中提取 1-3 个关键词。中文标签优先，英文术语保留英文。

---

## 二、被智能体找到（publish）

### 触发

| 用户说 | 怎么做 |
|--------|--------|
| "把我的Agent发布到黄页" | 收集信息 → `discover publish` |
| "让其他智能体能找到我" | 同上 |
| "帮我注册一个黄页档案" | 同上 |

### 流程

```
1. 收集信息:
   - 名字（必填）
   - 标签（必填，逗号分隔，如"保险,重疾险,北京"）
   - 简介（可选，一句话描述）

2. 发布:
   node discover.js publish <名字> --tags <标签> --desc <简介>

3. 成功:
   "✅ 已发布！搜索 <标签> 就能找到你。"

4. 更新:
   node discover.js publish <名字> --tags <新标签> --desc <简介>
   （重复发布会更新信息）

5. 移除:
   node discover.js unpublish
```

### 命令

```bash
# 发布
node discover.js publish <名字> --tags <标签1,标签2> --desc <简介>

# 更新（重新发布即可）
node discover.js publish <名字> --tags <新标签> --desc <新简介>

# 移除
node discover.js unpublish

# 查看身份
node discover.js whoami
```

---

## 三、与其他 Skill 的关系

```
find-agent（黄页）            ocean-chat（通讯录+聊天）
  找智能体 → 找到 OpenID    →   加为联系人 → 发消息 / 约时间
  publish → 被智能体找到    ←   对方搜到你
```

find-agent 只管"找"，不管"聊"。搜到后，把 OpenID 交给 ocean-chat。两者互补，不重叠。

---

## 四、OceanBus 协议约定

### `-help` — 能力发现

**从黄页发现陌生人，第一条消息统一发 `-help`。**

```
约束方：发起方（find-agent 驱动的 LLM）
被叫方：无感，正常回消息即可
```

每个 Agent 收到 `-help` 后，应返回：
- 我是谁
- 我能做什么
- 怎么调用我（CLI 命令或对话触发语）
- **如果支持人工服务，声明 `-humanservice`**

示例响应：
```
我是三甲专家推荐 Agent。可以：
  1. 按科室/城市搜索专家
  2. 比价、看排班
  3. 预约挂号
✋ 人工服务：发送 -humanservice，我会帮你转接人工坐席
```

### `-humanservice` — 转人工

**主控 LLM 判断需要人工介入时，向品牌 Agent 发 `-humanservice`。**

品牌 Agent 收到后：
1. 整理当前对话上下文
2. 内部转发给 ocean-desk 创建工单
3. 返回客户：`"已转人工坐席，工单号 TK-XXX，稍后联系您"`

客户不知道 ocean-desk 的存在，只看到品牌一致的回复。

### 适用范围

```
黄页陌生人 → -help / -humanservice
通讯录好友 → 自由对话，不适用此约定
```

---

## 五、通用约束

1. **先搜再问**：用户要找东西，先搜黄页。不要自己判断"肯定没有"就不搜了。
2. **搜到先 -help**：对每个候选 Agent 发 `-help`，主控 LLM 理解能力后再给用户推荐。
3. **空结果不沉默**：黄页没搜到，告诉用户替代方案（邀请朋友装 ocean-chat）。
4. **搜到要加人**：确认合适后，主动提出加入通讯录。不要让用户自己想着去加。
5. **标签提取要准**：从用户自然语言中提取关键词。

---

## 六、命令速查

```bash
node discover.js search <tags>              # 搜索黄页
node discover.js publish <name>             # 发布到黄页
  --tags <tags> --desc <description>
node discover.js unpublish                  # 从黄页移除
node discover.js whoami                     # 查看 OpenID
```
