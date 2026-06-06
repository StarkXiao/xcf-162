import { CharacterProfile, NightclubRumor, HiddenFloorRecord } from '../types';

export const CharacterProfiles: CharacterProfile[] = [
  {
    id: 'player',
    name: '???',
    title: '电梯井中的逃亡者',
    icon: '🏃',
    rarity: 'common',
    description: '在失控夜店的电梯井中不断向上攀爬的神秘身影。',
    backstory: '没有人知道他为何出现在这里，也没有人知道他要去向何方。只知道当霓虹灯亮起时，他就会开始奔跑。保安、药片、黑暗——这些都无法阻止他向上的脚步。也许，楼顶真的有什么在等着他？',
    unlockCondition: { type: 'gamesPlayed', value: 1 },
    unlockedHint: '完成第一次游戏后解锁'
  },
  {
    id: 'guard_captain',
    name: '吴队长',
    title: '夜班保安主管',
    icon: '👮',
    rarity: 'common',
    description: '在失控夜店工作了十五年的资深保安。',
    backstory: '吴队长见过无数来夜店寻欢的人，也见过无数试图逃单的人。但像电梯井里那个不停往上跑的家伙，他还是第一次见。"这年头，连逃单都这么拼了吗？"他一边嘟囔，一边加快了巡逻的脚步。',
    unlockCondition: { type: 'gamesPlayed', value: 3 },
    unlockedHint: '进行3次游戏后解锁'
  },
  {
    id: 'bartender',
    name: '小岚',
    title: '迷幻调酒师',
    icon: '🍸',
    rarity: 'rare',
    description: '能用四片药片调出七彩鸡尾酒的传奇调酒师。',
    backstory: '小岚白天是医学院的高材生，晚上是夜店最神秘的调酒师。她调的酒据说能让人看到前世——当然，那可能只是药片的副作用。她对电梯井里那个家伙很感兴趣，因为他从不喝酒，只吃药片。',
    unlockCondition: { type: 'totalPills', value: 50 },
    unlockedHint: '累计收集50片药片后解锁'
  },
  {
    id: 'dj_echo',
    name: 'DJ Echo',
    title: '地下室节拍掌控者',
    icon: '🎧',
    rarity: 'rare',
    description: '据说他的BPM能精确匹配一个人的心跳频率。',
    backstory: 'DJ Echo从不露面，只在深夜的B15层出没。有人说他是一个AI程序，有人说他是已故传奇DJ的幽灵。只有电梯井里的那个人知道——每当他跳跃时，背景音乐的节拍就会随之改变。',
    unlockCondition: { type: 'maxCombo', value: 10 },
    unlockedHint: '达成10连击后解锁'
  },
  {
    id: 'vip_shadow',
    name: '影子客人',
    title: '顶层VIP包厢的神秘住客',
    icon: '🎭',
    rarity: 'legendary',
    description: '据说没有人见过他的真面目，包括夜店老板。',
    backstory: '传说中，失控夜店的顶层VIP包厢常年被一位神秘客人包下。他从不下去，也从不允许任何人上去。只有当电梯井里的逃亡者足够接近顶层时，才能听到从上面传来的低语："又一个来送死的吗？不...这一个不一样。"',
    unlockCondition: { type: 'endlessFloor', value: 50 },
    unlockedHint: '在无尽模式到达50层后解锁'
  },
  {
    id: 'pill_scientist',
    name: '陈博士',
    title: '药片研发顾问（前）',
    icon: '🧪',
    rarity: 'legendary',
    description: '创造了四种基础药片配方的传奇化学家。',
    backstory: '陈博士曾经是顶尖的神经药理学专家，直到有一天他发现自己的研究被用于制造"娱乐用药片"。他试图销毁所有配方，却只来得及撕碎核心数据。现在，四种基础药片在夜店里泛滥，而他本人——据说就藏在电梯井的某处，试图阻止自己的造物。',
    unlockCondition: { type: 'addiction', value: 90 },
    unlockedHint: '成瘾值达到90%后解锁'
  },
  {
    id: 'nightclub_owner',
    name: '老板娘',
    title: '失控夜店的真正主人',
    icon: '👑',
    rarity: 'legendary',
    description: '没人知道她的名字，大家只叫她"老板娘"。',
    backstory: '有人说她是黑道老大的遗孀，有人说她是跨国财团的千金。但真相是——她曾经也是电梯井里的一个逃亡者。三十年前，她从最底层一路爬到了顶层，然后买下了整栋楼。"每个人都在往上爬，"她对着镜子低语，"区别只在于，有些人爬到顶了就停下来了。"',
    unlockCondition: { type: 'highScore', value: 50000 },
    unlockedHint: '生存模式得分达到50000后解锁'
  }
];

