// 全局变量
let words = [];
let currentReviewIndex = 0;
let reviewQueue = [];
let testMode = '';
let testQuestions = [];
let currentTestIndex = 0;
let testCorrect = 0;
let testTotal = 0;
let learningHistory = [];
let speechSynthesis = window.speechSynthesis;
let autoPlaySound = true;
let audioInitialized = false;

// 初始化音频上下文（解决微信浏览器限制）
function initAudio() {
    // 创建一个空的音频上下文
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // 播放一个静音的音频来激活音频上下文
    const silentBuffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = silentBuffer;
    source.connect(audioContext.destination);
    source.start();
    
    // 尝试初始化语音合成
    if (speechSynthesis) {
        // 创建一个临时的语音来激活语音合成
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        speechSynthesis.speak(utterance);
        speechSynthesis.cancel();
    }
    
    audioInitialized = true;
    
    // 隐藏初始化按钮
    const initBtn = document.getElementById('init-audio');
    if (initBtn) {
        initBtn.textContent = '已准备就绪';
        initBtn.disabled = true;
        initBtn.style.background = '#4bb543';
    }
    
    showMessage('音频已初始化，现在可以播放发音了！', 'success');
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initTheme(); // 初始化暗黑模式主题
    loadWords();
    loadLearningHistory();
    setupEventListeners();
    updateUI();
    initializeChart();
    displayCards();
    
    // 检测是否在微信浏览器中
    const isWechat = /MicroMessenger/i.test(navigator.userAgent);
    if (isWechat) {
        // 微信浏览器需要用户交互才能播放音频
        document.getElementById('init-audio').style.display = 'block';
    }
});

// 初始化主题（暗黑模式）
function initTheme() {
    const savedTheme = localStorage.getItem('wordMemoryTheme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const toggleBtn = document.getElementById('dark-mode-toggle');
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.body.classList.add('dark-mode');
        if (toggleBtn) toggleBtn.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        if (toggleBtn) toggleBtn.textContent = '🌙';
    }
}

// 切换暗黑模式
function toggleTheme() {
    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('wordMemoryTheme', 'light');
        if (toggleBtn) toggleBtn.textContent = '🌙';
        showMessage('已切换至浅色模式', 'info');
    } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('wordMemoryTheme', 'dark');
        if (toggleBtn) toggleBtn.textContent = '☀️';
        showMessage('已切换至深色模式', 'info');
    }
}

// 从localStorage加载单词
function loadWords() {
    const savedWords = localStorage.getItem('wordMemoryWords');
    if (savedWords) {
        words = JSON.parse(savedWords);
    }
    
    // 如果没有单词，添加预设的幼儿园启蒙英语词汇
    if (words.length === 0) {
        addPresetWords();
    }
}

