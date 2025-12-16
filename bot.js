const { Telegraf, Markup, Scenes, session } = require('telegraf');
const fs = require('fs').promises;
const path = require('path');

// Вставьте сюда ваш токен для бота
const BOT_TOKEN = '8511397573:AAH9zQX6uFuRwniQKUifTngKF7l14d2hQqM';

// id админа (укажите свой id вместо 123456789, узнать можно у @userinfobot)
const ADMIN_ID = 6647562693; 

const bot = new Telegraf(BOT_TOKEN);

// Настройка таймаута для бота
bot.telegram.options.timeout = 10000; // 10 секунд вместо 90

// Пути для сохранения данных
const DATA_DIR = path.join(__dirname, 'stats');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BUGS_FILE = path.join(DATA_DIR, 'bugs.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const COUNTERS_FILE = path.join(DATA_DIR, 'counters.json');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json');

// --------- STATE STORAGE ---------
let config = {
    welcomeText: '👋 <b>Приветствую в личном боте Котича и Весперейда!</b>\n\nЗдесь ты найдешь все важные ссылки, сможешь связаться со мной, а также поиграть в казино!',
    aboutText: '<b>О боте:</b>\nЭтот бот создан для быстрого доступа к ресурсам и развлечениям. Используй кнопки ниже для навигации!',
    photoUrl: 'https://via.placeholder.com/600x400/3498db/ffffff?text=Kotich+Vesperade+Bot',
    links: [
        { name: '🔹 Мой канал', url: 'https://t.me/kot1ch' },
        { name: '🔸 Весперейд', url: 'https://t.me/vesperade' }
    ]
};

// Хранилище данных
let usersDB = {};
let bugReports = [];
let chatMessages = [];
let activeChatUsers = new Set();
let bugReportCounter = 1;
let nextPlayerId = 1000;
let groupsDB = {};

// Игровые настройки
const GAME_SETTINGS = {
    START_BALANCE: 1000,
    MIN_TRANSFER: 10,
    MIN_BET: 10,
    
    CASINO_BETS: {
        easy: { winChance: 80, multiplier: 1.3, name: '⚡ Быстрая победа (80%)', emoji: '⚡' },
        medium: { winChance: 50, multiplier: 1.8, name: '🎯 Средний риск (50%)', emoji: '🎯' },
        hard: { winChance: 20, multiplier: 4.0, name: '🔥 Высокий риск (20%)', emoji: '🔥' }
    },
    
    BUG_REWARD_MIN: 100,
    BUG_REWARD_MAX: 1000,
    
    MAX_CHAT_MESSAGES: 50
};

// Ролевые команды
const ROLE_COMMANDS = {
    normal: [
        { command: 'обнять', emoji: '🤗', text: 'обнимает' },
        { command: 'поцеловать', emoji: '😘', text: 'целует' },
        { command: 'погладить', emoji: '🐾', text: 'гладит' },
        { command: 'похлопать', emoji: '👏', text: 'хлопает по плечу' },
        { command: 'угостить', emoji: '🍫', text: 'угощает' },
        { command: 'поиграть', emoji: '🎮', text: 'предлагает поиграть' },
        { command: 'потанцевать', emoji: '💃', text: 'танцует с' },
        { command: 'посмотреть', emoji: '🎬', text: 'предлагает посмотреть фильм с' },
        { command: 'укрыть', emoji: '🛏️', text: 'укрывает одеялом' },
        { command: 'напоить', emoji: '☕', text: 'готовит напиток для' },
        { command: 'укутать', emoji: '🧣', text: 'укутывает в плед' },
        { command: 'поднять', emoji: '💪', text: 'поднимает на руки' },
        { command: 'пощекотать', emoji: '😆', text: 'щекочет' },
        { command: 'похвалить', emoji: '🌟', text: 'хвалит' },
        { command: 'пожать руку', emoji: '🤝', text: 'пожимает руку' },
        { command: 'похлопать по спине', emoji: '👋', text: 'хлопает по спине' },
        { command: 'почесать за ушком', emoji: '🐶', text: 'чешет за ушком' },
        { command: 'уложить спать', emoji: '😴', text: 'укладывает спать' },
        { command: 'разбудить', emoji: '🌅', text: 'будит' },
        { command: 'покормить', emoji: '🍕', text: 'кормит' },
        { command: 'подмигнуть', emoji: '😉', text: 'подмигивает' },
        { command: 'посадить на колени', emoji: '🪑', text: 'сажает на колени' },
        { command: 'пригласить на прогулку', emoji: '🚶', text: 'приглашает на прогулку' },
        { command: 'спеть песню', emoji: '🎤', text: 'поёт песню для' },
        { command: 'рассказать историю', emoji: '📖', text: 'рассказывает историю' },
        { command: 'сделать массаж', emoji: '💆', text: 'делает массаж' },
        { command: 'почистить перышки', emoji: '🐦', text: 'чистит перышки' },
        { command: 'построить замок', emoji: '🏰', text: 'строит песочный замок с' },
        { command: 'научить чему-то', emoji: '🎓', text: 'учит чему-то интересному' },
        { command: 'поиграть в прятки', emoji: '🫣', text: 'предлагает поиграть в прятки с' }
    ],
    
    adult: [
        { command: 'трахнуть', emoji: '🍆', text: 'трахает' },
        { command: 'отсосать', emoji: '👅', text: 'отсасывает у' },
        { command: 'лизнуть', emoji: '👅', text: 'вылизывает' },
        { command: 'зажать', emoji: '🍑', text: 'зажимает между сисек' },
        { command: 'кончить', emoji: '💦', text: 'кончает на' },
        { command: 'привязать', emoji: '🔗', text: 'привязывает' },
        { command: 'отшлепать', emoji: '👋', text: 'шлепает' },
        { command: 'пощекотать языком', emoji: '👅', text: 'щекочет языком' },
        { command: 'взять в рот', emoji: '🍆', text: 'берет в рот у' },
        { command: 'засунуть', emoji: '🕳️', text: 'засовывает в' },
        { command: 'раздеть', emoji: '👙', text: 'раздевает' },
        { command: 'посадить на лицо', emoji: '😈', text: 'сажает на лицо' },
        { command: 'поиграть с сосками', emoji: '👅', text: 'играет с сосками' },
        { command: 'укусить за шею', emoji: '😏', text: 'кусает за шею' },
        { command: 'похвалить киску', emoji: '🐱', text: 'хвалит киску' },
        { command: 'поиграть с членом', emoji: '🍆', text: 'играет с членом' },
        { command: 'сделать минет', emoji: '💦', text: 'делает минет' },
        { command: 'сделать куни', emoji: '👅', text: 'делает куни' },
        { command: 'залезть под юбку', emoji: '👗', text: 'лезет под юбку' },
        { command: 'посадить на член', emoji: '🍆', text: 'сажает на член' }
    ]
};

// ========== СИСТЕМА СОХРАНЕНИЯ ДАННЫХ ==========

// Создание папки для данных
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log(`📁 Папка данных создана: ${DATA_DIR}`);
    } catch (error) {
        console.error('Ошибка создания папки данных:', error);
    }
}

// Сохранение данных
async function saveData() {
    try {
        await ensureDataDir();
        
        // Сохраняем пользователей
        await fs.writeFile(USERS_FILE, JSON.stringify(usersDB, null, 2));
        
        // Сохраняем баг-репорты
        await fs.writeFile(BUGS_FILE, JSON.stringify(bugReports, null, 2));
        
        // Сохраняем сообщения чата
        await fs.writeFile(CHAT_FILE, JSON.stringify(chatMessages, null, 2));
        
        // Сохраняем конфиг
        await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
        
        // Сохраняем счетчики
        const counters = {
            bugReportCounter,
            nextPlayerId
        };
        await fs.writeFile(COUNTERS_FILE, JSON.stringify(counters, null, 2));
        
        // Сохраняем группы
        await fs.writeFile(GROUPS_FILE, JSON.stringify(groupsDB, null, 2));
        
        console.log('💾 Данные сохранены успешно');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        return false;
    }
}

// Загрузка данных
async function loadData() {
    try {
        await ensureDataDir();
        
        // Загружаем пользователей
        try {
            const usersData = await fs.readFile(USERS_FILE, 'utf8');
            usersDB = JSON.parse(usersData);
            console.log(`👥 Загружено пользователей: ${Object.keys(usersDB).length}`);
        } catch (error) {
            console.log('Файл пользователей не найден, создаем новый');
            usersDB = {};
        }
        
        // Загружаем баг-репорты
        try {
            const bugsData = await fs.readFile(BUGS_FILE, 'utf8');
            bugReports = JSON.parse(bugsData);
            console.log(`🐛 Загружено баг-репортов: ${bugReports.length}`);
        } catch (error) {
            console.log('Файл баг-репортов не найден, создаем новый');
            bugReports = [];
        }
        
        // Загружаем сообщения чата
        try {
            const chatData = await fs.readFile(CHAT_FILE, 'utf8');
            chatMessages = JSON.parse(chatData);
            console.log(`💬 Загружено сообщений чата: ${chatMessages.length}`);
        } catch (error) {
            console.log('Файл чата не найден, создаем новый');
            chatMessages = [];
        }
        
        // Загружаем конфиг
        try {
            const configData = await fs.readFile(CONFIG_FILE, 'utf8');
            const loadedConfig = JSON.parse(configData);
            // Обновляем только тексты, сохраняя структуру
            config.welcomeText = loadedConfig.welcomeText || config.welcomeText;
            config.aboutText = loadedConfig.aboutText || config.aboutText;
            config.photoUrl = loadedConfig.photoUrl || config.photoUrl;
            config.links = loadedConfig.links || config.links;
            console.log('⚙️ Конфиг загружен');
        } catch (error) {
            console.log('Файл конфига не найден, используем настройки по умолчанию');
        }
        
        // Загружаем счетчики
        try {
            const countersData = await fs.readFile(COUNTERS_FILE, 'utf8');
            const counters = JSON.parse(countersData);
            bugReportCounter = counters.bugReportCounter || 1;
            nextPlayerId = counters.nextPlayerId || 1000;
            console.log(`🔢 Счетчики загружены: bugReportCounter=${bugReportCounter}, nextPlayerId=${nextPlayerId}`);
        } catch (error) {
            console.log('Файл счетчиков не найден, используем значения по умолчанию');
            // Автоматически определяем следующий PlayerID из загруженных пользователей
            if (Object.keys(usersDB).length > 0) {
                const maxPlayerId = Math.max(...Object.values(usersDB).map(user => user.playerId));
                nextPlayerId = maxPlayerId + 1;
                console.log(`🔢 Автоопределен nextPlayerId: ${nextPlayerId}`);
            }
        }
        
        // Загружаем группы
        try {
            const groupsData = await fs.readFile(GROUPS_FILE, 'utf8');
            groupsDB = JSON.parse(groupsData);
            console.log(`👥 Загружено групп: ${Object.keys(groupsDB).length}`);
        } catch (error) {
            console.log('Файл групп не найден, создаем новый');
            groupsDB = {};
        }
        
        console.log('📂 Все данные успешно загружены');
        return true;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return false;
    }
}