export const NightclubRumors: NightclubRumor[] = [
  {
    id: 'rumor_elevator',
    title: '不存在的电梯',
    source: '保洁阿姨',
    content: '"你们有没有注意到？这栋楼明明有电梯，但从来没人用过。电梯门永远是关着的，可有时候深夜，你能听到电梯在运行的声音...但显示楼层的数字，从来没变过。"',
    unlockCondition: { type: 'gamesPlayed', value: 2 },
    unlockedHint: '进行2次游戏后解锁'
  },
  {
    id: 'rumor_pills',
    title: '药片的真正来源',
    source: '匿名调酒师',
    content: '"别信什么「进口货源」的鬼话。那些药片？都是在楼里自己做的。具体几层我不能说，但我可以告诉你——越往下走，药片颜色越奇怪。B15层的那种紫色药片，我可不敢碰。"',
    unlockCondition: { type: 'totalPills', value: 30 },
    unlockedHint: '累计收集30片药片后解锁'
  },
  {
    id: 'rumor_missing',
    title: '失踪的客人',
    source: '前台小哥',
    content: '"上个月有个客人，喝多了非要往员工通道走。我们拦都拦不住。然后...他就再也没出来过。警察调了监控，只看到他走进电梯井方向的走廊，然后画面就全是雪花了。"',
    unlockCondition: { type: 'gamesPlayed', value: 5 },
    unlockedHint: '进行5次游戏后解锁'
  },
  {
    id: 'rumor_music',
    title: '会自己播放的音乐',
    source: '音响师学徒',
    content: '"明明主控台都关了，音响里还能听到音乐。不是那种正常的曲子，是...节拍会跟着什么东西在变。像是有人在跑？或者在跳？我跟老板说过，他让我少管闲事。"',
    unlockCondition: { type: 'eventsTriggered', value: 5 },
    unlockedHint: '触发5次楼层事件后解锁'
  },
  {
    id: 'rumor_guard_uniform',
    title: '保安的制服',
    source: '洗衣房员工',
    content: '"那些保安的制服...我洗了三年了，从来没见他们换过人。衣服的编号都是一样的，甚至连磨损的位置都没变过。你说邪门不邪门？"',
    unlockCondition: { type: 'hallucinations', value: 3 },
    unlockedHint: '经历3次幻觉后解锁'
  },
  {
    id: 'rumor_top_floor',
    title: '顶层的灯光',
    source: '对面楼住户',
    content: '"我住对面那栋楼，每天凌晨三点都会往这边看。失控夜店的顶层，那个据说从不对外开放的VIP层，每天那个时间都会亮三下灯——两短一长，像是某种信号。给谁发的呢？"',
    unlockCondition: { type: 'dayCycles', value: 5 },
    unlockedHint: '经历5个昼夜循环后解锁'
  },
  {
    id: 'rumor_shield_pill',
    title: '粉色药片的诅咒',
    source: '资深玩家',
    content: '"那片粉色的盾牌药片，看起来是救命的对吧？但你仔细想想——为什么吃了它之后，保安会那么愤怒？我听说那玩意儿本来是给VIP吃的，用来「标记」闯入者的...你吃了，就等于在自己脑门上贴了「我在这里」的标签。"',
    unlockCondition: { type: 'eventsTriggered', value: 15 },
    unlockedHint: '触发15次楼层事件后解锁'
  },
  {
    id: 'rumor_loop',
    title: '永远到不了的顶层',
    source: '神秘留言',
    content: '"我在这栋楼里跑了多久了？三天？三个月？还是三年？我记不清了。每次觉得自己快到顶了，就会发现下面还有更深的地方。这栋楼...它根本就没有顶，对吧？"',
    unlockCondition: { type: 'endlessScore', value: 100000 },
    unlockedHint: '无尽模式得分达到100000后解锁'
  }
];