// 添加预设的幼儿园启蒙英语词汇
function addPresetWords() {
    const presetWords = [
        // 动物 (15个)
        { english: "cat", chinese: "猫", phonetic: "/kæt/", partOfSpeech: "n.", example: "The cat is cute.", emoji: "🐱" },
        { english: "dog", chinese: "狗", phonetic: "/dɒɡ/", partOfSpeech: "n.", example: "I have a dog.", emoji: "🐶" },
        { english: "bird", chinese: "鸟", phonetic: "/bɜːd/", partOfSpeech: "n.", example: "The bird can fly.", emoji: "🐦" },
        { english: "fish", chinese: "鱼", phonetic: "/fɪʃ/", partOfSpeech: "n.", example: "The fish swims.", emoji: "🐟" },
        { english: "duck", chinese: "鸭子", phonetic: "/dʌk/", partOfSpeech: "n.", example: "The duck says quack.", emoji: "🦆" },
        { english: "rabbit", chinese: "兔子", phonetic: "/ˈræb.ɪt/", partOfSpeech: "n.", example: "The rabbit is white.", emoji: "🐰" },
        { english: "bear", chinese: "熊", phonetic: "/beə/", partOfSpeech: "n.", example: "The bear is big.", emoji: "🐻" },
        { english: "monkey", chinese: "猴子", phonetic: "/ˈmʌŋ.ki/", partOfSpeech: "n.", example: "The monkey likes bananas.", emoji: "🐵" },
        { english: "pig", chinese: "猪", phonetic: "/pɪɡ/", partOfSpeech: "n.", example: "The pig is pink.", emoji: "🐷" },
        { english: "cow", chinese: "牛", phonetic: "/kaʊ/", partOfSpeech: "n.", example: "The cow says moo.", emoji: "🐮" },
        { english: "horse", chinese: "马", phonetic: "/hɔːs/", partOfSpeech: "n.", example: "The horse can run.", emoji: "🐴" },
        { english: "elephant", chinese: "大象", phonetic: "/ˈel.ɪ.fənt/", partOfSpeech: "n.", example: "The elephant is big.", emoji: "🐘" },
        { english: "lion", chinese: "狮子", phonetic: "/ˈlaɪ.ən/", partOfSpeech: "n.", example: "The lion is strong.", emoji: "🦁" },
        { english: "tiger", chinese: "老虎", phonetic: "/ˈtaɪ.ɡə/", partOfSpeech: "n.", example: "The tiger has stripes.", emoji: "🐯" },
        { english: "panda", chinese: "熊猫", phonetic: "/ˈpæn.də/", partOfSpeech: "n.", example: "The panda eats bamboo.", emoji: "🐼" },
        
        // 颜色 (8个)
        { english: "red", chinese: "红色", phonetic: "/red/", partOfSpeech: "adj.", example: "The apple is red.", emoji: "🔴" },
        { english: "blue", chinese: "蓝色", phonetic: "/bluː/", partOfSpeech: "adj.", example: "The sky is blue.", emoji: "🔵" },
        { english: "yellow", chinese: "黄色", phonetic: "/ˈjel.əʊ/", partOfSpeech: "adj.", example: "The banana is yellow.", emoji: "🟡" },
        { english: "green", chinese: "绿色", phonetic: "/ɡriːn/", partOfSpeech: "adj.", example: "The grass is green.", emoji: "🟢" },
        { english: "pink", chinese: "粉色", phonetic: "/pɪŋk/", partOfSpeech: "adj.", example: "I like pink.", emoji: "🌸" },
        { english: "white", chinese: "白色", phonetic: "/waɪt/", partOfSpeech: "adj.", example: "The snow is white.", emoji: "⚪" },
        { english: "black", chinese: "黑色", phonetic: "/blæk/", partOfSpeech: "adj.", example: "The cat is black.", emoji: "⚫" },
        { english: "orange", chinese: "橙色", phonetic: "/ˈɒr.ɪndʒ/", partOfSpeech: "adj.", example: "The orange is orange.", emoji: "🟠" },
        
        // 数字 (10个)
        { english: "one", chinese: "一", phonetic: "/wʌn/", partOfSpeech: "num.", example: "I have one apple.", emoji: "1️⃣" },
        { english: "two", chinese: "二", phonetic: "/tuː/", partOfSpeech: "num.", example: "I have two eyes.", emoji: "2️⃣" },
        { english: "three", chinese: "三", phonetic: "/θriː/", partOfSpeech: "num.", example: "I am three years old.", emoji: "3️⃣" },
        { english: "four", chinese: "四", phonetic: "/fɔː/", partOfSpeech: "num.", example: "I have four legs.", emoji: "4️⃣" },
        { english: "five", chinese: "五", phonetic: "/faɪv/", partOfSpeech: "num.", example: "I have five fingers.", emoji: "5️⃣" },
        { english: "six", chinese: "六", phonetic: "/sɪks/", partOfSpeech: "num.", example: "I am six years old.", emoji: "6️⃣" },
        { english: "seven", chinese: "七", phonetic: "/ˈsev.ən/", partOfSpeech: "num.", example: "There are seven days.", emoji: "7️⃣" },
        { english: "eight", chinese: "八", phonetic: "/eɪt/", partOfSpeech: "num.", example: "I have eight toys.", emoji: "8️⃣" },
        { english: "nine", chinese: "九", phonetic: "/naɪn/", partOfSpeech: "num.", example: "I am nine years old.", emoji: "9️⃣" },
        { english: "ten", chinese: "十", phonetic: "/ten/", partOfSpeech: "num.", example: "I can count to ten.", emoji: "🔟" },
        
        // 身体部位 (10个)
        { english: "head", chinese: "头", phonetic: "/hed/", partOfSpeech: "n.", example: "I nod my head.", emoji: "😊" },
        { english: "eye", chinese: "眼睛", phonetic: "/aɪ/", partOfSpeech: "n.", example: "I have two eyes.", emoji: "👀" },
        { english: "ear", chinese: "耳朵", phonetic: "/ɪə/", partOfSpeech: "n.", example: "I hear with my ears.", emoji: "👂" },
        { english: "nose", chinese: "鼻子", phonetic: "/nəʊz/", partOfSpeech: "n.", example: "I smell with my nose.", emoji: "👃" },
        { english: "mouth", chinese: "嘴巴", phonetic: "/maʊθ/", partOfSpeech: "n.", example: "I eat with my mouth.", emoji: "👄" },
        { english: "hand", chinese: "手", phonetic: "/hænd/", partOfSpeech: "n.", example: "I wave my hand.", emoji: "🤚" },
        { english: "foot", chinese: "脚", phonetic: "/fʊt/", partOfSpeech: "n.", example: "I kick with my foot.", emoji: "🦶" },
        { english: "arm", chinese: "胳膊", phonetic: "/ɑːm/", partOfSpeech: "n.", example: "I hug with my arms.", emoji: "💪" },
        { english: "leg", chinese: "腿", phonetic: "/leɡ/", partOfSpeech: "n.", example: "I have two legs.", emoji: "🦵" },
        { english: "face", chinese: "脸", phonetic: "/feɪs/", partOfSpeech: "n.", example: "I wash my face.", emoji: "😊" },
        
        // 家庭 (6个)
        { english: "mom", chinese: "妈妈", phonetic: "/mɒm/", partOfSpeech: "n.", example: "I love my mom.", emoji: "👩" },
        { english: "dad", chinese: "爸爸", phonetic: "/dæd/", partOfSpeech: "n.", example: "My dad is tall.", emoji: "👨" },
        { english: "baby", chinese: "宝宝", phonetic: "/ˈbeɪ.bi/", partOfSpeech: "n.", example: "The baby is cute.", emoji: "👶" },
        { english: "sister", chinese: "姐姐", phonetic: "/ˈsɪs.tə/", partOfSpeech: "n.", example: "My sister is nice.", emoji: "👧" },
        { english: "brother", chinese: "哥哥", phonetic: "/ˈbrʌð.ə/", partOfSpeech: "n.", example: "My brother is big.", emoji: "👦" },
        { english: "family", chinese: "家人", phonetic: "/ˈfæm.əl.i/", partOfSpeech: "n.", example: "I love my family.", emoji: "👨‍👩‍👧‍👦" },
        
        // 食物 (12个)
        { english: "apple", chinese: "苹果", phonetic: "/ˈæp.əl/", partOfSpeech: "n.", example: "I like apples.", emoji: "🍎" },
        { english: "banana", chinese: "香蕉", phonetic: "/bəˈnæn.ə/", partOfSpeech: "n.", example: "The banana is yellow.", emoji: "🍌" },
        { english: "milk", chinese: "牛奶", phonetic: "/mɪlk/", partOfSpeech: "n.", example: "I drink milk.", emoji: "🥛" },
        { english: "water", chinese: "水", phonetic: "/ˈwɔː.tə/", partOfSpeech: "n.", example: "I drink water.", emoji: "💧" },
        { english: "bread", chinese: "面包", phonetic: "/bred/", partOfSpeech: "n.", example: "I eat bread.", emoji: "🍞" },
        { english: "cake", chinese: "蛋糕", phonetic: "/keɪk/", partOfSpeech: "n.", example: "I like cake.", emoji: "🎂" },
        { english: "egg", chinese: "鸡蛋", phonetic: "/eɡ/", partOfSpeech: "n.", example: "I eat an egg.", emoji: "🥚" },
        { english: "rice", chinese: "米饭", phonetic: "/raɪs/", partOfSpeech: "n.", example: "I eat rice.", emoji: "🍚" },
        { english: "candy", chinese: "糖果", phonetic: "/ˈkæn.di/", partOfSpeech: "n.", example: "I like candy.", emoji: "🍬" },
        { english: "cookie", chinese: "饼干", phonetic: "/ˈkʊk.i/", partOfSpeech: "n.", example: "I eat a cookie.", emoji: "🍪" },
        { english: "grape", chinese: "葡萄", phonetic: "/ɡreɪp/", partOfSpeech: "n.", example: "I like grapes.", emoji: "🍇" },
        { english: "strawberry", chinese: "草莓", phonetic: "/ˈstrɔː.bər.i/", partOfSpeech: "n.", example: "The strawberry is red.", emoji: "🍓" },
        
        // 物品 (12个)
        { english: "book", chinese: "书", phonetic: "/bʊk/", partOfSpeech: "n.", example: "I read a book.", emoji: "📖" },
        { english: "pen", chinese: "笔", phonetic: "/pen/", partOfSpeech: "n.", example: "I write with a pen.", emoji: "✏️" },
        { english: "ball", chinese: "球", phonetic: "/bɔːl/", partOfSpeech: "n.", example: "I play with a ball.", emoji: "⚽" },
        { english: "toy", chinese: "玩具", phonetic: "/tɔɪ/", partOfSpeech: "n.", example: "I like my toy.", emoji: "🧸" },
        { english: "car", chinese: "汽车", phonetic: "/kɑː/", partOfSpeech: "n.", example: "The car is fast.", emoji: "🚗" },
        { english: "bus", chinese: "公交车", phonetic: "/bʌs/", partOfSpeech: "n.", example: "I ride the bus.", emoji: "🚌" },
        { english: "house", chinese: "房子", phonetic: "/haʊs/", partOfSpeech: "n.", example: "I live in a house.", emoji: "🏠" },
        { english: "door", chinese: "门", phonetic: "/dɔː/", partOfSpeech: "n.", example: "Open the door.", emoji: "🚪" },
        { english: "bed", chinese: "床", phonetic: "/bed/", partOfSpeech: "n.", example: "I sleep in my bed.", emoji: "🛏️" },
        { english: "cup", chinese: "杯子", phonetic: "/kʌp/", partOfSpeech: "n.", example: "I drink from a cup.", emoji: "🥤" },
        { english: "shoe", chinese: "鞋子", phonetic: "/ʃuː/", partOfSpeech: "n.", example: "I wear shoes.", emoji: "👟" },
        { english: "hat", chinese: "帽子", phonetic: "/hæt/", partOfSpeech: "n.", example: "I wear a hat.", emoji: "🧢" },
        
        // 自然 (6个)
        { english: "sun", chinese: "太阳", phonetic: "/sʌn/", partOfSpeech: "n.", example: "The sun is bright.", emoji: "☀️" },
        { english: "moon", chinese: "月亮", phonetic: "/muːn/", partOfSpeech: "n.", example: "The moon is at night.", emoji: "🌙" },
        { english: "star", chinese: "星星", phonetic: "/stɑː/", partOfSpeech: "n.", example: "I see a star.", emoji: "⭐" },
        { english: "tree", chinese: "树", phonetic: "/triː/", partOfSpeech: "n.", example: "The tree is tall.", emoji: "🌳" },
        { english: "flower", chinese: "花", phonetic: "/ˈflaʊ.ə/", partOfSpeech: "n.", example: "The flower is pretty.", emoji: "🌸" },
        { english: "sky", chinese: "天空", phonetic: "/skaɪ/", partOfSpeech: "n.", example: "The sky is blue.", emoji: "🌤️" },
        
        // 动作 (10个)
        { english: "eat", chinese: "吃", phonetic: "/iːt/", partOfSpeech: "v.", example: "I eat food.", emoji: "🍽️" },
        { english: "drink", chinese: "喝", phonetic: "/drɪŋk/", partOfSpeech: "v.", example: "I drink water.", emoji: "🥤" },
        { english: "sleep", chinese: "睡觉", phonetic: "/sliːp/", partOfSpeech: "v.", example: "I sleep at night.", emoji: "😴" },
        { english: "run", chinese: "跑", phonetic: "/rʌn/", partOfSpeech: "v.", example: "I can run fast.", emoji: "🏃" },
        { english: "walk", chinese: "走", phonetic: "/wɔːk/", partOfSpeech: "v.", example: "I walk to school.", emoji: "🚶" },
        { english: "jump", chinese: "跳", phonetic: "/dʒʌmp/", partOfSpeech: "v.", example: "I can jump high.", emoji: "🦘" },
        { english: "sit", chinese: "坐", phonetic: "/sɪt/", partOfSpeech: "v.", example: "I sit down.", emoji: "🪑" },
        { english: "stand", chinese: "站", phonetic: "/stænd/", partOfSpeech: "v.", example: "I stand up.", emoji: "🧍" },
        { english: "sing", chinese: "唱歌", phonetic: "/sɪŋ/", partOfSpeech: "v.", example: "I like to sing.", emoji: "🎤" },
        { english: "play", chinese: "玩", phonetic: "/pleɪ/", partOfSpeech: "v.", example: "I like to play.", emoji: "🎮" },
        
        // 形容词 (8个)
        { english: "big", chinese: "大", phonetic: "/bɪɡ/", partOfSpeech: "adj.", example: "The elephant is big.", emoji: "🐘" },
        { english: "small", chinese: "小", phonetic: "/smɔːl/", partOfSpeech: "adj.", example: "The mouse is small.", emoji: "🐁" },
        { english: "happy", chinese: "快乐", phonetic: "/ˈhæp.i/", partOfSpeech: "adj.", example: "I am happy.", emoji: "😊" },
        { english: "sad", chinese: "伤心", phonetic: "/sæd/", partOfSpeech: "adj.", example: "She is sad.", emoji: "😢" },
        { english: "good", chinese: "好", phonetic: "/ɡʊd/", partOfSpeech: "adj.", example: "You are good.", emoji: "👍" },
        { english: "hot", chinese: "热", phonetic: "/hɒt/", partOfSpeech: "adj.", example: "It is hot today.", emoji: "🔥" },
        { english: "cold", chinese: "冷", phonetic: "/kəʊld/", partOfSpeech: "adj.", example: "It is cold outside.", emoji: "❄️" },
        { english: "pretty", chinese: "漂亮", phonetic: "/ˈprɪt.i/", partOfSpeech: "adj.", example: "The flower is pretty.", emoji: "✨" },
        
        // 方位/问候 (4个)
        { english: "up", chinese: "上", phonetic: "/ʌp/", partOfSpeech: "adv.", example: "Look up.", emoji: "⬆️" },
        { english: "down", chinese: "下", phonetic: "/daʊn/", partOfSpeech: "adv.", example: "Sit down.", emoji: "⬇️" },
        { english: "hello", chinese: "你好", phonetic: "/heˈləʊ/", partOfSpeech: "int.", example: "Hello, how are you?", emoji: "👋" },
        { english: "thank you", chinese: "谢谢", phonetic: "/θæŋk juː/", partOfSpeech: "phrase", example: "Thank you very much.", emoji: "🙏" }
    ];
    
    presetWords.forEach((wordData, index) => {
        const newWord = {
            id: Date.now() + index,
            english: wordData.english,
            chinese: wordData.chinese,
            phonetic: wordData.phonetic,
            partOfSpeech: wordData.partOfSpeech,
            example: wordData.example,
            emoji: wordData.emoji || '',
            createdAt: new Date().toISOString(),
            lastReviewed: null,
            nextReview: new Date().toISOString(),
            reviewCount: 0,
            easeFactor: 2.5,
            interval: 0,
            mastered: false
        };
        words.push(newWord);
    });
    
    saveWords();
    updateUI();
}

