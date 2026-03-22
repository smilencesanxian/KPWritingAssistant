export interface SentenceExample {
  wrong: string;
  correct: string;
}

export interface PracticeItem {
  question: string;
  answer: string;
}

export interface ErrorExplanation {
  title: string;
  rule: string;
  examples: SentenceExample[];
  practices: PracticeItem[];
}

const ERROR_EXPLANATIONS: Record<string, ErrorExplanation> = {
  subject_verb_agreement: {
    title: '主谓一致',
    rule: '动词的形式必须与主语在人称和数上保持一致。第三人称单数主语搭配动词+s/es，复数主语搭配原形动词。',
    examples: [
      { wrong: 'She go to school every day.', correct: 'She goes to school every day.' },
      { wrong: 'The children plays in the park.', correct: 'The children play in the park.' },
      { wrong: 'My friend and I likes music.', correct: 'My friend and I like music.' },
    ],
    practices: [
      { question: 'He _____ (have) a new bicycle.', answer: 'has' },
      { question: 'The students _____ (study) hard every day.', answer: 'study' },
      { question: 'My sister _____ (not like) vegetables.', answer: "doesn't like" },
    ],
  },

  verb_tense: {
    title: '动词时态',
    rule: '时态表示动作发生的时间。过去的事情用一般过去时（did），正在进行用进行时（is doing），将来的事用将来时（will do）。时间状语词是判断时态的重要依据。',
    examples: [
      { wrong: 'Yesterday I go to the library.', correct: 'Yesterday I went to the library.' },
      { wrong: 'She is reading a book last night.', correct: 'She was reading a book last night.' },
      { wrong: 'I will went to Beijing tomorrow.', correct: 'I will go to Beijing tomorrow.' },
    ],
    practices: [
      { question: 'Last summer, we _____ (visit) the Great Wall.', answer: 'visited' },
      { question: 'Look! The birds _____ (fly) in the sky.', answer: 'are flying' },
      { question: 'She _____ (finish) her homework before dinner tomorrow.', answer: 'will finish' },
    ],
  },

  article_usage: {
    title: '冠词使用',
    rule: '不定冠词 a/an 用于第一次提到的可数名词单数（a 用于辅音开头，an 用于元音开头）；定冠词 the 用于特指已知的事物；不可数名词和复数名词泛指时不加冠词。',
    examples: [
      { wrong: 'I have a umbrella in my bag.', correct: 'I have an umbrella in my bag.' },
      { wrong: 'Can you close window? It is cold.', correct: 'Can you close the window? It is cold.' },
      { wrong: 'The water is important for life.', correct: 'Water is important for life.' },
    ],
    practices: [
      { question: 'She is _____ honest girl. (a / an)', answer: 'an' },
      { question: 'I saw a dog in the park. _____ dog was very cute. (A / The)', answer: 'The' },
      { question: 'He plays _____ piano every evening. (a / the / 不填)', answer: 'the' },
    ],
  },

  preposition_usage: {
    title: '介词使用',
    rule: '介词用于表示时间、地点、方式等关系。常见：at（具体时刻/地点），on（日期/表面），in（较大地点/月份年份/内部），to（方向），for（目的/时段）。',
    examples: [
      { wrong: 'I will meet you in 3 o\'clock.', correct: "I will meet you at 3 o'clock." },
      { wrong: 'She was born in Monday.', correct: 'She was born on Monday.' },
      { wrong: 'He is good in maths.', correct: 'He is good at maths.' },
    ],
    practices: [
      { question: 'The meeting starts _____ 9 a.m. (at / in / on)', answer: 'at' },
      { question: 'My birthday is _____ July. (at / in / on)', answer: 'in' },
      { question: 'The book is _____ the shelf. (at / on / in)', answer: 'on' },
    ],
  },

  spelling: {
    title: '拼写错误',
    rule: '英语拼写需要记忆单词的正确字母顺序。常见规则：i 在 e 前，除了在 c 后面（receive/believe）；双写辅音字母（running/swimming）；不规则拼写需特别记忆。',
    examples: [
      { wrong: 'I recieve your letter yesterday.', correct: 'I received your letter yesterday.' },
      { wrong: 'She is very beautifull.', correct: 'She is very beautiful.' },
      { wrong: 'He is intrested in science.', correct: 'He is interested in science.' },
    ],
    practices: [
      { question: '选出正确拼写：A) freind  B) friend  C) feiend', answer: 'B) friend' },
      { question: '选出正确拼写：A) necessary  B) neccesary  C) necesary', answer: 'A) necessary' },
      { question: '选出正确拼写：A) tommorow  B) tomorrow  C) tomorow', answer: 'B) tomorrow' },
    ],
  },

  punctuation: {
    title: '标点符号',
    rule: '英语句子末尾用句号（.）、问号（?）或叹号（!）。逗号用于分隔并列成分或从句。撇号（\'）用于缩写（don\'t）和所有格（Tom\'s）。',
    examples: [
      { wrong: "Don't you think its a good idea", correct: "Don't you think it's a good idea?" },
      { wrong: 'I like apples oranges and bananas.', correct: 'I like apples, oranges, and bananas.' },
      { wrong: "Toms book is on the table.", correct: "Tom's book is on the table." },
    ],
    practices: [
      { question: "补全标点：It_s very cold today（缩写撇号）", answer: "It's" },
      { question: '加标点：I like reading singing and dancing ___', answer: 'I like reading, singing, and dancing.' },
      { question: '加标点：What time does the train leave ___', answer: 'What time does the train leave?' },
    ],
  },

  word_choice: {
    title: '词汇选择',
    rule: '选词时要注意词义的准确性和搭配。近义词之间有细微差别（big/large/great），动词与宾语要合理搭配（make a decision, take a photo），避免中式英语直译。',
    examples: [
      { wrong: 'I hope you can come to my party very much.', correct: 'I really hope you can come to my party.' },
      { wrong: 'She did a photo with her friends.', correct: 'She took a photo with her friends.' },
      { wrong: 'The weather is very big today.', correct: 'The weather is great today.' },
    ],
    practices: [
      { question: '选词填空：She _____ a mistake in her homework. (did / made)', answer: 'made' },
      { question: '选词填空：Let\'s _____ a walk in the park. (do / take / make)', answer: 'take' },
      { question: '选词填空：He _____ his best to finish the work. (tried / did / made)', answer: 'tried' },
    ],
  },

  sentence_structure: {
    title: '句子结构',
    rule: '英语句子基本结构：主语 + 谓语（+ 宾语）。疑问句需要倒装（助动词提前）。从句需要连词引导。避免句子成分缺失或多余。',
    examples: [
      { wrong: 'Although it was raining, but we still went out.', correct: 'Although it was raining, we still went out.' },
      { wrong: 'Do you know where is the hospital?', correct: 'Do you know where the hospital is?' },
      { wrong: 'I very like English.', correct: 'I like English very much.' },
    ],
    practices: [
      { question: '改正错误：Because he was tired, so he went to bed early.', answer: 'Because he was tired, he went to bed early. （去掉 so）' },
      { question: '改正错误：She asked me where did I live.', answer: 'She asked me where I lived.' },
      { question: '改正错误：He is a very kind person who he helps everyone.', answer: 'He is a very kind person who helps everyone.' },
    ],
  },

  plural_singular: {
    title: '单复数',
    rule: '可数名词在表示两个或以上时用复数形式（通常加 -s/-es）。不规则复数需记忆（child→children, foot→feet, tooth→teeth）。不可数名词无复数形式。',
    examples: [
      { wrong: 'There are three book on the desk.', correct: 'There are three books on the desk.' },
      { wrong: 'The childs are playing outside.', correct: 'The children are playing outside.' },
      { wrong: 'She bought two breads at the bakery.', correct: 'She bought two loaves of bread at the bakery.' },
    ],
    practices: [
      { question: 'There are five _____ in the box. (tomato)', answer: 'tomatoes' },
      { question: 'I saw three _____ in the field. (sheep)', answer: 'sheep' },
      { question: 'He has two _____ in his mouth. (tooth)', answer: 'teeth' },
    ],
  },
};

export function getErrorExplanation(errorType: string): ErrorExplanation {
  return (
    ERROR_EXPLANATIONS[errorType] ?? {
      title: '语法错误',
      rule: '注意检查语法规则，确保句子结构正确，词汇使用恰当。',
      examples: [
        { wrong: '示例错误句子', correct: '示例正确句子' },
        { wrong: '示例错误句子 2', correct: '示例正确句子 2' },
        { wrong: '示例错误句子 3', correct: '示例正确句子 3' },
      ],
      practices: [
        { question: '练习题 1', answer: '答案 1' },
        { question: '练习题 2', answer: '答案 2' },
        { question: '练习题 3', answer: '答案 3' },
      ],
    }
  );
}