// Экспорт данных
async function exportData() {
    try {
        await ensureDataDir();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const exportDir = path.join(DATA_DIR, 'exports');
        await fs.mkdir(exportDir, { recursive: true });
        
        // Экспорт пользователей
        const usersExport = Object.values(usersDB).map(user => ({
            playerId: user.playerId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            balance: user.balance,
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            totalWinnings: user.totalWinnings,
            transfersSent: user.transfersSent,
            transfersReceived: user.transfersReceived,
            bugReports: user.bugReports,
            bugRewards: user.bugRewards,
            chatMessages: user.chatMessages,
            registeredAt: user.registeredAt,
            lastActive: user.lastActive
        }));
        
        await fs.writeFile(
            path.join(exportDir, `users_export_${timestamp}.json`),
            JSON.stringify(usersExport, null, 2)
        );
        
        // Экспорт статистики
        const stats = {
            timestamp: new Date().toISOString(),
            totalUsers: Object.keys(usersDB).length,
            totalBalance: Object.values(usersDB).reduce((sum, user) => sum + user.balance, 0),
            avgBalance: Math.round(Object.values(usersDB).reduce((sum, user) => sum + user.balance, 0) / Object.keys(usersDB).length) || 0,
            totalGames: Object.values(usersDB).reduce((sum, user) => sum + (user.gamesPlayed || 0), 0),
            totalBugReports: bugReports.length,
            totalChatMessages: chatMessages.length,
            activeChatUsers: Array.from(activeChatUsers).length,
            totalGroups: Object.keys(groupsDB).length
        };
        
        await fs.writeFile(
            path.join(exportDir, `stats_${timestamp}.json`),
            JSON.stringify(stats, null, 2)
        );
        
        console.log(`📤 Данные экспортированы в ${exportDir}`);
        return true;
    } catch (error) {
        console.error('Ошибка экспорта данных:', error);
        return false;
    }
}

// Автоматическое сохранение каждые 5 минут
let autoSaveInterval;
function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    
    autoSaveInterval = setInterval(async () => {
        await saveData();
    }, 5 * 60 * 1000); // 5 минут
    
    console.log('⏰ Автосохранение активировано (каждые 5 минут)');
}

// ========== УПРАВЛЕНИЕ ГРУППАМИ ==========

// Регистрация группы
function registerGroup(groupId, groupTitle) {
    if (!groupsDB[groupId]) {
        groupsDB[groupId] = {
            id: groupId,
            title: groupTitle,
            isAdultContentEnabled: false,
            registeredAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            members: {},
            rpCount: 0
        };
        saveData();
        console.log(`👥 Зарегистрирована новая группа: ${groupTitle} (ID: ${groupId})`);
        return groupsDB[groupId];
    }
    return groupsDB[groupId];
}

// Получение информации о группе
function getGroup(groupId) {
    return groupsDB[groupId];
}

// Включение/выключение 18+ контента в группе
function toggleAdultContent(groupId, adminId) {
    const group = getGroup(groupId);
    if (group) {
        group.isAdultContentEnabled = !group.isAdultContentEnabled;
        group.lastActive = new Date().toISOString();
        saveData();
        console.log(`🔞 18+ контент в группе ${group.title} ${group.isAdultContentEnabled ? 'включен' : 'выключен'} администратором ${adminId}`);
        return group.isAdultContentEnabled;
    }
    return false;
}

// Добавление участника в статистику группы
function addGroupMember(groupId, userId, username, firstName) {
    const group = getGroup(groupId);
    if (group) {
        if (!group.members[userId]) {
            group.members[userId] = {
                id: userId,
                username: username,
                firstName: firstName,
                rpReceived: 0,
                rpSent: 0,
                lastActive: new Date().toISOString(),
                joinedAt: new Date().toISOString()
            };
        } else {
            group.members[userId].lastActive = new Date().toISOString();
            group.members[userId].username = username || group.members[userId].username;
            group.members[userId].firstName = firstName || group.members[userId].firstName;
        }
        group.lastActive = new Date().toISOString();
        saveData();
    }
}

// Увеличение счетчика RP в группе
function incrementGroupRP(groupId, fromUserId, toUserId) {
    const group = getGroup(groupId);
    if (group) {
        group.rpCount = (group.rpCount || 0) + 1;
        
        if (group.members[fromUserId]) {
            group.members[fromUserId].rpSent = (group.members[fromUserId].rpSent || 0) + 1;
        }
        
        if (group.members[toUserId]) {
            group.members[toUserId].rpReceived = (group.members[toUserId].rpReceived || 0) + 1;
        }
        
        saveData();
    }
}

// ========== БЕЗОПАСНАЯ ОТПРАВКА СООБЩЕНИЙ ==========

async function sendMessageSafely(chatId, text, options = {}) {
    try {
        await Promise.race([
            bot.telegram.sendMessage(chatId, text, { 
                parse_mode: 'HTML',
                ...options 
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout after 8 seconds')), 8000)
            )
        ]);
        return true;
    } catch (e) {
        console.log(`⚠️ Не удалось отправить сообщение в чат ${chatId}: ${e.message}`);
        return false;
    }
}

async function sendPhotoSafely(chatId, fileId, caption = '', options = {}) {
    try {
        await Promise.race([
            bot.telegram.sendPhoto(chatId, fileId, { 
                caption,
                ...options 
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout after 8 seconds')), 8000)
            )
        ]);
        return true;
    } catch (e) {
        console.log(`⚠️ Не удалось отправить фото в чат ${chatId}: ${e.message}`);
        return false;
    }
}

async function broadcastToChat(message, excludeUserId = null) {
    const activeUsers = getActiveChatUsers();
    
    const sendPromises = activeUsers.map(async (user) => {
        if (excludeUserId && user.id === excludeUserId) return;
        await sendMessageSafely(user.id, message);
    });
    
    Promise.allSettled(sendPromises).then(results => {
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
            console.log(`📢 Рассылка завершена. Не удалось отправить: ${failed} из ${results.length}`);
        }
    }).catch(() => {});
}

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========

function initUser(userId, username, firstName, lastName) {
    if (!usersDB[userId]) {
        usersDB[userId] = {
            id: userId,
            playerId: nextPlayerId++,
            username: username,
            firstName: firstName,
            lastName: lastName,
            balance: GAME_SETTINGS.START_BALANCE,
            gamesPlayed: 0,
            gamesWon: 0,
            totalWinnings: 0,
            transfersSent: 0,
            transfersReceived: 0,
            bugReports: 0,
            bugRewards: 0,
            chatMessages: 0,
            lastActive: new Date().toISOString(),
            registeredAt: new Date().toISOString(),
            isInChat: false
        };
        console.log(`👤 Новый пользователь: ${username || userId} (ID:${usersDB[userId].playerId}) создан с балансом ${GAME_SETTINGS.START_BALANCE}`);
        saveData();
    }
    return usersDB[userId];
}

function getUserByPlayerId(playerId) {
    return Object.values(usersDB).find(user => user.playerId == playerId);
}

function getUser(userId) {
    return usersDB[userId];
}

function updateBalance(userId, amount, type = 'game') {
    if (!usersDB[userId]) return false;
    
    usersDB[userId].balance += amount;
    usersDB[userId].lastActive = new Date().toISOString();
    
    if (amount > 0) {
        usersDB[userId].totalWinnings += amount;
        if (type === 'game') usersDB[userId].gamesWon++;
        if (type === 'bug') usersDB[userId].bugRewards += amount;
    }
    
    if (type === 'game') usersDB[userId].gamesPlayed++;
    
    return true;
}

function transferCoins(fromUserId, toUserId, amount) {
    const fromUser = usersDB[fromUserId];
    const toUser = usersDB[toUserId];
    
    if (!fromUser || !toUser) return { success: false, error: 'Пользователь не найден' };
    if (fromUser.balance < amount) return { success: false, error: 'Недостаточно средств' };
    if (amount < GAME_SETTINGS.MIN_TRANSFER) return { success: false, error: `Минимальный перевод: ${GAME_SETTINGS.MIN_TRANSFER}` };
    
    fromUser.balance -= amount;
    toUser.balance += amount;
    
    fromUser.transfersSent = (fromUser.transfersSent || 0) + 1;
    toUser.transfersReceived = (toUser.transfersReceived || 0) + 1;
    
    fromUser.lastActive = new Date().toISOString();
    toUser.lastActive = new Date().toISOString();
    
    return { success: true, fromBalance: fromUser.balance, toBalance: toUser.balance };
}

function getTopPlayers(limit = 10) {
    return Object.values(usersDB)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, limit);
}

function playCasino(betType, betAmount) {
    const settings = GAME_SETTINGS.CASINO_BETS[betType];
    if (!settings) return { win: false, amount: 0 };
    
    const win = Math.random() * 100 < settings.winChance;
    let winAmount = 0;
    
    if (win) {
        winAmount = Math.round(betAmount * (settings.multiplier - 1));
    } else {
        winAmount = -betAmount;
    }
    
    return { win, amount: winAmount, multiplier: settings.multiplier };
}

function addBugReport(userId, username, text) {
    const user = getUser(userId);
    const report = {
        id: bugReportCounter++,
        userId: userId,
        username: username,
        playerId: user?.playerId,
        text: text,
        status: 'new',
        adminResponse: null,
        rewardAmount: 0,
        createdAt: new Date().toISOString(),
        respondedAt: null,
        rewardedAt: null
    };
    
    bugReports.unshift(report);
    if (bugReports.length > 100) bugReports.pop();
    
    if (user) user.bugReports = (user.bugReports || 0) + 1;
    
    saveData();
    return report;
}

function getBugReports(status = 'new') {
    return bugReports.filter(report => report.status === status);
}

function respondToBugReport(reportId, responseText) {
    const report = bugReports.find(r => r.id === reportId);
    if (report) {
        report.status = 'responded';
        report.adminResponse = responseText;
        report.respondedAt = new Date().toISOString();
        saveData();
        return true;
    }
    return false;
}

function rewardBugReport(reportId, amount) {
    const report = bugReports.find(r => r.id === reportId);
    if (report) {
        report.status = 'rewarded';
        report.rewardAmount = amount;
        report.rewardedAt = new Date().toISOString();
        
        updateBalance(report.userId, amount, 'bug');
        saveData();
        return true;
    }
    return false;
}

function addChatMessage(userId, username, playerId, text, isPhoto = false) {
    const message = {
        id: chatMessages.length + 1,
        userId: userId,
        username: username,
        playerId: playerId,
        text: text,
        isPhoto: isPhoto,
        timestamp: new Date().toISOString()
    };
    
    chatMessages.unshift(message);
    if (chatMessages.length > GAME_SETTINGS.MAX_CHAT_MESSAGES) {
        chatMessages.pop();
    }
    
    const user = getUser(userId);
    if (user) user.chatMessages = (user.chatMessages || 0) + 1;
    
    saveData();
    return message;
}

function getRecentChatMessages(limit = 20) {
    return chatMessages.slice(0, limit);
}

function joinChat(userId) {
    activeChatUsers.add(userId);
    const user = getUser(userId);
    if (user) user.isInChat = true;
}

function leaveChat(userId) {
    activeChatUsers.delete(userId);
    const user = getUser(userId);
    if (user) user.isInChat = false;
}

function isInChat(userId) {
    return activeChatUsers.has(userId);
}

function getActiveChatUsers() {
    return Array.from(activeChatUsers).map(userId => getUser(userId)).filter(Boolean);
}

// ========== РОЛЕВЫЕ КОМАНДЫ (НОВАЯ СИСТЕМА) ==========