// 保存单词到localStorage
function saveWords() {
    localStorage.setItem('wordMemoryWords', JSON.stringify(words));
}

// 加载学习历史
function loadLearningHistory() {
    const savedHistory = localStorage.getItem('learningHistory');
    if (savedHistory) {
        learningHistory = JSON.parse(savedHistory);
    } else {
        // 初始化最近7天的数据
        learningHistory = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            learningHistory.push({
                date: date.toISOString().split('T')[0],
                learned: 0,
                reviewed: 0
            });
        }
    }
}

// 保存学习历史
function saveLearningHistory() {
    localStorage.setItem('learningHistory', JSON.stringify(learningHistory));
}

// 设置事件监听器
function setupEventListeners() {
    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // 暗黑模式切换
    const themeBtn = document.getElementById('dark-mode-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    // 单词表单提交
    document.getElementById('word-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addWord();
    });
    
    // 复习按钮
    document.getElementById('start-review').addEventListener('click', startReview);
    document.getElementById('show-answer').addEventListener('click', showAnswer);
    
    // 评分按钮
    document.querySelectorAll('.btn.rating').forEach(btn => {
        btn.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            rateWord(rating);
        });
    });
    
    // 卡片控制
    document.getElementById('shuffle-cards').addEventListener('click', shuffleCards);
    document.getElementById('show-all-cards').addEventListener('click', showAllCards);
    
    // 测试模式按钮
    document.querySelectorAll('.btn.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            testMode = this.getAttribute('data-mode');
            document.querySelectorAll('.btn.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            startTest();
        });
    });
    
    // 测试提交
    document.getElementById('test-submit').addEventListener('click', submitTestAnswer);
    document.getElementById('next-question').addEventListener('click', nextTestQuestion);
    
    // 导入导出
    document.getElementById('import-btn').addEventListener('click', importWords);
    document.getElementById('export-csv').addEventListener('click', exportCSV);
    document.getElementById('export-json').addEventListener('click', exportJSON);
    
    // 测试输入回车
    document.getElementById('test-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitTestAnswer();
        }
    });
}