export const HiddenFloorRecords: HiddenFloorRecord[] = [
  {
    id: 'floor_b1',
    floorNumber: 1,
    floorName: 'B1F 入口层',
    icon: '🚪',
    phenomenon: '一切开始的地方。保安的脚步还很迟缓，霓虹灯的光还能照到这里。',
    notes: '大多数人都能到达这一层，然后就在这里倒下了。这没什么可羞耻的——毕竟，往上的路只会越来越难。',
    unlockCondition: { type: 'floorReached', value: 1 },
    unlockedHint: '无伤通过1层后解锁'
  },
  {
    id: 'floor_b5',
    floorNumber: 5,
    floorName: 'B5F 药品储藏层',
    icon: '💊',
    phenomenon: '空气中弥漫着淡淡的甜腥味。墙壁上有被抓挠过的痕迹，像是有人试图从里面出来。',
    notes: '药片在这一层的密度突然增大。据说曾经有储藏室在这里，但已经废弃很久了。废弃的原因...没有人愿意说。',
    unlockCondition: { type: 'floorReached', value: 5 },
    unlockedHint: '无伤通过5层后解锁'
  },
  {
    id: 'floor_b10',
    floorNumber: 10,
    floorName: 'B10F 保安休息层',
    icon: '⚠️',
    phenomenon: '保安出现的频率是其他楼层的三倍。墙上贴着告示："禁止追逐客人至该层以上。"告示已经被撕掉了一半。',
    notes: '这是保安原本应该止步的地方。但规则，总是用来打破的。',
    unlockCondition: { type: 'floorReached', value: 10 },
    unlockedHint: '无伤通过10层后解锁'
  },
  {
    id: 'floor_b15',
    floorNumber: 15,
    floorName: 'B15F 私人舞厅',
    icon: '🎵',
    phenomenon: '音乐在这里变得无比清晰，仿佛DJ就在隔壁打碟。但你找不到任何音响设备。',
    notes: '传说中的B15层，只对特殊客人开放。普通人连电梯按钮都看不到这一层。',
    unlockCondition: { type: 'floorReached', value: 15 },
    unlockedHint: '无伤通过15层后解锁'
  },
  {
    id: 'floor_b20',
    floorNumber: 20,
    floorName: 'B20F 监控室遗迹',
    icon: '📹',
    phenomenon: '四面墙壁全是碎裂的监视器屏幕。其中有一块，还在播放着雪花——雪花里，似乎有一个奔跑的人影。',
    notes: '这里曾是整栋楼的监控中心。直到某个深夜，所有屏幕同时碎裂，值班的保安也随之失踪。',
    unlockCondition: { type: 'endlessFloor', value: 20 },
    unlockedHint: '无尽模式到达20层后解锁'
  },
  {
    id: 'floor_b50',
    floorNumber: 50,
    floorName: 'B50F 实验层',
    icon: '🧬',
    phenomenon: '空气中的甜腥味变成了刺鼻的化学气味。所有药片在这里都变成了同一种颜色——黑色。',
    notes: '陈博士就是在这里创造了四种基础药片。也是在这里，他意识到自己打开了不该打开的门。',
    unlockCondition: { type: 'endlessFloor', value: 50 },
    unlockedHint: '无尽模式到达50层后解锁'
  },
  {
    id: 'floor_b75',
    floorNumber: 75,
    floorName: 'B75F 遗忘层',
    icon: '🌫️',
    phenomenon: '灯光在这里完全消失。你开始记不清自己为什么要往上爬。你甚至记不清自己的名字。',
    notes: '到达过这一层的人，回来之后都不再说话了。他们只是坐在角落里，反复写着同一个词——"出口"。',
    unlockCondition: { type: 'endlessFloor', value: 75 },
    unlockedHint: '无尽模式到达75层后解锁'
  },
  {
    id: 'floor_b100',
    floorNumber: 100,
    floorName: 'B100F ???',
    icon: '❓',
    phenomenon: '[数据损坏]',
    notes: '没有记录。没有证据。没有证人。只有传说——传说到达B100层的人，可以选择继续往上，或者...留下来。',
    unlockCondition: { type: 'endlessFloor', value: 100 },
    unlockedHint: '无尽模式到达100层后解锁'
  }
];

export const ArchiveConfig = {
  CharacterProfiles,
  NightclubRumors,
  HiddenFloorRecords
};
