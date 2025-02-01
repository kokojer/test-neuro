const fs = require("fs");
const path = require("path");

// Путь к папкам
const evaluatedFolder = "./evaluated_files";
const sourceFolder = "./source_files";

// Регулярка для извлечения эмоций, UUID и никнейма
const emotionRegex = /\[(?<emotion>[a-z]+)-(?<value>[0-9.]+)\]/g;
const uuidRegex = /_(?<uuid>[a-f0-9\-]+)\.ogg$/;
const nicknameRegex = /^.+(?=_\[happy)/;

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

// Считать файлы из папок и сопоставить по UUID
function getEmotionMetrics(folder1, folder2) {
    const files1 = fs.readdirSync(folder1);
    const files2 = fs.readdirSync(folder2);

    const fileMap1 = new Map();
    const fileMap2 = new Map();
    const userStats = {};
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

    commonUuids.forEach((uuid) => {
        const { nickname, emotions: emotions1 } = fileMap1.get(uuid);
        const { emotions: emotions2 } = fileMap2.get(uuid);

        if (!userStats[nickname]) {
            userStats[nickname] = { TP: 0, TN: 0, FP: 0, FN: 0 };
        }

        emotionNames.forEach((emotion) => {
            const presence1 = emotions1[emotion] > 0.5;
            const presence2 = emotions2[emotion] > 0.5;

            if (presence1 && presence2) {
                TP++;
                userStats[nickname].TP++;
            } else if (!presence1 && !presence2) {
                TN++;
                userStats[nickname].TN++;
            } else if (!presence1 && presence2) {
                FP++;
                userStats[nickname].FP++;
            } else if (presence1 && !presence2) {
                FN++;
                userStats[nickname].FN++;
            }
        });
    });

    // Функция для вычисления метрик
    function calculateMetrics(TP, TN, FP, FN) {
        const accuracy = (TP + TN) / (TP + TN + FP + FN);
        const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
        const recall = TP + FN > 0 ? TP / (TP + FN) : 0;
        return { accuracy, precision, recall };
    }

    // Рассчитываем общие метрики
    const globalMetrics = calculateMetrics(TP, TN, FP, FN);

    // Рассчитываем метрики по каждому пользователю
    const userMetrics = {};
    for (const user in userStats) {
        const { TP, TN, FP, FN } = userStats[user];
        userMetrics[user] = calculateMetrics(TP, TN, FP, FN);
    }

    return { globalMetrics, userMetrics, commonUuids };
}
// Вычислить точность
const { globalMetrics, commonUuids , userMetrics} = getEmotionMetrics(
    sourceFolder,evaluatedFolder
);

// Вывести подробный лог по каждому пользователю
console.log("Детализированная информация по пользователям:");
Object.entries(userMetrics).forEach(([nickname, metrics]) => {
    // const userAccuracy =
    //     stats.totalEmotions > 0 ? 1 - stats.totalDifference / stats.totalEmotions : 1;

    console.log(`Пользователь: ${nickname}`);
    // console.log(`  Файлов обработано: ${stats.totalEmotions / 4}`);
    // console.log(`  Суммарная разница эмоций: ${stats.totalDifference.toFixed(2)}`);
    console.log(`  Точность: ${(metrics.accuracy * 100).toFixed(2)}%\n`);
    console.log(`  Precision: ${(metrics.precision * 100).toFixed(2)}%\n`);
    console.log(`  Recall: ${(metrics.recall * 100).toFixed(2)}%\n`);
});

// Итоговое значение
console.log("Итоговые результаты:");
console.log("  Общих файлов:", commonUuids.length);
console.log("  Итоговая точность:", (globalMetrics.accuracy * 100).toFixed(2) + "%");
console.log("  Precision:", (globalMetrics.precision * 100).toFixed(2) + "%");
console.log("  Recall:", (globalMetrics.recall * 100).toFixed(2) + "%");