// 切换标签页
function switchTab(tabId) {
    // 更新按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        }
    });
    
    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    
    // 根据标签页更新特定内容
    if (tabId === 'cards') {
        displayCards();
    } else if (tabId === 'stats') {
        updateStats();
    } else if (tabId === 'review') {
        updateReviewStats();
    }
}

// 添加新单词
function addWord() {
    const english = document.getElementById('english').value.trim();
    const chinese = document.getElementById('chinese').value.trim();
    const phonetic = document.getElementById('phonetic').value.trim();
    const partOfSpeech = document.getElementById('part-of-speech').value;
    const example = document.getElementById('example').value.trim();
    const emoji = document.getElementById('emoji') ? document.getElementById('emoji').value.trim() : '';
    
    if (!english || !chinese) {
        alert('请输入英文单词和中文释义');
        return;
    }
    
    // 检查是否已存在
    const exists = words.some(word => word.english.toLowerCase() === english.toLowerCase());
    if (exists) {
        alert('该单词已存在');
        return;
    }
    
    const newWord = {
        id: Date.now(),
        english: english,
        chinese: chinese,
        phonetic: phonetic,
        partOfSpeech: partOfSpeech,
        example: example,
        emoji: emoji,
        createdAt: new Date().toISOString(),
        lastReviewed: null,
        nextReview: new Date().toISOString(),
        reviewCount: 0,
        easeFactor: 2.5,
        interval: 0,
        mastered: false
    };
    
    words.push(newWord);
    saveWords();
    
    // 更新今日学习统计
    updateTodayLearned(1);
    
    // 清空表单
    document.getElementById('word-form').reset();
    
    // 更新UI
    updateUI();
    
    // 显示成功消息
    showMessage('单词添加成功！', 'success');
}

