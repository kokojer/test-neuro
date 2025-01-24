const fs = require('fs');
const path = require('path');

// Имя папки для сохранения отфильтрованных файлов
const outputDir = path.join(__dirname, 'filtered_files');

// Создаем папку, если её нет
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Функция для извлечения значений эмоций из имени файла
function extractEmotions(filename) {
    const emotionRegex = /\[(\w+)-([\d.]+)\]/g;
    const emotions = {};
    let match;
    while ((match = emotionRegex.exec(filename)) !== null) {
        const [, emotion, value] = match;
        emotions[emotion] = parseFloat(value);
    }
    return emotions;
}
const source = path.join(__dirname, 'source_files')
// Получаем список всех файлов в текущей директории
const files = fs.readdirSync(source);

// Проходим по файлам и фильтруем их
files.forEach((file) => {
    // Проверяем, что это .ogg файл
    if (path.extname(file) === '.ogg') {
        const emotions = extractEmotions(file);
        const { angry = 0, sad = 0 } = emotions;

        // Копируем файл, если angry или sad > 0.5
        if (angry > 0.5 || sad > 0.5) {
            const sourcePath = path.join(source, file);
            const destPath = path.join(outputDir, file);

            fs.copyFileSync(sourcePath, destPath);
            console.log(`Копируем файл: ${file}`);
        }
    }
});

console.log('Фильтрация завершена.');