async function handleRoleCommand(ctx, command, targetUser) {
    const chatId = ctx.chat.id;
    const fromUser = ctx.from;
    const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
    
    let roleCommand = ROLE_COMMANDS.normal.find(cmd => cmd.command === command);
    let isAdult = false;
    
    if (!roleCommand) {
        roleCommand = ROLE_COMMANDS.adult.find(cmd => cmd.command === command);
        isAdult = true;
    }
    
    if (!roleCommand) {
        return false;
    }
    
    // Проверяем доступность 18+ команд
    if (isAdult && isGroup) {
        const group = getGroup(chatId);
        if (!group || !group.isAdultContentEnabled) {
            await ctx.replyWithHTML(`⛔ <b>18+ команды отключены в этой группе</b>\n\nАдминистратор должен включить их командой:\n<code>/adult on</code>`);
            return true;
        }
    }
    
    // Формируем ответное сообщение
    const fromName = fromUser.username ? `@${fromUser.username}` : fromUser.first_name;
    const toName = targetUser.username ? `@${targetUser.username}` : targetUser.first_name;
    
    const messages = [
        `${roleCommand.emoji} <b>${fromName}</b> ${roleCommand.text} <b>${toName}</b>`,
        `${roleCommand.emoji} <b>${fromName}</b> нежно ${roleCommand.text} <b>${toName}</b>`,
        `${roleCommand.emoji} <b>${fromName}</b> страстно ${roleCommand.text} <b>${toName}</b>`,
        `${roleCommand.emoji} <b>${fromName}</b> ласково ${roleCommand.text} <b>${toName}</b>`,
        `${roleCommand.emoji} <b>${fromName}</b> игриво ${roleCommand.text} <b>${toName}</b>`,
        `${roleCommand.emoji} <b>${fromName}</b> неожиданно ${roleCommand.text} <b>${toName}</b>`
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Отправляем сообщение
    await ctx.replyWithHTML(randomMessage);
    
    // Обновляем статистику если это группа
    if (isGroup) {
        registerGroup(chatId, ctx.chat.title);
        addGroupMember(chatId, fromUser.id, fromUser.username, fromUser.first_name);
        addGroupMember(chatId, targetUser.id, targetUser.username, targetUser.first_name);
        incrementGroupRP(chatId, fromUser.id, targetUser.id);
    }
    
    return true;
}

function getRoleCommandsList(groupId = null) {
    const group = groupId ? getGroup(groupId) : null;
    const isAdultEnabled = group ? group.isAdultContentEnabled : false;
    
    let text = `<b>🎭 РОЛЕВЫЕ КОМАНДЫ</b>\n\n`;
    
    text += `<b>Обычные команды (30):</b>\n`;
    for (let i = 0; i < ROLE_COMMANDS.normal.length; i += 5) {
        const chunk = ROLE_COMMANDS.normal.slice(i, i + 5);
        text += chunk.map(cmd => `<code>${cmd.command}</code>`).join(' • ') + '\n';
    }
    
    if (isAdultEnabled) {
        text += `\n<b>🔞 18+ команды (20, включены):</b>\n`;
        for (let i = 0; i < ROLE_COMMANDS.adult.length; i += 5) {
            const chunk = ROLE_COMMANDS.adult.slice(i, i + 5);
            text += chunk.map(cmd => `<code>${cmd.command}</code>`).join(' • ') + '\n';
        }
    } else if (groupId) {
        text += `\n<b>🔞 18+ команды (20, отключены):</b>\n`;
        text += `<i>Для включения используйте команду</i> <code>/adult on</code>\n`;
        text += `<i>Только для администраторов группы</i>\n`;
    }
    
    text += `\n<b>📝 КАК ИСПОЛЬЗОВАТЬ:</b>\n`;
    text += `1. <b>Ответить на сообщение</b> человека обычным сообщением:\n`;
    text += `   Пример: "обнять" или "трахнуть"\n\n`;
    text += `2. <b>Упомянуть пользователя</b> с командой:\n`;
    text += `   Пример: "обнять @username" или "трахнуть @username"\n\n`;
    text += `3. <b>Просто написать</b> команду в ответ на сообщение\n\n`;
    
    text += `<b>⚠️ ВАЖНО:</b>\n`;
    text += `• Команда должна быть написана <b>сообщением</b>, а не как команда Telegram\n`;
    text += `• Бот сам определит команду и обработает её\n`;
    text += `• Для 18+ команд администратор должен включить их через <code>/adult on</code>\n`;
    
    if (groupId && group) {
        text += `\n<b>📊 Статистика группы "${group.title}":</b>\n`;
        text += `• Всего RP действий: ${group.rpCount || 0}\n`;
        text += `• Участников: ${Object.keys(group.members || {}).length}\n`;
        text += `• 18+ контент: ${group.isAdultContentEnabled ? '✅ Включен' : '❌ Выключен'}\n`;
    }
    
    return text;
}

// ========== ОБРАБОТЧИКИ ГРУППОВЫХ СООБЩЕНИЙ ==========

bot.on('new_chat_members', async (ctx) => {
    const chatId = ctx.chat.id;
    const newMembers = ctx.message.new_chat_members;
    
    const botMember = newMembers.find(member => member.id === ctx.botInfo.id);
    if (botMember) {
        registerGroup(chatId, ctx.chat.title);
        await ctx.replyWithHTML(`🤖 <b>Привет! Я бот Котича и Весперейда!</b>\n\n` +
                              `🎮 <b>Мои возможности:</b>\n` +
                              `• <b>Ролевые команды</b> (обнять, поцеловать и др.)\n` +
                              `• Игровое казино (в личных сообщениях)\n` +
                              `• Переводы монет между игроками\n` +
                              `• Общий чат с другими игроками\n\n` +
                              `🎭 <b>КАК ИСПОЛЬЗОВАТЬ RP КОМАНДЫ:</b>\n` +
                              `1. Ответьте на сообщение человека: "обнять"\n` +
                              `2. Или напишите: "обнять @username"\n` +
                              `3. Не используйте / перед командой!\n\n` +
                              `📋 <b>Все команды:</b> <code>/role</code>\n\n` +
                              `🎮 <b>Для игр и переводов:</b>\n` +
                              `Напишите мне в личные сообщения /start\n\n` +
                              `👑 <b>Команды для админов:</b>\n` +
                              `<code>/adult on</code> - включить 18+ команды\n` +
                              `<code>/adult off</code> - выключить 18+ команды\n` +
                              `<code>/groupstats</code> - статистика группы`);
        return;
    }
    
    const group = registerGroup(chatId, ctx.chat.title);
    
    newMembers.forEach(member => {
        if (member.id !== ctx.botInfo.id) {
            addGroupMember(chatId, member.id, member.username, member.first_name);
        }
    });
    
    const welcomeText = newMembers.map(member => {
        if (member.id === ctx.botInfo.id) return '';
        return member.username ? `@${member.username}` : member.first_name;
    }).filter(name => name).join(', ');
    
    if (welcomeText) {
        await ctx.replyWithHTML(`👋 <b>Добро пожаловать в группу, ${welcomeText}!</b>\n\n` +
                              `✨ Используйте ролевые команды для взаимодействия!\n` +
                              `📋 Список команд: <code>/role</code>\n\n` +
                              `🎭 <b>Пример использования:</b>\n` +
                              `Ответьте на сообщение человека: "обнять"\n` +
                              `Или напишите: "обнять @username"`);
    }
});

bot.on('left_chat_member', async (ctx) => {
    const chatId = ctx.chat.id;
    const leftMember = ctx.message.left_chat_member;
    
    if (leftMember.id === ctx.botInfo.id) {
        if (groupsDB[chatId]) {
            delete groupsDB[chatId];
            saveData();
            console.log(`🚫 Бот удален из группы ${chatId}`);
        }
    }
});

// ========== ГРУППОВЫЕ КОМАНДЫ ==========

bot.command('role', async (ctx) => {
    const chatId = ctx.chat.id;
    const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
    
    if (isGroup) {
        registerGroup(chatId, ctx.chat.title);
        addGroupMember(chatId, ctx.from.id, ctx.from.username, ctx.from.first_name);
    }
    
    const roleText = getRoleCommandsList(isGroup ? chatId : null);
    await ctx.replyWithHTML(roleText);
});

bot.command('adult', async (ctx) => {
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
    
    if (!isGroup) {
        await ctx.replyWithHTML('⛔ <b>Эта команда работает только в группах!</b>');
        return;
    }
    
    try {
        const chatMember = await ctx.telegram.getChatMember(chatId, userId);
        const isAdmin = chatMember.status === 'creator' || chatMember.status === 'administrator';
        
        if (!isAdmin && String(userId) !== String(ADMIN_ID)) {
            await ctx.replyWithHTML('⛔ <b>Только администраторы могут использовать эту команду!</b>');
            return;
        }
        
        const args = ctx.message.text.split(' ');
        const action = args[1];
        
        if (action === 'on' || action === 'вкл') {
            const isEnabled = toggleAdultContent(chatId, userId);
            await ctx.replyWithHTML(`🔞 <b>18+ контент ${isEnabled ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}</b>\n\n` +
                                  `${isEnabled ? 
                                    '✅ Теперь доступны взрослые ролевые команды.\n⚠️ Убедитесь, что всем участникам есть 18 лет!' : 
                                    '❌ Взрослые команды отключены.'}`);
        } else if (action === 'off' || action === 'выкл') {
            const isEnabled = toggleAdultContent(chatId, userId);
            await ctx.replyWithHTML(`🔞 <b>18+ контент ${isEnabled ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}</b>\n\n` +
                                  `${isEnabled ? 
                                    '✅ Теперь доступны взрослые ролевые команды.' : 
                                    '❌ Взрослые команды отключены.'}`);
        } else {
            const group = getGroup(chatId);
            const status = group ? group.isAdultContentEnabled : false;
            await ctx.replyWithHTML(`🔞 <b>Статус 18+ контента:</b> ${status ? '✅ Включен' : '❌ Выключен'}\n\n` +
                                  `<b>Команды для админов:</b>\n` +
                                  `<code>/adult on</code> - включить 18+ команды\n` +
                                  `<code>/adult off</code> - выключить 18+ команды\n\n` +
                                  `<i>Только для администраторов группы</i>`);
        }
        
    } catch (error) {
        console.error('Ошибка при проверке прав админа:', error);
        await ctx.replyWithHTML('⛔ <b>Ошибка при проверке прав доступа!</b>');
    }
});

bot.command('groupstats', async (ctx) => {
    const chatId = ctx.chat.id;
    const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
    
    if (!isGroup) {
        await ctx.replyWithHTML('⛔ <b>Эта команда работает только в группах!</b>');
        return;
    }
    
    const group = getGroup(chatId);
    if (!group) {
        await ctx.replyWithHTML('📊 <b>Группа не зарегистрирована</b>\n\nБот должен быть добавлен в группу для отслеживания статистики.');
        return;
    }
    
    const members = Object.values(group.members || {});
    const topReceivers = [...members].sort((a, b) => (b.rpReceived || 0) - (a.rpReceived || 0)).slice(0, 5);
    const topSenders = [...members].sort((a, b) => (b.rpSent || 0) - (a.rpSent || 0)).slice(0, 5);
    
    let text = `<b>📊 СТАТИСТИКА ГРУППЫ "${group.title}"</b>\n\n`;
    text += `👥 Участников: ${members.length}\n`;
    text += `🎭 Всего RP действий: ${group.rpCount || 0}\n`;
    text += `🔞 18+ контент: ${group.isAdultContentEnabled ? '✅ Включен' : '❌ Выключен'}\n`;
    text += `📅 Зарегистрирована: ${new Date(group.registeredAt).toLocaleDateString('ru-RU')}\n\n`;
    
    if (topReceivers.length > 0) {
        text += `<b>🏆 Топ-5 получателей RP:</b>\n`;
        topReceivers.forEach((member, index) => {
            const name = member.username ? `@${member.username}` : member.first_name;
            text += `${index + 1}. ${name} - ${member.rpReceived || 0} получено\n`;
        });
        text += `\n`;
    }
    
    if (topSenders.length > 0) {
        text += `<b>🎯 Топ-5 отправителей RP:</b>\n`;
        topSenders.forEach((member, index) => {
            const name = member.username ? `@${member.username}` : member.first_name;
            text += `${index + 1}. ${name} - ${member.rpSent || 0} отправлено\n`;
        });
    }
    
    await ctx.replyWithHTML(text);
});

// ========== ОБРАБОТКА РОЛЕВЫХ КОМАНД В ГРУППАХ ==========

// Используем middleware для приоритетной обработки ролевых команд
bot.use(async (ctx, next) => {
    const message = ctx.message;
    const text = message?.text;
    const chatId = ctx.chat?.id;
    const isGroup = ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';
    
    // Пропускаем если нет сообщения, не текст или команда
    if (!message || !text || text.startsWith('/') || text.length < 2 || !isGroup) {
        return next();
    }
    
    // Проверяем, содержит ли сообщение ролевую команду (простое сравнение)
    const lowerText = text.toLowerCase().trim();
    
    // Ищем команду среди всех ролевых команд
    let foundCommand = null;
    let isAdult = false;
    
    // Проверяем обычные команды
    for (const cmd of ROLE_COMMANDS.normal) {
        if (lowerText === cmd.command || lowerText.includes(cmd.command + ' ')) {
            foundCommand = cmd;
            break;
        }
    }
    
    // Если не нашли обычную, проверяем 18+ команды
    if (!foundCommand) {
        for (const cmd of ROLE_COMMANDS.adult) {
            if (lowerText === cmd.command || lowerText.includes(cmd.command + ' ')) {
                foundCommand = cmd;
                isAdult = true;
                break;
            }
        }
    }
    
    if (!foundCommand) {
        return next();
    }
    
    console.log(`🎭 Найдена RP команда: "${foundCommand.command}" от ${ctx.from.id} в группе ${chatId}`);
    
    // Проверяем доступность 18+ команд
    if (isAdult && isGroup) {
        const group = getGroup(chatId);
        if (!group || !group.isAdultContentEnabled) {
            await ctx.replyWithHTML(`⛔ <b>18+ команды отключены в этой группе</b>\n\nАдминистратор должен включить их командой:\n<code>/adult on</code>`, {
                reply_to_message_id: message.message_id
            });
            return;
        }
    }
    
    // Определяем цель команды
    let targetUser = null;
    let isReply = false;
    
    // Случай 1: Ответ на сообщение (реплай)
    if (message.reply_to_message) {
        // Пробуем получить информацию об отправителе реплая
        if (message.reply_to_message.from) {
            targetUser = message.reply_to_message.from;
            isReply = true;
            console.log(`🎭 Цель через реплай: ${targetUser.id} (@${targetUser.username || targetUser.first_name})`);
        } else {
            // Если не можем получить from, возможно бот не админ
            console.log('⚠️ Не удалось получить отправителя реплая. Боту нужны админские права!');
            await ctx.reply('⚠️ Для работы ролевых команд боту нужны админские права в группе!', {
                reply_to_message_id: message.message_id
            });
            return;
        }
    } 
    // Случай 2: Упоминание в тексте (например: "обнять @username")
    else {
        // Ищем упоминания в тексте
        const mentionMatch = text.match(/@(\w+)/);
        if (mentionMatch) {
            const username = mentionMatch[1];
            targetUser = {
                username: username,
                first_name: username,
                id: 0 // временный ID
            };
            console.log(`🎭 Цель через упоминание: @${username}`);
        }
    }
    
    // Если цель не определена, показываем подсказку
    if (!targetUser) {
        await ctx.replyWithHTML(
            `❓ <b>Как использовать команду "${foundCommand.command}":</b>\n\n` +
            `1. <b>Ответьте на сообщение</b> человека: "${foundCommand.command}"\n` +
            `2. <b>Упомяните пользователя:</b> "${foundCommand.command} @username"\n\n` +
            `<i>Боту нужны админские права для работы с реплаями!</i>`,
            { reply_to_message_id: message.message_id }
        );
        return;
    }
    
    // Проверяем, не пытается ли пользователь взаимодействовать сам с собой
    if (targetUser.id && targetUser.id === ctx.from.id) {
        const selfMessages = [
            "Нельзя делать это самому себе! 😅",
            "Нужен кто-то другой для этого! 😊",
            "Попробуй с кем-нибудь еще! 😉"
        ];
        await ctx.reply(selfMessages[Math.floor(Math.random() * selfMessages.length)], {
            reply_to_message_id: message.message_id
        });
        return;
    }
    
    // Формируем ответное сообщение
    const fromName = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
    const toName = targetUser.username ? `@${targetUser.username}` : targetUser.first_name;
    
    const messages = [
        `${foundCommand.emoji} <b>${fromName}</b> ${foundCommand.text} <b>${toName}</b>`,
        `${foundCommand.emoji} <b>${fromName}</b> нежно ${foundCommand.text} <b>${toName}</b>`,
        `${foundCommand.emoji} <b>${fromName}</b> страстно ${foundCommand.text} <b>${toName}</b>`,
        `${foundCommand.emoji} <b>${fromName}</b> ласково ${foundCommand.text} <b>${toName}</b>`,
        `${foundCommand.emoji} <b>${fromName}</b> игриво ${foundCommand.text} <b>${toName}</b>`,
        `${foundCommand.emoji} <b>${fromName}</b> неожиданно ${foundCommand.text} <b>${toName}</b>`
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Отправляем сообщение
    try {
        if (isReply) {
            await ctx.replyWithHTML(randomMessage, {
                reply_to_message_id: message.message_id
            });
        } else {
            await ctx.replyWithHTML(randomMessage);
        }
    } catch (error) {
        console.error('Ошибка при отправке RP-сообщения:', error);
        await ctx.replyWithHTML(randomMessage);
    }
    
    // Обновляем статистику группы
    registerGroup(chatId, ctx.chat.title);
    addGroupMember(chatId, ctx.from.id, ctx.from.username, ctx.from.first_name);
    if (targetUser.id && targetUser.id !== 0) {
        addGroupMember(chatId, targetUser.id, targetUser.username, targetUser.first_name);
        incrementGroupRP(chatId, ctx.from.id, targetUser.id);
    }
    
    // Прекращаем дальнейшую обработку
    return;
});

// Добавляем команду для проверки прав бота
bot.command('checkrights', async (ctx) => {
    const chatId = ctx.chat.id;
    const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
    
    if (!isGroup) {
        await ctx.reply('Эта команда работает только в группах!');
        return;
    }
    
    try {
        const botMember = await ctx.telegram.getChatMember(chatId, ctx.botInfo.id);
        const isAdmin = botMember.status === 'administrator' || botMember.status === 'creator';
        
        await ctx.replyWithHTML(
            `🔧 <b>Проверка прав бота:</b>\n\n` +
            `🤖 Статус бота: <b>${botMember.status}</b>\n` +
            `✅ Админ: <b>${isAdmin ? 'ДА' : 'НЕТ'}</b>\n\n` +
            `<i>Для работы ролевых команд боту нужны права администратора!</i>\n` +
            `<i>Без прав бот не может видеть отправителей реплаев.</i>`
        );
    } catch (error) {
        await ctx.reply(`❌ Ошибка проверки прав: ${error.message}`);
    }
});

// ========== СЦЕНЫ ==========

const adminScene = new Scenes.BaseScene('admin');

adminScene.enter(async (ctx) => {
    await ctx.reply('🔑 <b>Админ-панель</b>\n\nВыберите действие:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('📝 Изменить приветствие', 'admin:welcome')],
            [Markup.button.callback('🖊 Изменить "О боте"', 'admin:about')],
            [Markup.button.callback('🖼 Изменить фото', 'admin:photo')],
            [Markup.button.callback('💰 Управление балансами', 'admin:balance')],
            [Markup.button.callback(`🐛 Баг-репорты (${getBugReports('new').length}🆕)`, 'admin:bugs')],
            [Markup.button.callback('💾 Управление данными', 'admin:data')],
            [Markup.button.callback('👥 Статистика', 'admin:users')],
            [Markup.button.callback('🚪 Выйти', 'admin:close')]
        ])
    });
});