// 更新今日学习统计
function updateTodayLearned(count) {
    const today = new Date().toISOString().split('T')[0];
    const todayData = learningHistory.find(item => item.date === today);
    
    if (todayData) {
        todayData.learned += count;
    } else {
        learningHistory.push({
            date: today,
            learned: count,
            reviewed: 0
        });
        
        // 只保留最近30天的数据
        if (learningHistory.length > 30) {
            learningHistory = learningHistory.slice(-30);
        }
    }
    
    saveLearningHistory();
}

// 更新今日复习统计
function updateTodayReviewed(count) {
    const today = new Date().toISOString().split('T')[0];
    const todayData = learningHistory.find(item => item.date === today);
    
    if (todayData) {
        todayData.reviewed += count;
    } else {
        learningHistory.push({
            date: today,
            learned: 0,
            reviewed: count
        });
    }
    
    saveLearningHistory();
}

// 显示消息
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    
    if (type === 'success') {
        messageDiv.style.background = '#4bb543';
    } else if (type === 'error') {
        messageDiv.style.background = '#d9534f';
    } else {
        messageDiv.style.background = '#4361ee';
    }
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// 更新UI
function updateUI() {
    updateWordList();
    updateReviewStats();
    updateStats();
}

// 更新单词列表
function updateWordList() {
    const container = document.getElementById('word-list-container');
    const countElement = document.getElementById('word-count');
    
    countElement.textContent = words.length;
    
    if (words.length === 0) {
        container.innerHTML = '<p class="empty-message">还没有录入单词，请添加新单词。</p>';
        return;
    }
    
    container.innerHTML = '';
    
    // 按创建时间倒序显示
    const sortedWords = [...words].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    sortedWords.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-item fade-in';
        wordElement.innerHTML = `
            <div class="word-info">
                <strong>${word.english}</strong>
                <span class="word-chinese">${word.chinese}</span>
                ${word.partOfSpeech ? `<span class="word-pos">${word.partOfSpeech}</span>` : ''}
            </div>
            <div class="word-actions">
                <button class="btn-icon" onclick="editWord(${word.id})" title="编辑">✏️</button>
                <button class="btn-icon" onclick="deleteWord(${word.id})" title="删除">🗑️</button>
            </div>
        `;
        container.appendChild(wordElement);
    });
}

// 编辑单词
function editWord(id) {
    const word = words.find(w => w.id === id);
    if (!word) return;
    
    const newEnglish = prompt('请输入英文单词:', word.english);
    if (newEnglish === null) return;
    
    const newChinese = prompt('请输入中文释义:', word.chinese);
    if (newChinese === null) return;
    
    const newPhonetic = prompt('请输入音标:', word.phonetic || '');
    const newPartOfSpeech = prompt('请输入词性:', word.partOfSpeech || '');
    const newExample = prompt('请输入例句:', word.example || '');
    const newEmoji = prompt('请输入Emoji图片:', word.emoji || '');
    
    word.english = newEnglish.trim() || word.english;
    word.chinese = newChinese.trim() || word.chinese;
    word.phonetic = newPhonetic ? newPhonetic.trim() : word.phonetic;
    word.partOfSpeech = newPartOfSpeech ? newPartOfSpeech.trim() : word.partOfSpeech;
    word.example = newExample ? newExample.trim() : word.example;
    word.emoji = newEmoji ? newEmoji.trim() : word.emoji;
    
    saveWords();
    updateUI();
    showMessage('单词更新成功！', 'success');
}

// 删除单词
function deleteWord(id) {
    if (!confirm('确定要删除这个单词吗？')) return;
    
    words = words.filter(w => w.id !== id);
    saveWords();
    updateUI();
    showMessage('单词已删除', 'info');
}

// 朗读单词
function speakWord(text, lang = 'en-US') {
    if (!speechSynthesis) {
        showMessage('您的浏览器不支持语音合成', 'error');
        return;
    }
    
    // 检查是否在微信浏览器中且未初始化
    const isWechat = /MicroMessenger/i.test(navigator.userAgent);
    if (isWechat && !audioInitialized) {
        showMessage('请点击"开始学习"按钮后再播放发音', 'info');
        return;
    }
    
    // 取消之前的朗读
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.6; // 语速更慢，适合小朋友学习
    utterance.pitch = 1.1; // 音调稍高，更适合小朋友
    
    speechSynthesis.speak(utterance);
}

// 朗读例句
function speakExample(btn) {
    const text = btn.getAttribute('data-text');
    if (text) {
        speakWord(text, 'en-US');
    }
}

// 切换自动播放声音
function toggleAutoPlay() {
    autoPlaySound = !autoPlaySound;
    const btn = document.getElementById('auto-play-toggle');
    if (btn) {
        btn.textContent = autoPlaySound ? '🔊 自动播放' : '🔇 静音';
    }
}

// 开始复习
function startReview() {
    const now = new Date();
    
    // 筛选需要复习的单词（下次复习时间已到）
    reviewQueue = words.filter(word => {
        const nextReview = new Date(word.nextReview);
        return nextReview <= now && !word.mastered;
    });
    
    // 按下次复习时间排序
    reviewQueue.sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview));
    
    if (reviewQueue.length === 0) {
        showMessage('没有需要复习的单词！', 'info');
        return;
    }
    
    currentReviewIndex = 0;
    document.getElementById('review-area').classList.remove('hidden');
    document.getElementById('start-review').textContent = '复习中...';
    document.getElementById('start-review').disabled = true;
    
    showReviewCard();
}

// 显示复习卡片
function showReviewCard() {
    if (currentReviewIndex >= reviewQueue.length) {
        finishReview();
        return;
    }
    
    const word = reviewQueue[currentReviewIndex];
    
    // 更新正面
    document.getElementById('review-emoji').textContent = word.emoji || '';
    document.getElementById('review-english').textContent = word.english;
    document.getElementById('review-phonetic').textContent = word.phonetic ? `/${word.phonetic}/` : '';
    document.getElementById('review-pos').textContent = word.partOfSpeech || '';
    
    // 更新背面
    document.getElementById('review-chinese').textContent = word.chinese;
    document.getElementById('review-example').textContent = word.example ? `例句: ${word.example}` : '';
    
    // 重置卡片状态
    document.querySelector('.flashcard-inner').classList.remove('flipped');
    
    // 自动朗读单词
    if (autoPlaySound) {
        setTimeout(() => speakWord(word.english), 300);
    }
    
    // 更新进度
    updateReviewProgress();
}

