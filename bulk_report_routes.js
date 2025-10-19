// const express = require("express");
// const router = express.Router();
// const ExcelJS = require('exceljs');

// async function generateBulkReport(facultyAnalyses, filters) {
//     const workbook = new ExcelJS.Workbook();
//     workbook.creator = 'IQAC Feedback System';
//     workbook.lastModifiedBy = 'IQAC Feedback System';
//     workbook.created = new Date();
//     workbook.modified = new Date();

//     // Add Report Info Sheet
//     const infoSheet = workbook.addWorksheet('Report Information');
//     infoSheet.addRow(['Faculty Feedback Analysis - Consolidated Report']);
//     infoSheet.addRow(['']);
//     infoSheet.addRow(['Degree', filters.degree]);
//     infoSheet.addRow(['Department', filters.department]);
//     infoSheet.addRow(['Batch', filters.batch]);
//     infoSheet.addRow(['Course Code', filters.course]);
//     infoSheet.addRow(['Total Faculty', facultyAnalyses.length]);
//     infoSheet.addRow(['Generated Date', new Date().toLocaleString()]);
    
//     // Format Info Sheet
//     infoSheet.getCell('A1').font = { size: 16, bold: true };
//     infoSheet.getColumn('A').width = 20;
//     infoSheet.getColumn('B').width = 40;

//     // Add Summary Sheet
//     const summarySheet = workbook.addWorksheet('Faculty Analysis Summary');
    
//     // Add headers
//     summarySheet.addRow([
//         'Faculty Name',
//         'Staff ID',
//         'Total Responses',
//         'Overall Score',
//         'Teaching Effectiveness Score',
//         'Classroom Dynamics Score',
//         'Course Content Score',
//         'Assessment Score'
//     ]);

//     // Format headers
//     const headerRow = summarySheet.getRow(1);
//     headerRow.font = { bold: true };
//     headerRow.alignment = { horizontal: 'center' };
//     headerRow.fill = {
//         type: 'pattern',
//         pattern: 'solid',
//         fgColor: { argb: 'FF4F81BD' }
//     };
//     headerRow.font.color = { argb: 'FFFFFFFF' };

//     // Add data for each faculty
//     facultyAnalyses.forEach(({ analysisData, facultyData }) => {
//         const sectionScores = {};
//         let totalScore = 0;
//         let sectionCount = 0;

//         // Calculate section scores
//         Object.entries(analysisData.analysis || {}).forEach(([key, section]) => {
//             let sectionScore = 0;
//             let questionCount = 0;

//             Object.values(section.questions || {}).forEach(question => {
//                 let weightedSum = 0;
//                 let totalResponses = 0;

//                 question.options.forEach(option => {
//                     // Map values to 5-point scale: 1 (bad) = 1, 2 (neutral) = 3, 3 (good) = 5
//                     let value;
//                     if (option.value) {
//                         // Map the values: 1 (bad) = 1, 2 (neutral) = 3, 3 (good) = 5
//                         value = option.value === 1 ? 1 : option.value === 2 ? 3 : option.value === 3 ? 5 : option.value;
//                     } else {
//                         switch (option.label) {
//                             case 'C': value = 5; break;  // Good
//                             case 'B': value = 3; break;  // Neutral
//                             case 'A': value = 1; break;  // Needs Improvement
//                             default: value = 0;
//                         }
//                     }
//                     weightedSum += option.count * value;
//                     totalResponses += option.count;
//                 });

//                 // Calculate percentage: (actual score / maximum possible score) * 100
//                 // Maximum possible score is when all responses are 'Good' (value 5)
//                 const maxPossibleScore = totalResponses * 5; // Maximum score is 5 (Good)
//                 const questionScore = maxPossibleScore > 0 ? (weightedSum / maxPossibleScore) * 100 : 0;
//                 sectionScore += questionScore;
//                 questionCount++;
//             });

//             const avgSectionScore = questionCount > 0 ? Math.round(sectionScore / questionCount) : 0;
//             sectionScores[section.section_name || key] = avgSectionScore;
//             totalScore += avgSectionScore;
//             sectionCount++;
//         });

//         const overallScore = sectionCount > 0 ? Math.round(totalScore / sectionCount) : 0;