adminScene.action('admin:welcome', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('✏️ Введите новый текст приветствия (HTML поддерживается):');
    ctx.scene.state.awaiting = 'welcome';
});

adminScene.action('admin:about', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('✏️ Введите новый текст "О боте" (HTML поддерживается):');
    ctx.scene.state.awaiting = 'about';
});

adminScene.action('admin:photo', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('🖼 Введите ссылку (URL) на новое фото:');
    ctx.scene.state.awaiting = 'photo';
});

adminScene.action('admin:users', async (ctx) => {
    await ctx.answerCbQuery();
    const stats = {
        totalUsers: Object.keys(usersDB).length,
        totalBalance: Object.values(usersDB).reduce((sum, user) => sum + user.balance, 0),
        avgBalance: Math.round(Object.values(usersDB).reduce((sum, user) => sum + user.balance, 0) / Object.keys(usersDB).length) || 0,
        totalGames: Object.values(usersDB).reduce((sum, user) => sum + (user.gamesPlayed || 0), 0)
    };
    
    let text = `<b>📊 Статистика пользователей</b>\n\n`;
    text += `👥 Всего пользователей: ${stats.totalUsers}\n`;
    text += `💰 Общий баланс: ${stats.totalBalance.toLocaleString()}\n`;
    text += `📈 Средний баланс: ${stats.avgBalance.toLocaleString()}\n`;
    text += `🎮 Игр сыграно: ${stats.totalGames}\n`;
    text += `🐛 Баг-репортов: ${bugReports.length}\n`;
    text += `💬 Сообщений в чате: ${chatMessages.length}\n`;
    text += `👥 Групп: ${Object.keys(groupsDB).length}\n`;
    
    await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Обновить', 'admin:users')],
            [Markup.button.callback('↩️ Назад', 'admin:main')]
        ])
    });
});

adminScene.action('admin:balance', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('💰 <b>Управление балансами</b>\n\nВыберите действие:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('➕ Изменить баланс', 'admin:changebalance')],
            [Markup.button.callback('📊 Топ игроков', 'admin:topplayers')],
            [Markup.button.callback('↩️ Назад', 'admin:main')]
        ])
    });
});

adminScene.action('admin:changebalance', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('👤 Введите PlayerID или username пользователя:');
    ctx.scene.state.awaiting = 'getuser_for_balance';
});

adminScene.action('admin:topplayers', async (ctx) => {
    await ctx.answerCbQuery();
    const topPlayers = getTopPlayers(15);
    
    let text = `<b>🏆 ТОП-15 ИГРОКОВ</b>\n\n`;
    
    if (topPlayers.length === 0) {
        text += 'Пока нет игроков с монетами.';
    } else {
        topPlayers.forEach((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const username = user.username ? `@${user.username}` : `ID:${user.playerId}`;
            const games = user.gamesPlayed || 0;
            
            text += `${medal} <b>${username}</b> (ID:${user.playerId})\n`;
            text += `   💰 ${user.balance.toLocaleString()} монет\n`;
            if (games > 0) {
                text += `   🎮 Игр: ${games} | 🏆 Побед: ${user.gamesWon || 0}\n`;
            }
            if (user.bugReports > 0) {
                text += `   🐛 Багов найдено: ${user.bugReports}\n`;
            }
            text += `\n`;
        });
        
        text += `\n📊 Всего игроков: ${Object.keys(usersDB).length}`;
    }
    
    await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Обновить', 'admin:topplayers')],
            [Markup.button.callback('↩️ Назад', 'admin:balance')]
        ])
    });
});