// 显示答案
function showAnswer() {
    document.querySelector('.flashcard-inner').classList.add('flipped');
}

// 评分单词
function rateWord(rating) {
    const word = reviewQueue[currentReviewIndex];
    
    // 使用SM-2算法更新单词
    updateWordWithSM2(word, rating);
    
    // 更新复习统计
    updateTodayReviewed(1);
    
    // 下一张卡片
    currentReviewIndex++;
    showReviewCard();
}

// SM-2间隔重复算法
function updateWordWithSM2(word, quality) {
    // quality: 1-不认识, 2-模糊, 3-认识, 4-熟悉
    
    // 更新复习次数
    word.reviewCount++;
    word.lastReviewed = new Date().toISOString();
    
    // SM-2算法参数
    let { easeFactor, interval } = word;
    
    if (quality < 3) {
        // 不认识或模糊，重置间隔
        interval = 1;
    } else {
        // 认识或熟悉
        if (interval === 0) {
            interval = 1;
        } else if (interval === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
    }
    
    // 更新ease factor
    easeFactor = easeFactor + (0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;
    
    // 计算下次复习时间
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    
    // 更新单词数据
    word.interval = interval;
    word.easeFactor = easeFactor;
    word.nextReview = nextReview.toISOString();
    
    // 检查是否已掌握（连续3次评分为4）
    if (quality === 4 && word.reviewCount >= 3 && interval >= 21) {
        word.mastered = true;
    }
    
    saveWords();
}

// 完成复习
function finishReview() {
    document.getElementById('review-area').classList.add('hidden');
    document.getElementById('start-review').textContent = '开始复习';
    document.getElementById('start-review').disabled = false;
    
    showMessage(`复习完成！共复习 ${reviewQueue.length} 个单词`, 'success');
    updateReviewStats();
}

// 更新复习进度
function updateReviewProgress() {
    const progress = ((currentReviewIndex + 1) / reviewQueue.length) * 100;
    document.getElementById('review-progress').style.width = `${progress}%`;
}

// 更新复习统计
function updateReviewStats() {
    const now = new Date();
    
    const pendingCount = words.filter(word => {
        const nextReview = new Date(word.nextReview);
        return nextReview <= now && !word.mastered;
    }).length;
    
    const masteredCount = words.filter(word => word.mastered).length;
    
    document.getElementById('review-pending').textContent = pendingCount;
    document.getElementById('review-mastered').textContent = masteredCount;
}

// 显示卡片
function displayCards() {
    const container = document.getElementById('cards-container');
    
    if (words.length === 0) {
        container.innerHTML = '<p class="empty-message">还没有录入单词，请先添加单词。</p>';
        return;
    }
    
    container.innerHTML = '';
    
    const macaronColors = ['macaron-pink', 'macaron-blue', 'macaron-green', 'macaron-purple', 
                          'macaron-yellow', 'macaron-orange', 'macaron-mint', 'macaron-lavender'];
    
    words.forEach((word, index) => {
        const card = document.createElement('div');
        const randomColor = macaronColors[index % macaronColors.length];
        card.className = `card fade-in ${randomColor}`;
        const exampleHtml = word.example ? `<p><strong>例句:</strong> ${word.example} <button class="btn-icon sound-btn-sm" onclick="speakExample(this)" data-text="${word.example.replace(/"/g, '&quot;')}">🔊</button></p>` : '';
        card.innerHTML = `
            <div class="card-header">
                ${word.emoji ? `<div class="card-emoji">${word.emoji}</div>` : ''}
                <h3>${word.english}</h3>
                ${word.phonetic ? `<p>/${word.phonetic}/</p>` : ''}
                <button class="btn-icon sound-btn" onclick="speakWord('${word.english}')">🔊</button>
            </div>
            <div class="card-body">
                <p><strong>中文释义:</strong> ${word.chinese}</p>
                ${word.partOfSpeech ? `<p><strong>词性:</strong> ${word.partOfSpeech}</p>` : ''}
                ${exampleHtml}
            </div>
            <div class="card-footer">
                <small>复习次数: ${word.reviewCount} | 掌握程度: ${getMasteryLevel(word)}</small>
            </div>
        `;
        container.appendChild(card);
    });
}

// 获取掌握程度
function getMasteryLevel(word) {
    if (word.mastered) return '已掌握';
    if (word.reviewCount === 0) return '未学习';
    if (word.interval < 3) return '初学';
    if (word.interval < 7) return '熟悉';
    if (word.interval < 21) return '掌握';
    return '精通';
}

// 随机排序卡片
function shuffleCards() {
    const container = document.getElementById('cards-container');
    const cards = Array.from(container.children);
    
    // Fisher-Yates洗牌算法
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        container.insertBefore(cards[j], cards[i]);
    }
}

// 显示全部卡片
function showAllCards() {
    displayCards();
}

// 开始测试
function startTest() {
    if (words.length < 4) {
        showMessage('需要至少4个单词才能开始测试', 'error');
        return;
    }
    
    document.getElementById('test-area').classList.remove('hidden');
    
    // 准备测试题目
    prepareTestQuestions();
    
    // 显示第一题
    showTestQuestion();
}

// 准备测试题目
function prepareTestQuestions() {
    testQuestions = [];
    testCorrect = 0;
    testTotal = 0;
    currentTestIndex = 0;
    
    // 随机选择10个单词（或全部如果少于10个）
    const questionCount = Math.min(10, words.length);
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, questionCount);
    
    selectedWords.forEach(word => {
        const question = {
            word: word,
            type: testMode
        };
        
        if (testMode === 'en-to-cn' || testMode === 'cn-to-en') {
            // 生成选项
            question.options = generateOptions(word);
        }
        
        testQuestions.push(question);
    });
    
    // 更新测试统计
    document.getElementById('test-total').textContent = testQuestions.length;
    document.getElementById('test-current').textContent = 0;
    document.getElementById('test-accuracy').textContent = '0%';
}

