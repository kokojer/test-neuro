const fs = require('fs');
const path = require('path');

// Папка с исходными файлами (вы можете настроить её под ваши нужды)
const sourceDir = './source_files'; // Путь к директории с файлами
const targetDir = './organized3_files'; // Папка для организованных файлов

// Функция для создания папки, если она не существует
function createFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
}

// Функция для обработки и копирования файлов
function organizeFiles() {
    // Получаем все файлы из исходной папки
    fs.readdir(sourceDir, (err, files) => {
        if (err) {
            console.error('Ошибка чтения директории', err);
            return;
        }

        // Проходим по каждому файлу
        files.forEach((file) => {
            // Ищем никнейм (до первого нижнего подчеркивания)
            const match = file.match(/^.+(?=_\[happy)/);

            if (match) {
                // ЪУъ СУК точки в названии папок windows
                const username = match[0].replace(/\./g, ''); // Никнейм пользователя

                // Создаем папку для пользователя
                const userFolder = path.join(targetDir, username);
                createFolder(userFolder);

                // Убираем часть с эмоциями из имени файла (между квадратными скобками)
                const cleanedFileName = file.replace(/\[happy-.*?\]\[calm-.*?\]\[angry-.*?\]\[sad-.*?\]/, '[happy-0.00][calm-0.00][angry-0.00][sad-0.00]');

                // Путь для копирования файла
                const oldPath = path.join(sourceDir, file);
                const newPath = path.join(userFolder, cleanedFileName);

                // Копируем файл
                fs.copyFile(oldPath, newPath, (err) => {
                    if (err) {
                        console.error('Ошибка копирования файла', err);
                    } else {
                        console.log(`Файл ${file} скопирован в ${newPath}`);
                    }
                });
            }
        });
    });
}

// Запуск функции
organizeFiles();