adminScene.action('admin:bugs', async (ctx) => {
    await ctx.answerCbQuery();
    const bugList = getBugReports('new');
    
    if (bugList.length === 0) {
        await ctx.editMessageText('🐛 <b>Новые баг-репорты</b>\n\nНа данный момент нет новых сообщений об ошибках.', {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📜 Все репорты', 'admin:allbugs')],
                [Markup.button.callback('↩️ Назад', 'admin:main')]
            ])
        });
        return;
    }
    
    let text = `🐛 <b>Новые баг-репорты</b>\n\n`;
    bugList.slice(0, 5).forEach((report, index) => {
        const username = report.username ? `@${report.username}` : `ID:${report.playerId}`;
        const preview = report.text.length > 50 ? report.text.substring(0, 50) + '...' : report.text;
        text += `${index + 1}. ${username}\n   ${preview}\n   [ID:${report.id}] /bug${report.id}\n\n`;
    });
    
    if (bugList.length > 5) {
        text += `\n... и еще ${bugList.length - 5} репортов`;
    }
    
    await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('📜 Все репорты', 'admin:allbugs')],
            [Markup.button.callback('🔄 Обновить', 'admin:bugs')],
            [Markup.button.callback('↩️ Назад', 'admin:main')]
        ])
    });
});

adminScene.action('admin:allbugs', async (ctx) => {
    await ctx.answerCbQuery();
    
    if (bugReports.length === 0) {
        await ctx.editMessageText('📜 <b>История баг-репортов</b>\n\nНет зарегистрированных репортов.', {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('↩️ Назад', 'admin:bugs')]
            ])
        });
        return;
    }
    
    let text = `📜 <b>История баг-репортов</b>\n\nВсего: ${bugReports.length}\nНовых: ${getBugReports('new').length}\n\n`;
    
    bugReports.slice(0, 10).forEach((report, index) => {
        const username = report.username ? `@${report.username}` : `ID:${report.playerId}`;
        const statusEmoji = report.status === 'new' ? '🆕' : report.status === 'responded' ? '💬' : '💰';
        const date = new Date(report.createdAt).toLocaleDateString('ru-RU');
        text += `${statusEmoji} ${index + 1}. ${username} (${date})\n   Статус: ${report.status}\n   [ID:${report.id}] /bug${report.id}\n\n`;
    });
    
    await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Обновить', 'admin:allbugs')],
            [Markup.button.callback('↩️ Назад', 'admin:bugs')]
        ])
    });
});

adminScene.action('admin:data', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('💾 <b>Управление данными</b>\n\nВыберите действие:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('💾 Сохранить данные', 'admin:savedata')],
            [Markup.button.callback('📤 Экспорт данных', 'admin:exportdata')],
            [Markup.button.callback('📊 Статистика данных', 'admin:datastats')],
            [Markup.button.callback('↩️ Назад', 'admin:main')]
        ])
    });
});

adminScene.action('admin:savedata', async (ctx) => {
    await ctx.answerCbQuery();
    const success = await saveData();
    if (success) {
        await ctx.editMessageText('✅ <b>Данные успешно сохранены!</b>\n\nВсе данные сохранены в папку /stats', {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('↩️ Назад', 'admin:data')]
            ])
        });
    } else {
        await ctx.editMessageText('❌ <b>Ошибка сохранения данных!</b>\n\nПроверьте права доступа к папке /stats', {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('↩️ Назад', 'admin:data')]
            ])
        });
    }
});

adminScene.action('admin:exportdata', async (ctx) => {
    await ctx.answerCbQuery();
    const success = await exportData();
    if (success) {
        await ctx.editMessageText('✅ <b>Данные успешно экспортированы!</b>\n\nЭкспорт сохранен в папку /stats/exports', {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('↩️ Назад', 'admin:data')]
            ])
        });
    } else {
        await ctx.editMessageText('❌ <b>Ошибка экспорта данных!</b>', {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('↩️ Назад', 'admin:data')]
            ])
        });
    }
});

adminScene.action('admin:datastats', async (ctx) => {
    await ctx.answerCbQuery();
    
    const stats = {
        totalUsers: Object.keys(usersDB).length,
        totalBalance: Object.values(usersDB).reduce((sum, user) => sum + user.balance, 0),
        avgBalance: Math.round(Object.values(usersDB).reduce((sum, user) => sum + user.balance, 0) / Object.keys(usersDB).length) || 0,
        totalGames: Object.values(usersDB).reduce((sum, user) => sum + (user.gamesPlayed || 0), 0),
        totalBugReports: bugReports.length,
        totalChatMessages: chatMessages.length,
        activeChatUsers: Array.from(activeChatUsers).length,
        lastPlayerId: nextPlayerId - 1,
        nextPlayerId: nextPlayerId,
        bugReportCounter: bugReportCounter,
        totalGroups: Object.keys(groupsDB).length
    };
    
    let text = `<b>📊 Статистика данных</b>\n\n`;
    text += `👥 Пользователей: ${stats.totalUsers}\n`;
    text += `💰 Общий баланс: ${stats.totalBalance.toLocaleString()}\n`;
    text += `📈 Средний баланс: ${stats.avgBalance.toLocaleString()}\n`;
    text += `🎮 Игр сыграно: ${stats.totalGames}\n`;
    text += `🐛 Баг-репортов: ${stats.totalBugReports}\n`;
    text += `💬 Сообщений в чате: ${stats.totalChatMessages}\n`;
    text += `💬 В чате сейчас: ${stats.activeChatUsers}\n`;
    text += `👥 Групп: ${stats.totalGroups}\n`;
    text += `🎮 Последний PlayerID: ${stats.lastPlayerId}\n`;
    text += `🎮 Следующий PlayerID: ${stats.nextPlayerId}\n`;
    text += `🐛 Счетчик багов: ${stats.bugReportCounter}\n\n`;
    text += `💾 <b>Папка данных:</b> ${DATA_DIR}`;
    
    await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Обновить', 'admin:datastats')],
            [Markup.button.callback('↩️ Назад', 'admin:data')]
        ])
    });
});

adminScene.on('text', async (ctx) => {
    const awaiting = ctx.scene.state.awaiting;
    const text = ctx.message.text;
    
    switch (awaiting) {
        case 'welcome':
            config.welcomeText = text;
            await saveData();
            await ctx.reply('✅ Приветствие обновлено и сохранено!');
            ctx.scene.state.awaiting = null;
            break;
            
        case 'about':
            config.aboutText = text;
            await saveData();
            await ctx.reply('✅ Текст "О боте" обновлен и сохранен!');
            ctx.scene.state.awaiting = null;
            break;
            
        case 'photo':
            config.photoUrl = text.trim();
            await saveData();
            await ctx.reply('✅ Фото успешно обновлено и сохранено!');
            ctx.scene.state.awaiting = null;
            break;
            
        case 'getuser_for_balance':
            const input = text.trim();
            let user;
            
            if (!isNaN(input)) {
                user = getUserByPlayerId(parseInt(input));
            } else {
                const username = input.replace('@', '');
                user = Object.values(usersDB).find(u => u.username === username);
            }
            
            if (!user) {
                await ctx.reply(`❌ Пользователь не найден.\n\nВведите PlayerID или username еще раз:`);
                return;
            }
            
            ctx.scene.state.targetUserId = user.id;
            ctx.scene.state.targetPlayerId = user.playerId;
            ctx.scene.state.targetUsername = user.username || `ID:${user.playerId}`;
            
            await ctx.reply(`👤 Пользователь: ${user.username ? '@' + user.username : `ID:${user.playerId}`}\n🎮 PlayerID: ${user.playerId}\n💰 Текущий баланс: ${user.balance.toLocaleString()} монет\n\n💸 Введите сумму для изменения баланса (можно отрицательную для уменьшения):`);
            ctx.scene.state.awaiting = 'change_balance_amount';
            break;
            
        case 'change_balance_amount':
            const amount = parseInt(text);
            const targetUserId = ctx.scene.state.targetUserId;
            const playerId = ctx.scene.state.targetPlayerId;
            const username = ctx.scene.state.targetUsername;
            
            if (isNaN(amount)) {
                await ctx.reply('❌ Введите корректное число!');
                return;
            }
            
            const userToUpdate = getUser(targetUserId);
            if (!userToUpdate) {
                await ctx.reply('❌ Пользователь не найден!');
                ctx.scene.state.awaiting = null;
                return;
            }
            
            const oldBalance = userToUpdate.balance;
            userToUpdate.balance += amount;
            const newBalance = userToUpdate.balance;
            
            await saveData();
            
            await ctx.reply(`✅ Баланс обновлен и сохранен!\n\n👤 ${username}\n🎮 PlayerID: ${playerId}\n📊 Было: ${oldBalance.toLocaleString()}\n📈 Изменение: ${amount > 0 ? '+' : ''}${amount.toLocaleString()}\n💰 Стало: ${newBalance.toLocaleString()}`);
            
            ctx.scene.state.targetUserId = null;
            ctx.scene.state.targetPlayerId = null;
            ctx.scene.state.targetUsername = null;
            ctx.scene.state.awaiting = null;
            break;
            
        default:
            if (text.startsWith('/bug')) {
                const bugId = parseInt(text.replace('/bug', ''));
                if (!isNaN(bugId)) {
                    const report = bugReports.find(r => r.id === bugId);
                    if (report) {
                        const username = report.username ? `@${report.username}` : `ID:${report.playerId}`;
                        const date = new Date(report.createdAt).toLocaleString('ru-RU');
                        const statusText = report.status === 'new' ? '🆕 Новый' : 
                                          report.status === 'responded' ? '💬 Отвечено' : 
                                          '💰 Вознаграждено';
                        
                        let text = `🐛 <b>Баг-репорт #${report.id}</b>\n\n`;
                        text += `👤 От: ${username} (ID:${report.playerId})\n`;
                        text += `📅 Дата: ${date}\n`;
                        text += `📊 Статус: ${statusText}\n\n`;
                        text += `<b>Сообщение:</b>\n${report.text}\n\n`;
                        
                        if (report.adminResponse) {
                            text += `<b>Ответ админа:</b>\n${report.adminResponse}\n\n`;
                        }
                        
                        if (report.rewardAmount > 0) {
                            text += `💰 Вознаграждение: ${report.rewardAmount.toLocaleString()} монет\n`;
                        }
                        
                        await ctx.reply(text, { parse_mode: 'HTML' });
                        return;
                    }
                }
            }
            await ctx.reply('⚠️ Неизвестная команда или действие.');
            break;
    }
});

adminScene.action('admin:main', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('🔑 <b>Админ-панель</b>\n\nВыберите действие:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('📝 Изменить приветствие', 'admin:welcome')],
            [Markup.button.callback('🖊 Изменить "О боте"', 'admin:about')],
            [Markup.button.callback('🖼 Изменить фото', 'admin:photo')],
            [Markup.button.callback('💰 Управление балансами', 'admin:balance')],
            [Markup.button.callback(`🐛 Баг-репорты (${getBugReports('new').length}🆕)`, 'admin:bugs')],
            [Markup.button.callback('💾 Управление данными', 'admin:data')],
            [Markup.button.callback('👥 Статистика', 'admin:users')],
            [Markup.button.callback('🚪 Выйти', 'admin:close')]
        ])
    });
});

adminScene.action('admin:close', async (ctx) => {
    await ctx.answerCbQuery();
    await saveData();
    await ctx.editMessageText('🚪 <b>Вы вышли из админ-панели.</b>\n\n💾 Все изменения сохранены.', { parse_mode: 'HTML' });
    await ctx.scene.leave();
});

const gameScene = new Scenes.BaseScene('game_transfer');

