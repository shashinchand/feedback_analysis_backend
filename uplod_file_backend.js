// const { createClient } = require('@supabase/supabase-js');
// const XLSX = require('xlsx');
// const dotenv = require('dotenv');

// // Load environment variables
// dotenv.config();

// // Initialize Supabase client with fetch implementation
// const fetch = require('cross-fetch');
// const supabase = createClient(
//     process.env.SUPABASE_URL,
//     process.env.SUPABASE_ANON_KEY,
//     {
//         auth: {
//             persistSession: false
//         },
//         global: {
//             fetch: fetch
//         }
//     }
// );

// // Helper function to parse integer or return null
// const parseIntOrNull = (val) => {
//     if (val === null || val === undefined || val === "" || val === "NULL") return null;
//     const n = parseInt(val, 10);
//     return isNaN(n) ? null : n;
// };

// const handleFileUpload = async (file) => {
//     try {
//         // Add detailed file logging
//         console.log('File received:', {
//             name: file.name,
//             size: file.size,
//             mimetype: file.mimetype,
//             hasData: !!file.data
//         });

//         if (!file || !file.data) {
//             throw new Error('Invalid file or empty file received');
//         }

//         // Parse XLSX from buffer
//         console.log('Attempting to parse Excel file...');
//         const workbook = XLSX.read(file.data, { type: "buffer" });
//         console.log('Excel file parsed successfully');
//         console.log('Available sheets:', workbook.SheetNames);

//         const sheet = workbook.Sheets[workbook.SheetNames[0]];
//         const rows = XLSX.utils.sheet_to_json(sheet);
//         console.log('Number of rows found:', rows.length);
//         console.log('Sample row:', rows[0]);

//         if (!rows || rows.length === 0) {
//             throw new Error('No data found in file');
//         }

//         // Add batching for large datasets
//         const batchSize = 1000;
//         const normalizedData = [];

//         for (let i = 0; i < rows.length; i++) {
//             const r = rows[i];
//             const obj = {
//                 dept: r.dept || null,
//                 degree: r.degree || null,
//                 ug_or_pg: r.ug_or_pg || null,
//                 arts_or_engg: r.arts_or_engg || null,
//                 short_form: r.short_form || null,
//                 batch: r.batch || null,
//                 sec: r.sec || null,
//                 course_code: r.course_code || null,
//                 course_name: r.course_name || null,
//                 staff_id: r.staff_id || null,
//                 staffid: r.staffid || null,
//                 faculty_name: r.faculty_name || null,
//                 mobile_no: r.mobile_no || null,
//                 grp: r.grp === 'NULL' ? null : r.grp,
//                 comment: r.comment || null
//             };

//             // Handle qn1 to qn35
//             for (let j = 1; j <= 35; j++) {
//                 const val = r[`qn${j}`];
//                 obj[`qn${j}`] = val === 'NULL' ? null : parseIntOrNull(val);
//             }

//             normalizedData.push(obj);

//             // Insert in batches
//             if (normalizedData.length === batchSize || i === rows.length - 1) {
//                 console.log(`Inserting batch of ${normalizedData.length} records...`);
//                 const { data, error } = await supabase
//                     .from('course_feedback')
//                     .insert(normalizedData);

//                 if (error) {
//                     throw error;
//                 }

//                 normalizedData.length = 0; // Clear the batch
//             }
//         }

//         return {
//             success: true,
//             message: `Successfully uploaded ${rows.length} records`,
//             count: rows.length
//         };

//     } catch (error) {
//         console.error('Detailed error:', error);
//         return {
//             success: false,
//             message: error.message || 'Upload failed',
//             error: error
//         };
//     }
// };

// module.exports = { handleFileUpload };



const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const dotenv = require('dotenv');

dotenv.config();

const fetch = require('cross-fetch');
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false
        },
        global: {
            fetch: fetch
        }
    }
);

const parseIntOrNull = (val) => {
    if (val === null || val === undefined || val === "" || val === "NULL") return null;
    const n = parseInt(val, 10);
    return isNaN(n) ? null : n;
};

const handleFileUpload = async (file) => {
    let filePath = null;
    
    try {
        console.log('File received:', {
            name: file.name,
            size: file.size,
            mimetype: file.mimetype
        });

        if (!file || !file.data) {
            throw new Error('Invalid file or empty file received');
        }

        // Save file to temp location
        filePath = path.join('/tmp', `${Date.now()}_${file.name}`);
        await file.mv(filePath);
        console.log('File saved to:', filePath);

        let rowCount = 0;
        let insertedCount = 0;
        const batchSize = 500; // Smaller batch for safety
        let batch = [];

        return new Promise((resolve, reject) => {
            // Use streaming CSV parser
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', async (row) => {
                    try {
                        rowCount++;
                        
                        const obj = {
                            dept: row.dept || null,
                            degree: row.degree || null,
                            ug_or_pg: row.ug_or_pg || null,
                            arts_or_engg: row.arts_or_engg || null,
                            short_form: row.short_form || null,
                            batch: row.batch || null,
                            sec: row.sec || null,
                            course_code: row.course_code || null,
                            course_name: row.course_name || null,
                            staff_id: row.staff_id || null,
                            staffid: row.staffid || null,
                            faculty_name: row.faculty_name || null,
                            mobile_no: row.mobile_no || null,
                            grp: row.grp === 'NULL' ? null : row.grp,
                            comment: row.comment || null
                        };

                        // Handle qn1 to qn35
                        for (let j = 1; j <= 35; j++) {
                            const val = row[`qn${j}`];
                            obj[`qn${j}`] = val === 'NULL' ? null : parseIntOrNull(val);
                        }

                        batch.push(obj);

                        // Insert batch when reached size or end of stream
                        if (batch.length >= batchSize) {
                            const currentBatch = batch;
                            batch = [];

                            console.log(`Inserting batch: rows ${rowCount - currentBatch.length + 1} to ${rowCount}`);
                            
                            const { error } = await supabase
                                .from('course_feedback')
                                .insert(currentBatch);

                            if (error) throw error;
                            insertedCount += currentBatch.length;
                        }
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('end', async () => {
                    try {
                        // Insert remaining records
                        if (batch.length > 0) {
                            console.log(`Inserting final batch of ${batch.length} records...`);
                            const { error } = await supabase
                                .from('course_feedback')
                                .insert(batch);

                            if (error) throw error;
                            insertedCount += batch.length;
                        }

                        // Clean up temp file
                        if (filePath && fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }

                        console.log(`Upload complete: ${insertedCount} records inserted out of ${rowCount} rows`);
                        resolve({
                            success: true,
                            message: `Successfully uploaded ${insertedCount} records`,
                            count: insertedCount,
                            totalRows: rowCount
                        });
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    reject(error);
                });
        });

    } catch (error) {
        console.error('Error:', error);
        
        // Clean up on error
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return {
            success: false,
            message: error.message || 'Upload failed',
            error: error.message
        };
    }
};

module.exports = { handleFileUpload };



