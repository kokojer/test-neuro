const fs = require('fs');
const XLSX = require('xlsx');
const getEmotionMetrics = require("./prepareFilesToExcel");

const evaluatedFolder = "./evaluated_files";
const sourceFolder = "./source_files";

// Функция для генерации Excel-отчёта
function generateExcelReport(userMetrics, filename = "emotion_report.xlsx") {
    const wsData = [
        ["ОБЩИЙ ОТЧЕТ"],
        ["ФИО сотрудника", "HAPPY","", "CALM","", "ANGRY","", "SAD","", "uuid записи", "ОЦЕНКА"],
        ["", "оценка модели", "оценка сотрудника", "оценка модели", "оценка сотрудника",
            "оценка модели", "оценка сотрудника", "оценка модели", "оценка сотрудника",
            "", "MAE", "MRE"]
    ];

    const startRow = wsData.length;

    // Заполняем данные из userMetrics
    for (const record of userMetrics) {

        wsData.push([record.username,
            record.emotions.neuroEmotions.happy, record.emotions.humanEmotions.happy,
            record.emotions.neuroEmotions.calm, record.emotions.humanEmotions.calm,
            record.emotions.neuroEmotions.angry, record.emotions.humanEmotions.angry,
            record.emotions.neuroEmotions.sad, record.emotions.humanEmotions.sad,
            record.uuid, record.MAE, record.MRE ]);
    }

    // Создаём лист и книгу
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
        { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
        { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } },
        { s: { r: 1, c: 3 }, e: { r: 1, c: 4 } },
        { s: { r: 1, c: 5 }, e: { r: 1, c: 6 } },
        { s: { r: 1, c: 7 }, e: { r: 1, c: 8 } },
        { s: { r: 1, c: 9 }, e: { r: 2, c: 9 } },
        { s: { r: 1, c: 10 }, e: { r: 1, c: 11 } },
    ];

    const endRow = wsData.length;
    for (let i = startRow; i < endRow; i++) {
        ws[`K${i + 1}`] = { t: "n", v: wsData[i][10], z: "0.00%" }; // MRE в процентах
        ws[`L${i + 1}`] = { t: "n", v: wsData[i][11], z: "0.00%" }; // MRE в процентах
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Отчёт");

    // Сохраняем файл
    XLSX.writeFile(wb, filename);
}

// Пример userMetrics (замени на реальные данные)
const exampleUserMetrics = {
    "Иван Иванов": { MAE: 0.1234, MRE: 0.2345 },
    "Мария Петрова": { MAE: 0.0987, MRE: 0.1765 }
};

// Генерация отчёта
generateExcelReport(getEmotionMetrics(sourceFolder, evaluatedFolder));