gameScene.enter(async (ctx) => {
    const user = getUser(ctx.from.id);
    await ctx.reply(`💰 <b>Ваш баланс:</b> ${user.balance.toLocaleString()} монет\n🎮 <b>Ваш ID:</b> ${user.playerId}\n\n💸 Введите сумму для перевода (минимум ${GAME_SETTINGS.MIN_TRANSFER}):`, {
        parse_mode: 'HTML',
        reply_markup: { remove_keyboard: true }
    });
});

gameScene.on('text', async (ctx) => {
    const text = ctx.message.text;
    
    if (!ctx.scene.state.step) {
        const amount = parseInt(text);
        const user = getUser(ctx.from.id);
        
        if (isNaN(amount) || amount < GAME_SETTINGS.MIN_TRANSFER) {
            await ctx.reply(`❌ Введите корректную сумму (минимум ${GAME_SETTINGS.MIN_TRANSFER}):`);
            return;
        }
        
        if (amount > user.balance) {
            await ctx.reply(`❌ Недостаточно средств! Ваш баланс: ${user.balance.toLocaleString()}\n\nВведите другую сумму:`);
            return;
        }
        
        ctx.scene.state.amount = amount;
        ctx.scene.state.step = 'recipient';
        
        await ctx.reply(`✅ Сумма: ${amount.toLocaleString()} монет\n\n👤 Теперь введите PlayerID получателя или его username (без @):`);
    } else if (ctx.scene.state.step === 'recipient') {
        const recipient = text.trim();
        let targetUser;
        
        if (!isNaN(recipient)) {
            targetUser = getUserByPlayerId(parseInt(recipient));
        } else {
            const username = recipient.replace('@', '');
            targetUser = Object.values(usersDB).find(u => u.username === username);
        }
        
        if (!targetUser) {
            await ctx.reply(`❌ Получатель не найден.\n\nВведите PlayerID или username еще раз:`);
            return;
        }
        
        if (targetUser.id === ctx.from.id) {
            await ctx.reply('❌ Нельзя переводить самому себе!\n\nВведите другого получателя:');
            return;
        }
        
        ctx.scene.state.targetUserId = targetUser.id;
        ctx.scene.state.targetPlayerId = targetUser.playerId;
        ctx.scene.state.targetUsername = targetUser.username || `ID:${targetUser.playerId}`;
        ctx.scene.state.step = 'confirmation';
        
        await ctx.reply(`📝 <b>Подтвердите перевод:</b>\n\n👤 Кому: ${targetUser.username ? '@' + targetUser.username : `ID:${targetUser.playerId}`}\n🎮 PlayerID: ${targetUser.playerId}\n💰 Сумма: ${ctx.scene.state.amount.toLocaleString()} монет\n\n✅ Да - подтвердить\n❌ Нет - отменить`, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ Да, подтвердить', 'transfer_yes')],
                [Markup.button.callback('❌ Нет, отменить', 'transfer_no')]
            ])
        });
    }
});

gameScene.action('transfer_yes', async (ctx) => {
    await ctx.answerCbQuery();
    
    const result = transferCoins(
        ctx.from.id,
        ctx.scene.state.targetUserId,
        ctx.scene.state.amount
    );
    
    if (result.success) {
        await saveData();
        
        await ctx.editMessageText(`✅ Перевод успешно выполнен!\n\n👤 Получатель: ${ctx.scene.state.targetUsername}\n🎮 PlayerID: ${ctx.scene.state.targetPlayerId}\n💰 Сумма: ${ctx.scene.state.amount.toLocaleString()} монет\n\n📊 Ваш новый баланс: ${result.fromBalance.toLocaleString()}`, {
            parse_mode: 'HTML'
        });
        
        sendMessageSafely(
            ctx.scene.state.targetUserId,
            `🎉 Вы получили перевод!\n\n👤 От: ${ctx.from.username ? '@' + ctx.from.username : `ID:${getUser(ctx.from.id).playerId}`}\n🎮 PlayerID отправителя: ${getUser(ctx.from.id).playerId}\n💰 Сумма: ${ctx.scene.state.amount.toLocaleString()} монет\n\n📊 Ваш новый баланс: ${result.toBalance.toLocaleString()}`
        ).catch(() => {});
    } else {
        await ctx.editMessageText(`❌ Ошибка перевода: ${result.error}`, {
            parse_mode: 'HTML'
        });
    }
    
    await ctx.scene.leave();
});

gameScene.action('transfer_no', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('❌ Перевод отменен.');
    await ctx.scene.leave();
});

const casinoScene = new Scenes.BaseScene('casino_game');

casinoScene.enter(async (ctx) => {
    const user = getUser(ctx.from.id);
    await ctx.reply(`🎰 <b>Казино</b>\n\n💰 Ваш баланс: ${user.balance.toLocaleString()} монет\n\nВыберите тип ставки:`, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(GAME_SETTINGS.CASINO_BETS.easy.name, 'casino_easy')],
            [Markup.button.callback(GAME_SETTINGS.CASINO_BETS.medium.name, 'casino_medium')],
            [Markup.button.callback(GAME_SETTINGS.CASINO_BETS.hard.name, 'casino_hard')],
            [Markup.button.callback('↩️ Назад в меню', 'casino_back_menu')]
        ])
    });
});

casinoScene.action('casino_easy', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.scene.state.betType = 'easy';
    await askBetAmount(ctx);
});

casinoScene.action('casino_medium', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.scene.state.betType = 'medium';
    await askBetAmount(ctx);
});

casinoScene.action('casino_hard', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.scene.state.betType = 'hard';
    await askBetAmount(ctx);
});

casinoScene.action('casino_back_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.leave();
});

async function askBetAmount(ctx) {
    const settings = GAME_SETTINGS.CASINO_BETS[ctx.scene.state.betType];
    await ctx.editMessageText(`🎰 <b>${settings.name}</b>\n\n📊 Шанс выигрыша: ${settings.winChance}%\n💰 Множитель: x${settings.multiplier}\n💰 Ваша прибыль при выигрыше: (ставка × ${settings.multiplier - 1})\n💸 Потеря при проигрыше: -ставка\n\nВведите сумму ставки (минимум ${GAME_SETTINGS.MIN_BET}):\n\n<i>Напишите "отмена" для выхода из казино</i>`, {
        parse_mode: 'HTML'
    });
    ctx.scene.state.step = 'amount';
}

casinoScene.on('text', async (ctx) => {
    const text = ctx.message.text;
    
    if (text.toLowerCase() === 'отмена') {
        await ctx.reply('❌ Игра отменена. Возвращаемся в меню...');
        await ctx.scene.leave();
        return;
    }
    
    if (ctx.scene.state.step === 'amount') {
        const amount = parseInt(text);
        const user = getUser(ctx.from.id);
        
        if (isNaN(amount) || amount < GAME_SETTINGS.MIN_BET) {
            await ctx.reply(`❌ Минимальная ставка: ${GAME_SETTINGS.MIN_BET} монет\n\nВведите сумму еще раз или напишите "отмена" для выхода:`, {
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🚫 Отменить игру', 'casino_cancel')]
                ])
            });
            return;
        }
        
        if (amount > user.balance) {
            await ctx.reply(`❌ Недостаточно средств! Ваш баланс: ${user.balance.toLocaleString()}\n\nВведите другую сумму или напишите "отмена" для выхода:`, {
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🚫 Отменить игру', 'casino_cancel')]
                ])
            });
            return;
        }
        
        const result = playCasino(ctx.scene.state.betType, amount);
        updateBalance(ctx.from.id, result.amount, 'casino');
        
        await saveData();
        
        const settings = GAME_SETTINGS.CASINO_BETS[ctx.scene.state.betType];
        
        if (result.win) {
            const winAmount = Math.round(amount * (settings.multiplier - 1));
            const totalReturn = amount + winAmount;
            await ctx.reply(`🎉 <b>ПОБЕДА!</b>\n\n${settings.emoji} ${settings.name}\n🎰 Ставка: ${amount.toLocaleString()} монет\n💰 Выигрыш: +${winAmount.toLocaleString()} монет\n💵 Всего возвращено: ${totalReturn.toLocaleString()} монет\n📈 Ваш новый баланс: ${user.balance.toLocaleString()}`, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🎰 Сыграть еще', 'casino_play_again')],
                    [Markup.button.callback('↩️ Выйти', 'casino_back_menu')]
                ])
            });
        } else {
            await ctx.reply(`💸 <b>ПРОИГРЫШ</b>\n\n${settings.emoji} ${settings.name}\n🎰 Ставка: ${amount.toLocaleString()} монет\n💰 Потеряно: ${amount.toLocaleString()} монет\n📉 Ваш новый баланс: ${user.balance.toLocaleString()}`, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🎰 Сыграть еще', 'casino_play_again')],
                    [Markup.button.callback('↩️ Выйти', 'casino_back_menu')]
                ])
            });
        }
        
        ctx.scene.state.step = null;
    }
});

casinoScene.action('casino_cancel', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('❌ Игра отменена. Возвращаемся в меню...');
    await ctx.scene.leave();
});

casinoScene.action('casino_play_again', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.reenter();
});

const bugReportScene = new Scenes.BaseScene('bug_report');

bugReportScene.enter(async (ctx) => {
    await ctx.reply(`🐛 <b>Сообщение об ошибке</b>\n\nОпишите найденную ошибку или проблему в <b>одном сообщении</b>:\n\n• Что пошло не так?\n• Как это воспроизвести?\n• Каков ожидаемый результат?\n\n<em>Чем подробнее описание, тем быстрее мы решим проблему!</em>`, {
        parse_mode: 'HTML',
        reply_markup: { remove_keyboard: true }
    });
});

bugReportScene.on('text', async (ctx) => {
    const reportText = ctx.message.text;
    
    if (reportText.length < 5) {
        await ctx.reply('❌ Сообщение слишком короткое. Опишите проблему подробнее:');
        return;
    }
    
    if (reportText.length > 2000) {
        await ctx.reply('❌ Сообщение слишком длинное. Опишите проблему короче (до 2000 символов):');
        return;
    }
    
    const user = getUser(ctx.from.id);
    const report = addBugReport(
        ctx.from.id,
        ctx.from.username,
        reportText
    );
    
    sendMessageSafely(
        ADMIN_ID,
        `🐛 <b>Новый баг-репорт #${report.id}</b>\n\n👤 От: ${ctx.from.username ? '@' + ctx.from.username : `ID:${user.playerId}`} (PlayerID: ${user.playerId})\n📅 Время: ${new Date().toLocaleString('ru-RU')}\n\n<b>Сообщение:</b>\n${reportText}\n\nДля ответа используйте /bug${report.id} в админ-панели`
    ).catch(() => {});
    
    await ctx.reply(`✅ <b>Спасибо за отчет!</b>\n\nВаше сообщение об ошибке было отправлено администратору. Мы рассмотрим его в ближайшее время.\n\nЕсли у нас будут уточняющие вопросы, мы свяжемся с вами здесь же в чате.\n\nID вашего отчета: #${report.id}`, {
        parse_mode: 'HTML'
    });
    
    await ctx.scene.leave();
});

const stage = new Scenes.Stage([adminScene, gameScene, casinoScene, bugReportScene]);
bot.use(session());
bot.use(stage.middleware());

// ========== КОМАНДЫ ДЛЯ ЛИЧНЫХ СООБЩЕНИЙ ==========