//         // Add row for this faculty
//         summarySheet.addRow([
//             facultyData.faculty_name || facultyData.name,
//             facultyData.staff_id || facultyData.staffid,
//             analysisData.total_responses,
//             overallScore,
//             sectionScores['TEACHING EFFECTIVENESS'] || 0,
//             sectionScores['CLASSROOM DYNAMICS AND ENGAGEMENT'] || 0,
//             sectionScores['COURSE CONTENT'] || 0,
//             sectionScores['ASSESSMENT'] || 0
//         ]);
//     });

//     // Format summary sheet
//     summarySheet.columns.forEach((column, i) => {
//         column.width = i === 0 ? 30 : 20;
//         column.alignment = { horizontal: 'center' };
//     });

//     // Add borders and colors to all cells
//     summarySheet.eachRow((row, rowNumber) => {
//         row.eachCell((cell) => {
//             cell.border = {
//                 top: { style: 'thin' },
//                 left: { style: 'thin' },
//                 bottom: { style: 'thin' },
//                 right: { style: 'thin' }
//             };

//             // Add color coding for scores (columns 4-8)
//             if (rowNumber > 1 && cell.col >= 4) {
//                 const score = parseInt(cell.value) || 0;
//                 cell.fill = {
//                     type: 'pattern',
//                     pattern: 'solid',
//                     fgColor: { 
//                         argb: score >= 75 ? 'FFE6FFE6' :  // Light green
//                               score >= 50 ? 'FFFFF2CC' :  // Light yellow
//                                           'FFFFE6E6'      // Light red
//                     }
//                 };
//             }
//         });
//     });

//     return workbook;
// }

// router.post("/generate-bulk-report", async (req, res) => {
//     try {
//         const { facultyAnalyses, filters } = req.body;

//         if (!facultyAnalyses || !filters) {
//             return res.status(400).json({ error: 'Missing required data' });
//         }

//         const workbook = await generateBulkReport(facultyAnalyses, filters);
//         const buffer = await workbook.xlsx.writeBuffer();

//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         res.setHeader('Content-Disposition', `attachment; filename=faculty_feedback_analysis_${filters.department}_${filters.course}.xlsx`);
//         res.send(buffer);

//     } catch (error) {
//         console.error('Error generating bulk report:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// module.exports = router;








// const express = require("express");
// const router = express.Router();
// const ExcelJS = require('exceljs');

// async function generateBulkReport(facultyAnalyses, filters) {
//     const workbook = new ExcelJS.Workbook();
//     workbook.creator = 'IQAC Feedback System';
//     workbook.lastModifiedBy = 'IQAC Feedback System';
//     workbook.created = new Date();
//     workbook.modified = new Date();

//     // Add Report Info Sheet
//     const infoSheet = workbook.addWorksheet('Report Information');
//     infoSheet.addRow(['Faculty Feedback Analysis - Consolidated Report']);
//     infoSheet.addRow(['']);
//     infoSheet.addRow(['Degree', filters.degree]);
//     infoSheet.addRow(['Department', filters.department]);
//     infoSheet.addRow(['Batch', filters.batch]);
//     infoSheet.addRow(['Course Code', filters.course]);
//     infoSheet.addRow(['Total Faculty', facultyAnalyses.length]);
//     infoSheet.addRow(['Generated Date', new Date().toLocaleString()]);
    
//     // Format Info Sheet
//     infoSheet.getCell('A1').font = { size: 16, bold: true };
//     infoSheet.getColumn('A').width = 20;
//     infoSheet.getColumn('B').width = 40;

//     // Get all unique section names from the first faculty's analysis
//     const allSections = [];
//     if (facultyAnalyses.length > 0 && facultyAnalyses[0].analysisData.analysis) {
//         Object.entries(facultyAnalyses[0].analysisData.analysis).forEach(([key, section]) => {
//             allSections.push({
//                 key: key,
//                 name: section.section_name || key
//             });
//         });
//     }

//     console.log('Found sections:', allSections.map(s => s.name));

//     // Add Summary Sheet
//     const summarySheet = workbook.addWorksheet('Faculty Analysis Summary');
    
