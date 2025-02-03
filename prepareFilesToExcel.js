const fs = require("fs");
const path = require("path");

// Путь к папкам
const evaluatedFolder = "./evaluated_files";
const sourceFolder = "./source_files";

// Регулярка для извлечения эмоций, UUID и никнейма
const emotionRegex = /\[(?<emotion>[a-z]+)-(?<value>[0-9.]+)\]/g;
const uuidRegex = /_(?<uuid>[a-f0-9\-]+)\.ogg$/;
const nicknameRegex = /^.+(?=_\[happy)/;

const mappingNicknames = {
    '.lokix': 'Александр Ревенко',
    '.redrobin.': 'Евгения Процик',
    '19vt1zaikaantonvladimirovich': 'Aнтон Заика',
    'georgealiev': 'Георгий Алиев',
    'kokojer': 'Андрей Гордеев',
    'lenisstyle': 'Елена Куюкина',
    'martin_prazauskas': 'Мартин Празаускас',
    'm_eagleson': 'Михаил Орлов',
    'unsichtbarerfrosch': 'Полина Юникова',
    'vasyakocherga': 'Александр Бык',
    'valentinshchepin': 'Валентин Щепин',
    'stasia.stv': 'Анастасия Кириллова',
}

// Функция для вычисления метрик
function calculateMetrics(TP, TN, FP, FN, totalDifference, countEmotions, totalMaxEmotions) {
    const accuracy = (TP + TN) / (TP + TN + FP + FN);
    const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
    const recall = TP + FN > 0 ? TP / (TP + FN) : 0;
    const MAE = 1 - totalDifference / countEmotions;
    const MRE = 1 - totalDifference / totalMaxEmotions;
    return { accuracy, precision, recall, MAE, MRE };
}

// Функция для извлечения эмоций, UUID и никнейма
function parseFile(fileName) {
    const matchUuid = fileName.match(uuidRegex);
    const matchNickname = fileName.match(nicknameRegex);

    if (!matchUuid || !matchUuid.groups.uuid) return null;

    const uuid = matchUuid.groups.uuid;
    const nickname = matchNickname ? matchNickname[0] : "unknown_user";
    const emotions = {};

    let match;
    while ((match = emotionRegex.exec(fileName)) !== null) {
        const { emotion, value } = match.groups;
        emotions[emotion] = parseFloat(value);
    }

    return { uuid, nickname, emotions };
}

const defaultEmotions = {
    happy: 0,
    calm: 0,
    angry: 0,
    sad: 0
}

// Считать файлы из папок и сопоставить по UUID
function getEmotionMetrics(neuroFolder, humanFolder) {
    const files1 = fs.readdirSync(neuroFolder);
    const files2 = fs.readdirSync(humanFolder);

    const fileMap1 = new Map();
    const fileMap2 = new Map();
    const userStats = [];
    const emotionNames = ["happy", "calm", "angry", "sad"];

    // Функция обработки файлов
    function processFiles(files, map) {
        files.forEach((file) => {
            const data = parseFile(file);
            if (data && data.emotions) {
                const sumEmotions = Object.values(data.emotions).reduce((acc, item) => acc + item, 0);
                if (sumEmotions > 0) {
                    map.set(data.uuid, data);
                }
            }
        });
    }

    // Обрабатываем обе папки
    processFiles(files1, fileMap1);
    processFiles(files2, fileMap2);

    // Сравнить эмоции по UUID
    const commonUuids = Array.from(fileMap1.keys()).filter((uuid) => fileMap2.has(uuid));

    let TP = 0, TN = 0, FP = 0, FN = 0;
    let totalDifference = 0;
    let countEmotions = 0;
    let totalMaxEmotions = 0;

    commonUuids.forEach((uuid) => {
        const { nickname, emotions: neuroEmotions } = fileMap1.get(uuid);
        const { emotions: humanEmotions } = fileMap2.get(uuid);
        let userDifference = 0;
        let userCountEmotions = 0;
        let userMaxEmotions = 0;
        let TP = 0, TN = 0, FP = 0, FN = 0;

        // if (!userStats[nickname]) {
        //     userStats[nickname] = { TP: 0, TN: 0, FP: 0, FN: 0, userDifference: 0, userCountEmotions: 0, userMaxEmotions: 0 };
        // }
        let emotions = {};
        emotions.neuroEmotions = {...defaultEmotions};
        emotions.humanEmotions = {...defaultEmotions};

        emotionNames.forEach((emotion) => {

            emotions.neuroEmotions[emotion] = neuroEmotions[emotion];
            emotions.humanEmotions[emotion] = humanEmotions[emotion];


            const presence1 = neuroEmotions[emotion] > 0.5;
            const presence2 = humanEmotions[emotion] > 0.5;

            if (presence1 && presence2) {
                TP++;
            } else if (!presence1 && !presence2) {
                TN++;
            } else if (!presence1 && presence2) {
                FP++;
            } else if (presence1 && !presence2) {
                FN++;
            }

            if(neuroEmotions[emotion] !== undefined && humanEmotions[emotion] !== undefined) {
                const diff = Math.abs(neuroEmotions[emotion] - humanEmotions[emotion]);
                userDifference += diff;
                userCountEmotions++;
                userMaxEmotions = userMaxEmotions + Math.max(neuroEmotions[emotion], humanEmotions[emotion]);
            }
        });

        const metrics = calculateMetrics(TP, TN, FP, FN, userDifference, userCountEmotions, userMaxEmotions);
        metrics.uuid = uuid;
        metrics.emotions = emotions;
        metrics.username = mappingNicknames[nickname];

        userStats.push(metrics);
    });

    return userStats;
}
// Вычислить точность
const userStats = getEmotionMetrics(
    sourceFolder,evaluatedFolder
);


module.exports = getEmotionMetrics;