bot.start(async (ctx) => {
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
        await ctx.replyWithHTML(`🎮 <b>Бот активирован в группе!</b>\n\n` +
                              `✨ <b>Используйте ролевые команды:</b>\n` +
                              `"обнять @username" или ответьте "обнять" на сообщение\n` +
                              `"поцеловать @username" или ответьте "поцеловать" на сообщение\n\n` +
                              `📋 Все команды: <code>/role</code>\n\n` +
                              `🎰 Для игр напишите мне в личные сообщения!`);
        return;
    }
    
    const user = initUser(ctx.from.id, ctx.from.username, ctx.from.first_name, ctx.from.last_name);
    
    const welcomeMessage = `${config.welcomeText}\n\n` +
                          `📋 <b>Доступные команды:</b>\n` +
                          `<code>/game</code> - Игровой центр\n` +
                          `<code>/chat</code> - Общий чат\n` +
                          `<code>/about</code> - О боте\n` +
                          `<code>/help</code> - Помощь\n\n` +
                          `🎭 <b>Ролевые команды (в группах):</b>\n` +
                          `<code>/role</code> - список команд\n` +
                          `"обнять @username" или ответьте "обнять"\n` +
                          `"поцеловать @username" или ответьте "поцеловать"\n\n` +
                          `🎮 <b>Ваш PlayerID:</b> ${user.playerId}\n` +
                          `💰 Ваш баланс: ${user.balance.toLocaleString()} монет`;
    
    try {
        await ctx.replyWithPhoto(
            { url: config.photoUrl },
            {
                caption: welcomeMessage,
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard(
                    config.links.map(link => [Markup.button.url(link.name, link.url)]),
                    {}
                )
            }
        );
    } catch (e) {
        await ctx.reply(welcomeMessage, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(
                config.links.map(link => [Markup.button.url(link.name, link.url)]),
                {}
            )
        });
    }
});

bot.command('game', async (ctx) => {
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
        await ctx.replyWithHTML('🎮 <b>Игровые функции доступны только в личных сообщениях!</b>\n\nНапишите боту в личные сообщения /start для доступа к играм.');
        return;
    }
    
    const user = getUser(ctx.from.id);
    const gameText = `🎮 <b>ИГРОВОЙ ЦЕНТР</b>\n\n` +
                    `🎮 <b>Ваш PlayerID:</b> ${user.playerId}\n` +
                    `💰 Ваш баланс: <b>${user.balance.toLocaleString()} монет</b>\n\n` +
                    `<b>Доступные функции:</b>\n` +
                    `🎰 Казино - 3 уровня риска\n` +
                    `💸 Переводы - отправьте монеты другу (по PlayerID)\n` +
                    `🏆 Топ - таблица лидеров\n` +
                    `💬 Чат - общайтесь с другими игроками\n` +
                    `🐛 Баг-репорты - помогите улучшить бот\n\n` +
                    `<i>Выберите действие:</i>`;
    
    await ctx.reply(gameText, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('💰 Мой баланс', 'game_balance')],
            [Markup.button.callback('💸 Перевести другу', 'game_transfer')],
            [Markup.button.callback('🎰 Казино', 'game_casino')],
            [Markup.button.callback('🏆 Топ игроков', 'game_top')],
            [Markup.button.callback('💬 Общий чат', 'game_chat')],
            [Markup.button.callback('🐛 Сообщить об ошибке', 'game_bug')],
            [Markup.button.callback('❓ Помощь', 'game_help')]
        ])
    });
});

bot.command('chat', async (ctx) => {
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
        await ctx.replyWithHTML('💬 <b>Общий чат доступен только в личных сообщениях!</b>\n\nНапишите боту в личные сообщения /start для доступа к общему чату.');
        return;
    }
    
    const user = getUser(ctx.from.id);
    
    if (isInChat(ctx.from.id)) {
        const recentMessages = getRecentChatMessages(10);
        
        let chatText = `💬 <b>Общий чат</b>\n\n`;
        chatText += `🎮 <b>Ваш PlayerID:</b> ${user.playerId}\n`;
        chatText += `👤 <b>Вы в чате как:</b> ${user.username ? '@' + user.username : `ID:${user.playerId}`}\n`;
        chatText += `👥 <b>Сейчас в чате:</b> ${getActiveChatUsers().length} человек\n\n`;
        chatText += `📝 <b>Отправьте любое сообщение, и его увидят все в чате</b>\n`;
        chatText += `📸 <b>Фото также отправляются всем</b>\n`;
        chatText += `🚪 <b>Для выхода из чата:</b> /exit\n\n`;
        
        if (recentMessages.length > 0) {
            chatText += `<b>Последние сообщения:</b>\n`;
            recentMessages.reverse().forEach(msg => {
                const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                const sender = msg.username ? `@${msg.username}` : `ID:${msg.playerId}`;
                const content = msg.isPhoto ? '[Фото]' : msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text;
                chatText += `[${time}] (ID:${msg.playerId}) ${sender}: ${content}\n`;
            });
        } else {
            chatText += `📭 <i>Сообщений пока нет. Будьте первым!</i>\n`;
        }
        
        await ctx.reply(chatText, {
            parse_mode: 'HTML',
            reply_markup: { remove_keyboard: true }
        });
    } else {
        joinChat(ctx.from.id);
        
        const chatText = `💬 <b>Добро пожаловать в общий чат!</b>\n\n` +
                        `🎮 <b>Ваш PlayerID:</b> ${user.playerId}\n` +
                        `👤 <b>Вы в чате как:</b> ${user.username ? '@' + user.username : `ID:${user.playerId}`}\n` +
                        `👥 <b>Сейчас в чате:</b> ${getActiveChatUsers().length} человек\n\n` +
                        `📝 <b>Отправьте любое сообщение, и его увидят все в чате</b>\n` +
                        `📸 <b>Фото также отправляются всем</b>\n` +
                        `🚪 <b>Для выхода из чата:</b> /exit\n\n` +
                        `<i>Пожалуйста, соблюдайте правила общения!</i>`;
        
        await ctx.reply(chatText, {
            parse_mode: 'HTML',
            reply_markup: { remove_keyboard: true }
        });
        
        const joinMessage = `👋 <b>Новый участник в чате!</b>\n` +
                           `${user.username ? '@' + user.username : `ID:${user.playerId}`} (ID:${user.playerId}) присоединился к чату.`;
        
        broadcastToChat(joinMessage, ctx.from.id).catch(() => {});
    }
});

bot.command('exit', async (ctx) => {
    if (isInChat(ctx.from.id)) {
        const user = getUser(ctx.from.id);
        leaveChat(ctx.from.id);
        
        await ctx.reply(`🚪 <b>Вы вышли из чата</b>\n\nЧтобы вернуться, используйте команду /chat`, {
            parse_mode: 'HTML'
        });
        
        const leaveMessage = `🚶 <b>Участник вышел из чата</b>\n` +
                            `${user.username ? '@' + user.username : `ID:${user.playerId}`} (ID:${user.playerId}) покинул чат.`;
        
        broadcastToChat(leaveMessage, ctx.from.id).catch(() => {});
    } else {
        await ctx.reply('❌ Вы не в чате. Чтобы войти, используйте /chat', {
            parse_mode: 'HTML'
        });
    }
});

bot.on('message', async (ctx, next) => {
    if (isInChat(ctx.from.id) && (ctx.chat.type === 'private')) {
        const user = getUser(ctx.from.id);
        const message = ctx.message;
        
        if (message.text && message.text.startsWith('/')) {
            return next();
        }
        
        if (message.text) {
            const chatMessage = addChatMessage(
                ctx.from.id,
                ctx.from.username,
                user.playerId,
                message.text,
                false
            );
            
            const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const formattedMessage = `[${time}] (ID:${user.playerId}) ${user.username ? '@' + user.username : `ID:${user.playerId}`}: ${message.text}`;
            
            broadcastToChat(formattedMessage, ctx.from.id).catch(() => {});
            return;
        } else if (message.photo) {
            const photo = message.photo[message.photo.length - 1];
            const fileId = photo.file_id;
            
            const caption = message.caption || '';
            const chatMessage = addChatMessage(
                ctx.from.id,
                ctx.from.username,
                user.playerId,
                caption || '[Фото]',
                true
            );
            
            const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const senderInfo = `${user.username ? '@' + user.username : `ID:${user.playerId}`} (ID:${user.playerId})`;
            
            const activeUsers = getActiveChatUsers();
            
            activeUsers.forEach(async (activeUser) => {
                if (activeUser.id === ctx.from.id) return;
                
                sendPhotoSafely(
                    activeUser.id, 
                    fileId, 
                    `[${time}] ${senderInfo} отправил фото${caption ? ': ' + caption : ''}`
                ).catch(() => {});
            });
            
            return;
        }
    }
    
    await next();
});

bot.action('game_balance', async (ctx) => {
    await ctx.answerCbQuery();
    const user = getUser(ctx.from.id);
    await ctx.editMessageText(`💰 <b>Ваш баланс:</b> ${user.balance.toLocaleString()} монет\n` +
                             `🎮 <b>Ваш PlayerID:</b> ${user.playerId}\n\n` +
                             `🎮 Игр сыграно: ${user.gamesPlayed || 0}\n` +
                             `🏆 Побед: ${user.gamesWon || 0}\n` +
                             `📈 Всего выиграно: ${user.totalWinnings?.toLocaleString() || 0} монет\n` +
                             `🐛 Багов найдено: ${user.bugReports || 0}\n` +
                             `💰 Вознаграждений: ${user.bugRewards?.toLocaleString() || 0} монет\n` +
                             `💬 Сообщений в чате: ${user.chatMessages || 0}`, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('💰 Мой баланс', 'game_balance')],
            [Markup.button.callback('💸 Перевести другу', 'game_transfer')],
            [Markup.button.callback('🎰 Казино', 'game_casino')],
            [Markup.button.callback('🏆 Топ игроков', 'game_top')],
            [Markup.button.callback('💬 Общий чат', 'game_chat')],
            [Markup.button.callback('🐛 Сообщить об ошибке', 'game_bug')],
            [Markup.button.callback('❓ Помощь', 'game_help')]
        ])
    });
});

bot.action('game_transfer', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('game_transfer');
});

bot.action('game_casino', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('casino_game');
});

bot.action('game_top', async (ctx) => {
    await ctx.answerCbQuery();
    const topPlayers = getTopPlayers(15);
    
    let text = `<b>🏆 ТОП-15 ИГРОКОВ</b>\n\n`;
    
    if (topPlayers.length === 0) {
        text += 'Пока нет игроков с монетами.';
    } else {
        topPlayers.forEach((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const username = user.username ? `@${user.username}` : `ID:${user.playerId}`;
            const games = user.gamesPlayed || 0;
            
            text += `${medal} <b>${username}</b> (ID:${user.playerId})\n`;
            text += `   💰 ${user.balance.toLocaleString()} монет\n`;
            if (games > 0) {
                text += `   🎮 Игр: ${games} | 🏆 Побед: ${user.gamesWon || 0}\n`;
            }
            if (user.bugReports > 0) {
                text += `   🐛 Багов найдено: ${user.bugReports}\n`;
            }
            text += `\n`;
        });
        
        text += `\n📊 Всего игроков: ${Object.keys(usersDB).length}`;
    }
    
    await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Обновить', 'game_top')],
            [Markup.button.callback('↩️ Назад', 'game_back')]
        ])
    });
});

bot.action('game_chat', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('💬 <b>Общий чат</b>\n\nИспользуйте команду /chat для входа в общий чат с другими игроками!\n\nВ чате вы можете:\n• Общаться с другими игроками\n• Отправлять фото\n• Узнавать новости\n\n🚪 Для выхода используйте /exit', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('💰 Мой баланс', 'game_balance')],
            [Markup.button.callback('💸 Перевести другу', 'game_transfer')],
            [Markup.button.callback('🎰 Казино', 'game_casino')],
            [Markup.button.callback('🏆 Топ игроков', 'game_top')],
            [Markup.button.callback('💬 Общий чат', 'game_chat')],
            [Markup.button.callback('🐛 Сообщить об ошибке', 'game_bug')],
            [Markup.button.callback('❓ Помощь', 'game_help')]
        ])
    });
});