//     // Build dynamic headers
//     const headers = [
//         'Faculty Name',
//         'Staff ID',
//         'Total Responses',
//         'Overall Score'
//     ];
    
//     // Add section score columns dynamically
//     allSections.forEach(section => {
//         headers.push(`${section.name} Score`);
//     });

//     // Add header row
//     summarySheet.addRow(headers);

//     // Format headers
//     const headerRow = summarySheet.getRow(1);
//     headerRow.font = { bold: true };
//     headerRow.alignment = { horizontal: 'center' };
//     headerRow.fill = {
//         type: 'pattern',
//         pattern: 'solid',
//         fgColor: { argb: 'FF4F81BD' }
//     };
//     headerRow.font.color = { argb: 'FFFFFFFF' };

//     // Add data for each faculty
//     facultyAnalyses.forEach(({ analysisData, facultyData }) => {
//         const sectionScores = {};
//         let totalScore = 0;
//         let sectionCount = 0;

//         // Calculate section scores for ALL sections
//         Object.entries(analysisData.analysis || {}).forEach(([key, section]) => {
//             let sectionScore = 0;
//             let questionCount = 0;

//             Object.values(section.questions || {}).forEach(question => {
//                 let weightedSum = 0;
//                 let totalResponses = 0;

//                 question.options.forEach(option => {
//                     // Map values to 5-point scale: 1 (bad) = 1, 2 (neutral) = 3, 3 (good) = 5
//                     let value;
//                     if (option.value) {
//                         value = option.value === 1 ? 1 : option.value === 2 ? 3 : option.value === 3 ? 5 : option.value;
//                     } else {
//                         switch (option.label) {
//                             case 'C': value = 5; break;  // Good
//                             case 'B': value = 3; break;  // Neutral
//                             case 'A': value = 1; break;  // Needs Improvement
//                             default: value = 0;
//                         }
//                     }
//                     weightedSum += option.count * value;
//                     totalResponses += option.count;
//                 });

//                 const maxPossibleScore = totalResponses * 5;
//                 const questionScore = maxPossibleScore > 0 ? (weightedSum / maxPossibleScore) * 100 : 0;
//                 sectionScore += questionScore;
//                 questionCount++;
//             });

//             const avgSectionScore = questionCount > 0 ? Math.round(sectionScore / questionCount) : 0;
//             sectionScores[section.section_name || key] = avgSectionScore;
//             totalScore += avgSectionScore;
//             sectionCount++;
//         });

//         const overallScore = sectionCount > 0 ? Math.round(totalScore / sectionCount) : 0;

//         // Build row data dynamically
//         const rowData = [
//             facultyData.faculty_name || facultyData.name,
//             facultyData.staff_id || facultyData.staffid,
//             analysisData.total_responses,
//             overallScore
//         ];

//         // Add section scores in the same order as headers
//         allSections.forEach(section => {
//             rowData.push(sectionScores[section.name] || 0);
//         });

//         summarySheet.addRow(rowData);
//     });

//     // Format summary sheet columns dynamically
//     summarySheet.getColumn(1).width = 30; // Faculty Name
//     summarySheet.getColumn(2).width = 20; // Staff ID
//     summarySheet.getColumn(3).width = 15; // Total Responses
//     summarySheet.getColumn(4).width = 15; // Overall Score
    
//     // Format section columns
//     for (let i = 5; i <= headers.length; i++) {
//         summarySheet.getColumn(i).width = 20;
//         summarySheet.getColumn(i).alignment = { horizontal: 'center' };
//     }

//     // Add borders and colors to all cells
//     summarySheet.eachRow((row, rowNumber) => {
//         row.eachCell((cell) => {
//             cell.border = {
//                 top: { style: 'thin' },
//                 left: { style: 'thin' },
//                 bottom: { style: 'thin' },
//                 right: { style: 'thin' }
//             };

//             // Add color coding for scores (column 4 onwards for scores)
//             if (rowNumber > 1 && cell.col >= 4) {
//                 const score = parseInt(cell.value) || 0;
//                 cell.fill = {
//                     type: 'pattern',
//                     pattern: 'solid',
//                     fgColor: { 
//                         argb: score >= 75 ? 'FFE6FFE6' :  // Light green
//                               score >= 50 ? 'FFFFF2CC' :  // Light yellow
//                                           'FFFFE6E6'      // Light red
//                     }
//                 };
//             }
//         });
//     });

