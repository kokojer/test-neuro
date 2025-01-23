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
function getEmotionDifferences(folder1, folder2) {
    const files1 = fs.readdirSync(folder1);
    const files2 = fs.readdirSync(folder2);

    const fileMap1 = new Map();
    const fileMap2 = new Map();
    const userStats = {};

    // Обработка файлов из папки 1
    files1.forEach((file) => {
        const data = parseFile(file);
        if (data) {
            fileMap1.set(data.uuid, data);
        }
    });

    // Обработка файлов из папки 2
    files2.forEach((file) => {
        const data = parseFile(file);
        if (data) {
            fileMap2.set(data.uuid, data);
        }
    });

    // Сравнить эмоции по UUID
    const commonUuids = Array.from(fileMap1.keys()).filter((uuid) =>
        fileMap2.has(uuid)
    );

    let totalDifference = 0;
    let totalEmotions = 0;

    commonUuids.forEach((uuid) => {
        const { nickname: nickname1, emotions: emotions1 } = fileMap1.get(uuid);
        const { emotions: emotions2 } = fileMap2.get(uuid);
        let userDifference = 0;
        let userEmotions = 0;

        Object.keys(emotions1).forEach((emotion) => {
            if (emotions2[emotion] !== undefined) {
                const diff = Math.abs(emotions1[emotion] - emotions2[emotion]);
                userDifference += diff;
                userEmotions++;
            }
        });

        totalDifference += userDifference;
        totalEmotions += userEmotions;

        if (!userStats[nickname1]) {
            userStats[nickname1] = { totalDifference: 0, totalEmotions: 0 };
        }

        userStats[nickname1].totalDifference += userDifference;
        userStats[nickname1].totalEmotions += userEmotions;
    });
    const accuracy = totalEmotions > 0 ? 1 - totalDifference / totalEmotions : 1;

    return { accuracy, totalDifference, commonUuids, userStats };
}

// Вычислить точность
const { accuracy, totalDifference, commonUuids, userStats } = getEmotionDifferences(
    evaluatedFolder,
    sourceFolder
);

// Вывести подробный лог по каждому пользователю
console.log("Детализированная информация по пользователям:");
Object.entries(userStats).forEach(([nickname, stats]) => {
    const userAccuracy =
        stats.totalEmotions > 0 ? 1 - stats.totalDifference / stats.totalEmotions : 1;

    console.log(`Пользователь: ${nickname}`);
    console.log(`  Файлов обработано: ${stats.totalEmotions / 4}`);
    console.log(`  Суммарная разница эмоций: ${stats.totalDifference.toFixed(2)}`);
    console.log(`  Точность: ${(userAccuracy * 100).toFixed(2)}%\n`);
});

// Итоговое значение
console.log("Итоговые результаты:");
console.log("  Общих файлов:", commonUuids.length);
console.log("  Общая разница эмоций:", totalDifference.toFixed(2));
console.log("  Итоговая точность:", (accuracy * 100).toFixed(2) + "%");