bot.action('game_bug', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('bug_report');
});

bot.action('game_help', async (ctx) => {
    await ctx.answerCbQuery();
    const helpText = `📋 <b>Доступные команды:</b>\n\n` +
                   `/start - Главное меню бота\n` +
                   `/game - Игровой центр (баланс, казино, переводы)\n` +
                   `/chat - Общий чат с игроками\n` +
                   `/about - Информация о боте\n` +
                   `/help - Список всех команд\n` +
                   `/kot1ch - Админ-панель (только для админа)\n\n` +
                   `🎮 <b>Игровые функции:</b>\n` +
                   `• Казино с 3 уровнями риска\n` +
                   `• Переводы монет другим игрокам (по PlayerID)\n` +
                   `• Топ игроков по балансу\n` +
                   `• Общий чат с игроками\n` +
                   `• Система вознаграждений за баг-репорты\n\n` +
                   `🎭 <b>Ролевые команды (работают в группах):</b>\n` +
                   `/role - список всех ролевых команд\n` +
                   `"обнять @username" или ответьте "обнять"\n` +
                   `"трахнуть @username" или ответьте "трахнуть"\n\n` +
                   `🎮 <b>Ваш PlayerID:</b> уникальный номер игрока\n` +
                   `🐛 <b>Нашли ошибку?</b>\n` +
                   `Нажмите кнопку "Сообщить об ошибке" в игровом центре!`;
    
    await ctx.editMessageText(helpText, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('💰 Мой баланс', 'game_balance')],
            [Markup.button.callback('💸 Перевести другу', 'game_transfer')],
            [Markup.button.callback('🎰 Казино', 'game_casino')],
            [Markup.button.callback('🏆 Топ игроков', 'game_top')],
            [Markup.button.callback('💬 Общий чат', 'game_chat')],
            [Markup.button.callback('🐛 Сообщить об ошибке', 'game_bug')],
            [Markup.button.callback('❓ Помощь', 'game_help')]
        ])
    });
});

bot.action('game_back', async (ctx) => {
    await ctx.answerCbQuery();
    const user = getUser(ctx.from.id);
    await ctx.editMessageText(`🎮 <b>ИГРОВОЙ ЦЕНТР</b>\n\n🎮 Ваш PlayerID: ${user.playerId}\n💰 Ваш баланс: <b>${user.balance.toLocaleString()} монет</b>`, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('💰 Мой баланс', 'game_balance')],
            [Markup.button.callback('💸 Перевести другу', 'game_transfer')],
            [Markup.button.callback('🎰 Казино', 'game_casino')],
            [Markup.button.callback('🏆 Топ игроков', 'game_top')],
            [Markup.button.callback('💬 Общий чат', 'game_chat')],
            [Markup.button.callback('🐛 Сообщить об ошибке', 'game_bug')],
            [Markup.button.callback('❓ Помощь', 'game_help')]
        ])
    });
});

bot.command('about', async (ctx) => {
    await ctx.replyWithHTML(config.aboutText + `\n\n📋 Все команды: /help`);
});

bot.command('help', async (ctx) => {
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
        await ctx.replyWithHTML(`📋 <b>Помощь по боту</b>\n\n` +
                              `🎭 <b>Ролевые команды:</b>\n` +
                              `<code>/role</code> - все команды\n` +
                              `"обнять @username" или ответьте "обнять"\n` +
                              `"трахнуть @username" или ответьте "трахнуть"\n\n` +
                              `👑 <b>Для админов:</b>\n` +
                              `<code>/adult on/off</code> - 18+ контент\n` +
                              `<code>/groupstats</code> - статистика\n\n` +
                              `🎮 <b>Игры и переводы:</b>\n` +
                              `Напишите боту в личные сообщения!`);
        return;
    }
    
    const helpText = `📋 <b>Доступные команды:</b>\n\n` +
                   `/start - Главное меню бота\n` +
                   `/game - Игровой центр (баланс, казино, переводы)\n` +
                   `/chat - Общий чат с игроками\n` +
                   `/about - Информация о боте\n` +
                   `/help - Список всех команд\n` +
                   `/kot1ch - Админ-панель (только для админа)\n\n` +
                   `🎮 <b>Игровые функции:</b>\n` +
                   `• Казино с 3 уровнями риска\n` +
                   `• Переводы монет другим игрокам (по PlayerID)\n` +
                   `• Топ игроков по балансу\n` +
                   `• Общий чат с игроками\n` +
                   `• Система вознаграждений за баг-репорты\n\n` +
                   `🎭 <b>Ролевые команды (работают в группах):</b>\n` +
                   `/role - список всех ролевых команд\n` +
                   `"обнять @username" или ответьте "обнять"\n` +
                   `"трахнуть @username" или ответьте "трахнуть"\n\n` +
                   `🎮 <b>Ваш PlayerID:</b> уникальный номер игрока\n` +
                   `🐛 <b>Нашли ошибку?</b>\n` +
                   `Нажмите кнопку "Сообщить об ошибке" в игровом центре!`;
    
    await ctx.replyWithHTML(helpText);
});

bot.command('kot1ch', async (ctx) => {
    if (String(ctx.from.id) !== String(ADMIN_ID)) {
        return ctx.reply('⛔ Команда не найдена.');
    }
    await ctx.reply('🔑 <b>Админ-панель теперь доступна!</b>', { parse_mode: 'HTML' });
    await ctx.scene.enter('admin');
});

bot.command(/^bug(\d+)$/, async (ctx) => {
    if (String(ctx.from.id) !== String(ADMIN_ID)) {
        return ctx.reply('⛔ Команда не найдена.');
    }
    
    const bugId = parseInt(ctx.match[1]);
    const report = bugReports.find(r => r.id === bugId);
    
    if (report) {
        const username = report.username ? `@${report.username}` : `ID:${report.playerId}`;
        const date = new Date(report.createdAt).toLocaleString('ru-RU');
        const statusText = report.status === 'new' ? '🆕 Новый' : 
                          report.status === 'responded' ? '💬 Отвечено' : 
                          '💰 Вознаграждено';
        
        let text = `🐛 <b>Баг-репорт #${report.id}</b>\n\n`;
        text += `👤 От: ${username} (ID:${report.playerId})\n`;
        text += `📅 Дата: ${date}\n`;
        text += `📊 Статус: ${statusText}\n\n`;
        text += `<b>Сообщение:</b>\n${report.text}\n\n`;
        
        if (report.adminResponse) {
            text += `<b>Ответ админа:</b>\n${report.adminResponse}\n\n`;
        }
        
        if (report.rewardAmount > 0) {
            text += `💰 Вознаграждение: ${report.rewardAmount.toLocaleString()} монет\n`;
        }
        
        await ctx.reply(text, { parse_mode: 'HTML' });
    } else {
        await ctx.reply(`❌ Баг-репорт #${bugId} не найден.`);
    }
});

bot.on('text', async (ctx, next) => {
    if (ctx.message.text && ctx.message.text.startsWith('/')) {
        return next();
    }
    
    if (ctx.message.reply_to_message && String(ctx.from.id) === String(ADMIN_ID)) {
        const originalText = ctx.message.reply_to_message.text;
        const userIdMatch = originalText.match(/PlayerID: (\d+)/) || originalText.match(/ID:(\d+)/);
        if (userIdMatch) {
            const playerId = parseInt(userIdMatch[1]);
            const user = getUserByPlayerId(playerId);
            
            if (user) {
                sendMessageSafely(
                    user.id,
                    `💬 <b>Администратор написал вам:</b>\n\n${ctx.message.text}\n\nВы можете ответить на это сообщение.`
                ).then(success => {
                    if (success) {
                        ctx.reply(`✅ Сообщение отправлено игроку ID:${playerId} (@${user.username || 'без username'})`);
                    } else {
                        ctx.reply(`❌ Не удалось отправить сообщение игроку ID:${playerId}`);
                    }
                }).catch(() => {
                    ctx.reply(`❌ Ошибка при отправке сообщения`);
                });
                return;
            }
        }
    }
    
    await next();
});

// Автоматический выход из чата при неактивности
setInterval(() => {
    const now = Date.now();
    const inactiveUsers = Array.from(activeChatUsers).filter(userId => {
        const user = getUser(userId);
        if (!user) return true;
        const lastActive = new Date(user.lastActive).getTime();
        return (now - lastActive) > 30 * 60 * 1000;
    });
    
    inactiveUsers.forEach(userId => {
        leaveChat(userId);
        console.log(`🕒 Пользователь ${userId} автоматически вышел из чата из-за неактивности`);
    });
}, 30 * 60 * 1000);

bot.catch((err, ctx) => {
    console.error(`⚠️ Bot error for ${ctx.from && (ctx.from.username || ctx.from.id)}: ${err.message}`);
    
    if (err.message.includes('Timeout') || err.message.includes('timed out') || 
        err.message.includes('blocked') || err.message.includes('chat not found')) {
        return;
    }
    
    try {
        ctx.reply('Произошла ошибка 🛠️. Попробуйте позже или сообщите об ошибке через /game → "Сообщить об ошибке".');
    } catch { }
});

async function initializeBot() {
    console.log('📂 Загрузка данных...');
    await loadData();
    
    bot.telegram.options.timeout = 10000;
    
    await bot.launch({
        timeout: 10000,
        allowedUpdates: ['message', 'callback_query', 'chat_member']
    });
    
    console.log('🎮 Бот успешно запущен!');
    console.log(`💰 Начальный баланс: ${GAME_SETTINGS.START_BALANCE} монет`);
    console.log(`🎰 Множители казино: ${GAME_SETTINGS.CASINO_BETS.easy.multiplier}x / ${GAME_SETTINGS.CASINO_BETS.medium.multiplier}x / ${GAME_SETTINGS.CASINO_BETS.hard.multiplier}x`);
    console.log(`👑 Админ: ${ADMIN_ID}`);
    console.log(`🎭 Ролевых команд: ${ROLE_COMMANDS.normal.length} обычных + ${ROLE_COMMANDS.adult.length} 18+`);
    console.log(`💾 Данные сохраняются в: ${DATA_DIR}`);
    console.log(`⏱ Таймаут отправки: 10 секунд`);
    console.log('✅ Бот готов к работе в группах и личных сообщениях!');
    console.log('\n📝 Добавьте бота в группу и используйте команды:');
    console.log('   /role - список всех ролевых команд');
    console.log('   /adult on - включить 18+ команды (для админов)');
    console.log('   /groupstats - статистика группы');
    console.log('\n🎭 Как использовать RP команды:');
    console.log('   1. Ответьте на сообщение человека: "обнять"');
    console.log('   2. Или напишите: "обнять @username"');
    console.log('   3. Не используйте / перед командой!');
    
    startAutoSave();
    await saveData();
}

async function gracefulShutdown() {
    console.log('\n🚪 Завершение работы бота...');
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    await saveData();
    await bot.stop();
    console.log('💾 Все данные сохранены');
    console.log('👋 Бот остановлен');
    process.exit(0);
}

process.on('uncaughtException', function (error) {
    console.error('🚨 Необработанная ошибка:', error.message);
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('⚠️ Необработанный промис:', promise, 'причина:', reason);
});

process.once('SIGINT', gracefulShutdown);
process.once('SIGTERM', gracefulShutdown);

initializeBot().catch(console.error);