//     // Add detailed analysis for each faculty
//     facultyAnalyses.forEach(({ analysisData, facultyData }, index) => {
//         const facultyName = (facultyData.faculty_name || facultyData.name || 'Unknown').substring(0, 25);
//         const sheetName = `${index + 1}. ${facultyName}`;
//         const facultySheet = workbook.addWorksheet(sheetName);

//         // Add faculty info
//         facultySheet.addRow(['Faculty Analysis Report']);
//         facultySheet.addRow(['']);
//         facultySheet.addRow(['Faculty Name', facultyData.faculty_name || facultyData.name]);
//         facultySheet.addRow(['Staff ID', facultyData.staff_id || facultyData.staffid]);
//         facultySheet.addRow(['Course', analysisData.course_code + ' - ' + analysisData.course_name]);
//         facultySheet.addRow(['Total Responses', analysisData.total_responses]);
//         facultySheet.addRow(['']);

//         // Format header
//         facultySheet.getCell('A1').font = { size: 14, bold: true };
//         facultySheet.getColumn('A').width = 25;
//         facultySheet.getColumn('B').width = 40;

//         // Add section-wise analysis
//         Object.entries(analysisData.analysis || {}).forEach(([sectionKey, section]) => {
//             facultySheet.addRow([section.section_name || sectionKey]);
//             facultySheet.getRow(facultySheet.rowCount).font = { bold: true, size: 12 };
//             facultySheet.addRow(['']);

//             // Add question headers
//             facultySheet.addRow(['Question', 'Option', 'Count', 'Percentage']);
//             const headerRow = facultySheet.getRow(facultySheet.rowCount);
//             headerRow.font = { bold: true };
//             headerRow.fill = {
//                 type: 'pattern',
//                 pattern: 'solid',
//                 fgColor: { argb: 'FFE6E6FA' }
//             };

//             // Add questions
//             Object.values(section.questions || {}).forEach(question => {
//                 let firstOption = true;
//                 question.options.sort((a, b) => b.count - a.count).forEach(option => {
//                     facultySheet.addRow([
//                         firstOption ? question.question : '',
//                         option.text,
//                         option.count,
//                         option.percentage + '%'
//                     ]);
//                     firstOption = false;
//                 });
//                 facultySheet.addRow(['']); // Empty row between questions
//             });

//             facultySheet.addRow(['']); // Empty row between sections
//         });
//     });

//     return workbook;
// }

// router.post("/generate-bulk-report", async (req, res) => {
//     try {
//         const { facultyAnalyses, filters } = req.body;

//         if (!facultyAnalyses || !filters) {
//             return res.status(400).json({ error: 'Missing required data' });
//         }

//         if (facultyAnalyses.length === 0) {
//             return res.status(400).json({ error: 'No faculty analyses provided' });
//         }

//         console.log(`Generating bulk report for ${facultyAnalyses.length} faculty members`);

//         const workbook = await generateBulkReport(facultyAnalyses, filters);
//         const buffer = await workbook.xlsx.writeBuffer();

//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         res.setHeader('Content-Disposition', `attachment; filename=faculty_feedback_analysis_${filters.department}_${filters.course}.xlsx`);
//         res.send(buffer);

//         console.log('✓ Bulk report generated successfully');

//     } catch (error) {
//         console.error('❌ Error generating bulk report:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// module.exports = router;





const express = require("express");
const router = express.Router();
const ExcelJS = require('exceljs');