// 生成选项
function generateOptions(correctWord) {
    const options = [correctWord];
    
    // 添加3个错误选项
    const otherWords = words.filter(w => w.id !== correctWord.id);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 3 && i < shuffledOthers.length; i++) {
        options.push(shuffledOthers[i]);
    }
    
    // 随机排序选项
    return options.sort(() => Math.random() - 0.5);
}

// 显示测试题目
function showTestQuestion() {
    if (currentTestIndex >= testQuestions.length) {
        finishTest();
        return;
    }
    
    const question = testQuestions[currentTestIndex];
    const promptElement = document.getElementById('test-prompt');
    const optionsContainer = document.getElementById('test-options');
    const inputElement = document.getElementById('test-input');
    const submitBtn = document.getElementById('test-submit');
    
    // 隐藏反馈区域
    document.querySelector('.test-feedback').classList.add('hidden');
    
    if (testMode === 'en-to-cn') {
        promptElement.textContent = question.word.english;
        optionsContainer.innerHTML = '';
        optionsContainer.classList.remove('hidden');
        inputElement.classList.add('hidden');
        
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option.chinese;
            button.addEventListener('click', () => selectTestOption(option, question.word));
            optionsContainer.appendChild(button);
        });
        
        submitBtn.classList.add('hidden');
    } else if (testMode === 'cn-to-en') {
        promptElement.textContent = question.word.chinese;
        optionsContainer.innerHTML = '';
        optionsContainer.classList.remove('hidden');
        inputElement.classList.add('hidden');
        
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option.english;
            button.addEventListener('click', () => selectTestOption(option, question.word));
            optionsContainer.appendChild(button);
        });
        
        submitBtn.classList.add('hidden');
    } else if (testMode === 'spelling') {
        promptElement.textContent = question.word.chinese;
        optionsContainer.classList.add('hidden');
        inputElement.classList.remove('hidden');
        inputElement.value = '';
        inputElement.focus();
        submitBtn.classList.remove('hidden');
    }
}

// 选择测试选项
function selectTestOption(selectedOption, correctWord) {
    const isCorrect = selectedOption.id === correctWord.id;
    
    // 显示反馈
    showTestFeedback(isCorrect, correctWord);
    
    // 更新统计
    testTotal++;
    if (isCorrect) testCorrect++;
    
    // 禁用所有选项
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === (testMode === 'en-to-cn' ? correctWord.chinese : correctWord.english)) {
            btn.classList.add('correct');
        }
    });
}

// 提交测试答案（拼写测试）
function submitTestAnswer() {
    if (testMode !== 'spelling') return;
    
    const question = testQuestions[currentTestIndex];
    const userAnswer = document.getElementById('test-input').value.trim().toLowerCase();
    const correctAnswer = question.word.english.toLowerCase();
    
    const isCorrect = userAnswer === correctAnswer;
    
    // 显示反馈
    showTestFeedback(isCorrect, question.word);
    
    // 更新统计
    testTotal++;
    if (isCorrect) testCorrect++;
}

// 显示测试反馈
function showTestFeedback(isCorrect, correctWord) {
    const feedbackElement = document.querySelector('.test-feedback');
    const resultElement = document.getElementById('test-result');
    
    feedbackElement.classList.remove('hidden');
    
    // 移除之前的动画类以允许重复触发
    feedbackElement.classList.remove('correct-bounce', 'incorrect-shake');
    // 触发重绘
    void feedbackElement.offsetWidth;
    
    if (isCorrect) {
        resultElement.innerHTML = `<span style="color: var(--success-color); font-weight: 700;">✓ 正确！</span>`;
        feedbackElement.classList.add('correct-bounce');
    } else {
        resultElement.innerHTML = `<span style="color: var(--danger-color); font-weight: 700;">✗ 错误！正确答案是: ${correctWord.english} - ${correctWord.chinese}</span>`;
        feedbackElement.classList.add('incorrect-shake');
    }
    
    // 更新准确率
    const accuracy = testTotal > 0 ? Math.round((testCorrect / testTotal) * 100) : 0;
    document.getElementById('test-accuracy').textContent = `${accuracy}%`;
    document.getElementById('test-current').textContent = testTotal;
}

// 下一题
function nextTestQuestion() {
    currentTestIndex++;
    showTestQuestion();
}

// 完成测试
function finishTest() {
    document.getElementById('test-area').classList.add('hidden');
    
    const accuracy = testTotal > 0 ? Math.round((testCorrect / testTotal) * 100) : 0;
    
    showMessage(`测试完成！正确率: ${accuracy}% (${testCorrect}/${testTotal})`, 'success');
    
    // 更新学习历史
    updateTodayReviewed(testTotal);
}

// 更新统计信息
function updateStats() {
    const totalWords = words.length;
    const masteredWords = words.filter(w => w.mastered).length;
    const now = new Date();
    const pendingWords = words.filter(w => {
        const nextReview = new Date(w.nextReview);
        return nextReview <= now && !w.mastered;
    }).length;
    
    // 获取今日学习数量
    const today = new Date().toISOString().split('T')[0];
    const todayData = learningHistory.find(item => item.date === today);
    const todayLearned = todayData ? todayData.learned : 0;
    
    // 更新显示
    document.getElementById('total-words').textContent = totalWords;
    document.getElementById('mastered-words').textContent = masteredWords;
    document.getElementById('pending-words').textContent = pendingWords;
    document.getElementById('today-learned').textContent = todayLearned;
}