async function generateBulkReport(facultyAnalyses, filters) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IQAC Feedback System';
    workbook.lastModifiedBy = 'IQAC Feedback System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add Report Info Sheet
    const infoSheet = workbook.addWorksheet('Report Information');
    infoSheet.addRow(['Faculty Feedback Analysis - Consolidated Report']);
    infoSheet.addRow(['']);
    infoSheet.addRow(['Degree', filters.degree]);
    infoSheet.addRow(['Department', filters.department]);
    infoSheet.addRow(['Batch', filters.batch]);
    infoSheet.addRow(['Course Code', filters.course]);
    infoSheet.addRow(['Total Faculty', facultyAnalyses.length]);
    infoSheet.addRow(['Generated Date', new Date().toLocaleString()]);
    
    // Format Info Sheet
    infoSheet.getCell('A1').font = { size: 16, bold: true };
    infoSheet.getColumn('A').width = 20;
    infoSheet.getColumn('B').width = 40;

    // Get all unique section names from the first faculty's analysis
    const allSections = [];
    if (facultyAnalyses.length > 0 && facultyAnalyses[0].analysisData.analysis) {
        Object.entries(facultyAnalyses[0].analysisData.analysis).forEach(([key, section]) => {
            allSections.push({
                key: key,
                name: section.section_name || key
            });
        });
    }

    console.log('Found sections:', allSections.map(s => s.name));

    // Add Summary Sheet
    const summarySheet = workbook.addWorksheet('Faculty Analysis Summary');
    
    // Build dynamic headers
    const headers = [
        'Faculty Name',
        'Staff ID',
        'Total Responses',
        'Overall Score'
    ];
    
    // Add section score columns dynamically
    allSections.forEach(section => {
        headers.push(`${section.name} Score`);
    });

    // Add header row
    summarySheet.addRow(headers);

    // Format headers
    const headerRow = summarySheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' }
    };
    headerRow.font.color = { argb: 'FFFFFFFF' };

    // Add data for each faculty
    facultyAnalyses.forEach(({ analysisData, facultyData }) => {
        const sectionScores = {};
        let totalScore = 0;
        let sectionCount = 0;

        // Calculate section scores for ALL sections
        Object.entries(analysisData.analysis || {}).forEach(([key, section]) => {
            let sectionScore = 0;
            let questionCount = 0;

            Object.values(section.questions || {}).forEach(question => {
                let weightedSum = 0;
                let totalResponses = 0;

                question.options.forEach(option => {
                    // Map values to 5-point scale: 1 (bad) = 1, 2 (neutral) = 3, 3 (good) = 5
                    let value;
                    if (option.value) {
                        value = option.value === 1 ? 1 : option.value === 2 ? 2 : option.value === 3 ? 3 : option.value;
                    } else {
                        switch (option.label) {
                            case 'C': value = 3; break;  // Good
                            case 'B': value = 2; break;  // Neutral
                            case 'A': value = 1; break;  // Needs Improvement
                            default: value = 0;
                        }
                    }
                    weightedSum += option.count * value;
                    totalResponses += option.count;
                });

                const maxPossibleScore = totalResponses * 3;
                const questionScore = maxPossibleScore > 0 ? (weightedSum / maxPossibleScore) * 100 : 0;
                sectionScore += questionScore;
                questionCount++;
            });

            const avgSectionScore = questionCount > 0 ? Math.round(sectionScore / questionCount) : 0;
            sectionScores[section.section_name || key] = avgSectionScore;
            totalScore += avgSectionScore;
            sectionCount++;
        });

        const overallScore = sectionCount > 0 ? Math.round(totalScore / sectionCount) : 0;

        // Build row data dynamically
        const rowData = [
            facultyData.faculty_name || facultyData.name,
            facultyData.staff_id || facultyData.staffid,
            analysisData.total_responses,
            overallScore
        ];

        // Add section scores in the same order as headers
        allSections.forEach(section => {
            rowData.push(sectionScores[section.name] || 0);
        });

        summarySheet.addRow(rowData);
    });

    // Format summary sheet columns dynamically
    summarySheet.getColumn(1).width = 30; // Faculty Name
    summarySheet.getColumn(2).width = 20; // Staff ID
    summarySheet.getColumn(3).width = 15; // Total Responses
    summarySheet.getColumn(4).width = 15; // Overall Score
    
    // Format section columns
    for (let i = 5; i <= headers.length; i++) {
        summarySheet.getColumn(i).width = 20;
        summarySheet.getColumn(i).alignment = { horizontal: 'center' };
    }

    // Add borders and colors to all cells
    summarySheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // Add color coding for scores (column 4 onwards for scores)
            // Column 4 = Overall Score, Column 5+ = Section Scores
            if (rowNumber > 1 && colNumber >= 4) {
                const cellValue = cell.value;
                let score = 0;
                
                // Handle both numeric values and string values with %
                if (typeof cellValue === 'number') {
                    score = cellValue;
                } else if (typeof cellValue === 'string') {
                    score = parseInt(cellValue.replace('%', '')) || 0;
                } else {
                    score = parseInt(cellValue) || 0;
                }
                
                // Red for < 80%, Green for >= 80%
                if (score < 80) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFF0000' } // Red background
                    };
                    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }; // White text, bold
                } else {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF90EE90' } // Light green
                    };
                }
            } else if (rowNumber > 1) {
                // Center align non-score columns
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            }
        });
    });
    
    // Add legend at the bottom
    summarySheet.addRow(['']);
    summarySheet.addRow(['']);
    const legendRow1 = summarySheet.addRow(['Legend:']);
    legendRow1.font = { bold: true };
    
    const redLegend = summarySheet.addRow(['Score < 80%', 'Needs Improvement']);
    redLegend.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF0000' }
    };
    redLegend.getCell(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
    
    const greenLegend = summarySheet.addRow(['Score ≥ 80%', 'Good Performance']);
    greenLegend.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF90EE90' }
    };

    // Add detailed analysis for each faculty
    facultyAnalyses.forEach(({ analysisData, facultyData }, index) => {
        const facultyName = (facultyData.faculty_name || facultyData.name || 'Unknown').substring(0, 25);
        const sheetName = `${index + 1}. ${facultyName}`;
        const facultySheet = workbook.addWorksheet(sheetName);

        // Add faculty info
        facultySheet.addRow(['Faculty Analysis Report']);
        facultySheet.addRow(['']);
        facultySheet.addRow(['Faculty Name', facultyData.faculty_name || facultyData.name]);
        facultySheet.addRow(['Staff ID', facultyData.staff_id || facultyData.staffid]);
        facultySheet.addRow(['Course', analysisData.course_code + ' - ' + analysisData.course_name]);
        facultySheet.addRow(['Total Responses', analysisData.total_responses]);
        facultySheet.addRow(['']);

        // Format header
        facultySheet.getCell('A1').font = { size: 14, bold: true };
        facultySheet.getColumn('A').width = 25;
        facultySheet.getColumn('B').width = 40;

        // Add section-wise analysis
        Object.entries(analysisData.analysis || {}).forEach(([sectionKey, section]) => {
            facultySheet.addRow([section.section_name || sectionKey]);
            facultySheet.getRow(facultySheet.rowCount).font = { bold: true, size: 12 };
            facultySheet.addRow(['']);

            // Add question headers
            facultySheet.addRow(['Question', 'Option', 'Count', 'Percentage']);
            const headerRow = facultySheet.getRow(facultySheet.rowCount);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE6E6FA' }
            };

            // Add questions
            Object.values(section.questions || {}).forEach(question => {
                let firstOption = true;
                question.options.sort((a, b) => b.count - a.count).forEach(option => {
                    facultySheet.addRow([
                        firstOption ? question.question : '',
                        option.text,
                        option.count,
                        option.percentage + '%'
                    ]);
                    firstOption = false;
                });
                facultySheet.addRow(['']); // Empty row between questions
            });

            facultySheet.addRow(['']); // Empty row between sections
        });
    });

    return workbook;
}

router.post("/generate-bulk-report", async (req, res) => {
    try {
        const { facultyAnalyses, filters } = req.body;

        if (!facultyAnalyses || !filters) {
            return res.status(400).json({ error: 'Missing required data' });
        }

        if (facultyAnalyses.length === 0) {
            return res.status(400).json({ error: 'No faculty analyses provided' });
        }

        console.log(`Generating bulk report for ${facultyAnalyses.length} faculty members`);

        const workbook = await generateBulkReport(facultyAnalyses, filters);
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=faculty_feedback_analysis_${filters.department}_${filters.course}.xlsx`);
        res.send(buffer);

        console.log('✓ Bulk report generated successfully');

    } catch (error) {
        console.error('❌ Error generating bulk report:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;