// 初始化图表
function initializeChart() {
    const canvas = document.getElementById('learning-chart');
    const ctx = canvas.getContext('2d');
    
    // 确保canvas有宽度
    const parentWidth = canvas.parentElement.offsetWidth;
    if (parentWidth === 0) {
        // 如果父元素宽度为0，延迟重试
        setTimeout(initializeChart, 100);
        return;
    }
    
    // 设置canvas尺寸
    canvas.width = parentWidth - 50;
    canvas.height = 200;
    
    drawChart(ctx, canvas.width, canvas.height);
}

// 绘制图表
function drawChart(ctx, width, height) {
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 获取最近7天的数据
    const last7Days = learningHistory.slice(-7);
    
    if (last7Days.length === 0) return;
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // 找出最大值
    const maxValue = Math.max(
        ...last7Days.map(d => Math.max(d.learned, d.reviewed)),
        1
    );
    
    // 绘制坐标轴
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 1;
    
    // X轴
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Y轴
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // 绘制网格线
    ctx.strokeStyle = '#f5f7fa';
    for (let i = 1; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // 绘制数据
    const groupWidth = chartWidth / last7Days.length;
    const barWidth = groupWidth / 4;
    
    last7Days.forEach((day, index) => {
        const groupX = padding + groupWidth * index;
        const x = groupX + barWidth;
        
        // 学习数量柱状图
        const learnedHeight = (day.learned / maxValue) * chartHeight;
        ctx.fillStyle = '#4361ee';
        ctx.fillRect(x, height - padding - learnedHeight, barWidth, learnedHeight);
        
        // 复习数量柱状图
        const reviewedHeight = (day.reviewed / maxValue) * chartHeight;
        ctx.fillStyle = '#4895ef';
        ctx.fillRect(x + barWidth, height - padding - reviewedHeight, barWidth, reviewedHeight);
        
        // 日期标签 - 居中显示在每组柱子下方
        ctx.fillStyle = '#666';
        ctx.font = '11px Microsoft YaHei';
        ctx.textAlign = 'center';
        const dateLabel = day.date.substring(5); // MM-DD
        ctx.fillText(dateLabel, groupX + groupWidth / 2, height - padding + 20);
    });
    
    // 图例
    ctx.fillStyle = '#4361ee';
    ctx.fillRect(width - padding - 100, padding, 15, 15);
    ctx.fillStyle = '#666';
    ctx.font = '12px Microsoft YaHei';
    ctx.textAlign = 'left';
    ctx.fillText('学习', width - padding - 80, padding + 12);
    
    ctx.fillStyle = '#4895ef';
    ctx.fillRect(width - padding - 100, padding + 25, 15, 15);
    ctx.fillStyle = '#666';
    ctx.fillText('复习', width - padding - 80, padding + 37);
}

// 导入单词
function importWords() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('请选择要导入的文件', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        
        if (file.name.endsWith('.csv')) {
            importCSV(content);
        } else if (file.name.endsWith('.json')) {
            importJSON(content);
        } else {
            showMessage('不支持的文件格式', 'error');
        }
    };
    
    reader.readAsText(file);
}

// 导入CSV
function importCSV(content) {
    const lines = content.split('\n');
    let importedCount = 0;
    
    lines.forEach((line, index) => {
        if (index === 0 && line.includes('英文')) return; // 跳过标题行
        
        const parts = line.split(',').map(part => part.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
            const newWord = {
                id: Date.now() + index,
                english: parts[0],
                chinese: parts[1],
                phonetic: parts[2] || '',
                partOfSpeech: parts[3] || '',
                example: parts[4] || '',
                emoji: parts[5] || '',
                createdAt: new Date().toISOString(),
                lastReviewed: null,
                nextReview: new Date().toISOString(),
                reviewCount: 0,
                easeFactor: 2.5,
                interval: 0,
                mastered: false
            };
            
            // 检查是否已存在
            const exists = words.some(w => w.english.toLowerCase() === newWord.english.toLowerCase());
            if (!exists) {
                words.push(newWord);
                importedCount++;
            }
        }
    });
    
    saveWords();
    updateUI();
    showMessage(`成功导入 ${importedCount} 个单词`, 'success');
}

// 导入JSON
function importJSON(content) {
    try {
        const importedWords = JSON.parse(content);
        let importedCount = 0;
        
        importedWords.forEach(word => {
            if (word.english && word.chinese) {
                const newWord = {
                    id: Date.now() + importedCount,
                    english: word.english,
                    chinese: word.chinese,
                    phonetic: word.phonetic || '',
                    partOfSpeech: word.partOfSpeech || '',
                    example: word.example || '',
                    emoji: word.emoji || '',
                    createdAt: new Date().toISOString(),
                    lastReviewed: null,
                    nextReview: new Date().toISOString(),
                    reviewCount: 0,
                    easeFactor: 2.5,
                    interval: 0,
                    mastered: false
                };
                
                // 检查是否已存在
                const exists = words.some(w => w.english.toLowerCase() === newWord.english.toLowerCase());
                if (!exists) {
                    words.push(newWord);
                    importedCount++;
                }
            }
        });
        
        saveWords();
        updateUI();
        showMessage(`成功导入 ${importedCount} 个单词`, 'success');
    } catch (error) {
        showMessage('JSON格式错误', 'error');
    }
}

// 导出CSV
function exportCSV() {
    if (words.length === 0) {
        showMessage('没有可导出的单词', 'error');
        return;
    }
    
    let csv = '英文,中文,音标,词性,例句,Emoji\n';
    
    words.forEach(word => {
        csv += `"${word.english}","${word.chinese}","${word.phonetic || ''}","${word.partOfSpeech || ''}","${word.example || ''}","${word.emoji || ''}"\n`;
    });
    
    downloadFile(csv, 'word-memory-export.csv', 'text/csv');
    showMessage('导出成功', 'success');
}

// 导出JSON
function exportJSON() {
    if (words.length === 0) {
        showMessage('没有可导出的单词', 'error');
        return;
    }
    
    const json = JSON.stringify(words, null, 2);
    downloadFile(json, 'word-memory-export.json', 'application/json');
    showMessage('导出成功', 'success');
}

// 下载文件
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// 窗口大小改变时重绘图表
window.addEventListener('resize', function() {
    initializeChart();
});