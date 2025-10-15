// const { createClient } = require('@supabase/supabase-js');
// const dotenv = require('dotenv');

// dotenv.config();

// const supabase = createClient(
//     process.env.SUPABASE_URL,
//     process.env.SUPABASE_ANON_KEY,
//     {
//         auth: {
//             persistSession: false
//         }
//     }
// );

// // Get feedback data based on filters
// const getFeedbackAnalysis = async (degree, department, batch, courseCode, staffId) => {
//     try {
//         console.log(`Fetching feedback analysis for degree: ${degree}, department: ${department}, batch: ${batch}, course: ${courseCode}, staffId: ${staffId || 'N/A'}`);

//         // Get the feedback data
//         let query = supabase
//             .from('course_feedback')
//             .select('*')
//             .eq('degree', degree)
//             .eq('dept', department)
//             .eq('batch', batch)
//             .eq('course_code', courseCode);
            
//         // Add staff ID filter if provided
//         if (staffId && staffId.trim() !== '') {
//             const like = `%${staffId.trim()}%`;
//             query = query.or(`staff_id.ilike.${like},staffid.ilike.${like}`);
//         }

//         const { data: feedbackData, error: feedbackError } = await query;

//         if (feedbackError) throw feedbackError;
        
//         if (!feedbackData || feedbackData.length === 0) {
//             return { success: false, message: 'No feedback data found for the selected filters' };
//         }

//         // Get all questions with their column names
//         const { data: questions, error: questionsError } = await supabase
//             .from('questions')
//             .select('*');

//         if (questionsError) throw questionsError;

//         // Get all question options
//         const { data: options, error: optionsError } = await supabase
//             .from('question_options')
//             .select('*');

//         if (optionsError) throw optionsError;

//         // Group questions by section type
//         const questionsBySection = questions.reduce((acc, question) => {
//             if (!acc[question.section_type]) {
//                 acc[question.section_type] = [];
//             }
//             acc[question.section_type].push(question);
//             return acc;
//         }, {});

//         // Map options by question ID
//         const optionsByQuestionId = options.reduce((acc, option) => {
//             if (!acc[option.question_id]) {
//                 acc[option.question_id] = [];
//             }
//             acc[option.question_id].push(option);
//             return acc;
//         }, {});

//         // Create a mapping between option labels (A, B, C) and feedback values (1, 2, 3)
//         const optionValueMap = {};
//         options.forEach(option => {
//             const questionId = option.question_id;
//             const label = option.option_label;
            
//             if (!optionValueMap[questionId]) {
//                 optionValueMap[questionId] = {};
//             }
            
//             // Map A->1, B->2, etc. (assuming this is the mapping)
//             const value = label.charCodeAt(0) - 64; // A=1, B=2, etc.
//             optionValueMap[questionId][value] = {
//                 label: option.option_label,
//                 text: option.option_text
//             };
//         });

//         // Analyze the feedback data
//         const analysisResults = {};
        
//         // Process each section
//         Object.keys(questionsBySection).forEach(sectionType => {
//             const sectionQuestions = questionsBySection[sectionType];
//             const sectionResults = {};
            
//             // Process each question in the section
//             sectionQuestions.forEach(question => {
//                 const columnName = question.column_name;
//                 const questionId = question.id;
                
//                 // Skip if column doesn't exist in feedback data
//                 if (!feedbackData[0].hasOwnProperty(columnName)) {
//                     return;
//                 }
                
//                 // Count responses for each option
//                 const responses = {};
//                 let totalResponses = 0;
                
//                 feedbackData.forEach(feedback => {
//                     const value = feedback[columnName];
//                     if (value !== null && value !== undefined) {
//                         if (!responses[value]) {
//                             responses[value] = 0;
//                         }
//                         responses[value]++;
//                         totalResponses++;
//                     }
//                 });
                
//                 // Calculate percentages and prepare result
//                 const optionResults = [];
//                 Object.keys(responses).forEach(value => {
//                     const numValue = parseInt(value);
//                     const count = responses[value];
//                     const percentage = (count / totalResponses) * 100;
                    
//                     // Get option text if available
//                     let optionText = 'Unknown';
//                     let optionLabel = 'Unknown';
                    
//                     if (optionValueMap[questionId] && optionValueMap[questionId][numValue]) {
//                         optionLabel = optionValueMap[questionId][numValue].label;
//                         optionText = optionValueMap[questionId][numValue].text;
//                     }
                    
//                     optionResults.push({
//                         value: numValue,
//                         label: optionLabel,
//                         text: optionText,
//                         count,
//                         percentage: parseFloat(percentage.toFixed(2))
//                     });
//                 });
                
//                 // Sort by value
//                 optionResults.sort((a, b) => a.value - b.value);
                
//                 sectionResults[questionId] = {
//                     question: question.question,
//                     column_name: columnName,
//                     total_responses: totalResponses,
//                     options: optionResults
//                 };
//             });
            
//             analysisResults[sectionType] = {
//                 section_name: sectionType,
//                 questions: sectionResults
//             };
//         });
        
//         // Get comments for this faculty
//         console.log(`Fetching comments for: ${degree}, ${department}, ${batch}, ${courseCode}, ${staffId}`);
//         const commentsResult = await getFacultyComments(degree, department, batch, courseCode, staffId);
//         console.log('Comments result:', commentsResult);
        
//         return {
//             success: true,
//             course_code: courseCode,
//             course_name: feedbackData[0].course_name || '',
//             faculty_name: feedbackData[0].faculty_name || '',
//             staff_id: feedbackData[0].staff_id || feedbackData[0].staffid || '',
//             ug_or_pg: feedbackData[0].ug_or_pg || '',
//             arts_or_engg: feedbackData[0].arts_or_engg || '',
//             short_form: feedbackData[0].short_form || '',
//             sec: feedbackData[0].sec || '',
//             total_responses: feedbackData.length,
//             analysis: analysisResults,
//             comments: commentsResult.success ? {
//                 total_comments: commentsResult.total_comments,
//                 has_comments: commentsResult.total_comments > 0,
//                 comments_available: true
//             } : {
//                 total_comments: 0,
//                 has_comments: false,
//                 comments_available: false,
//                 error: commentsResult.message
//             }
//         };
//     } catch (error) {
//         console.error('Error in getFeedbackAnalysis:', error);
//         return { success: false, message: error.message };
//     }
// };

// const getFacultyComments = async (degree, department, batch, courseCode, staffId) => {
//     try {
//         console.log(`Fetching comments for degree: ${degree}, department: ${department}, batch: ${batch}, course: ${courseCode}, staffId: ${staffId || 'N/A'}`);
//         let query = supabase
//             .from('course_feedback')
//             .select('comment, faculty_name, staff_id, staffid, course_code, course_name')
//             .eq('degree', degree)
//             .eq('dept', department)
//             .eq('batch', batch)
//             .eq('course_code', courseCode)
//             .not('comment', 'is', null);
        
//         if (staffId && staffId.trim() !== '') {
//             const like = `%${staffId.trim()}%`;
//             query = query.or(`staff_id.ilike.${like},staffid.ilike.${like}`);
//         }
        
//         const { data: commentsData, error: commentsError } = await query;
        
//         if (commentsError) {
//             console.error('Database query error:', commentsError);
//             throw commentsError;
//         }
        
//         console.log(`Database query returned ${commentsData ? commentsData.length : 0} rows`);
//         console.log('Sample data from database:', commentsData ? commentsData.slice(0, 2) : 'No data');
        
//         if (!commentsData || commentsData.length === 0) {
//             console.log('No comments found - checking if data exists with different filters...');
            
//             // Try to find any data for this course to see what the actual values are
//             const { data: sampleData } = await supabase
//                 .from('course_feedback')
//                 .select('degree, dept, batch, course_code, staff_id, staffid, comment')
//                 .eq('course_code', courseCode)
//                 .not('comment', 'is', null)
//                 .not('comment', 'eq', '')
//                 .limit(5);
            
//             console.log('Sample data for course code:', sampleData);
            
//             // Try without comment filter to see if data exists
//             const { data: courseData } = await supabase
//                 .from('course_feedback')
//                 .select('degree, dept, batch, course_code, staff_id, staffid, comment')
//                 .eq('course_code', courseCode)
//                 .limit(5);
            
//             console.log('All data for course code (including empty comments):', courseData);
            
//             // Also try to find data with just the course code and staff ID
//             if (staffId && staffId.trim() !== '') {
//                 const { data: staffData } = await supabase
//                     .from('course_feedback')
//                     .select('degree, dept, batch, course_code, staff_id, staffid, comment')
//                     .eq('course_code', courseCode)
//                     .or(`staff_id.ilike.%${staffId}%,staffid.ilike.%${staffId}%`)
//                     .not('comment', 'is', null)
//                     .not('comment', 'eq', '')
//                     .limit(5);
                
//                 console.log('Sample data for course + staff ID:', staffData);
                
//                 // Try without comment filter
//                 const { data: staffDataAll } = await supabase
//                     .from('course_feedback')
//                     .select('degree, dept, batch, course_code, staff_id, staffid, comment')
//                     .eq('course_code', courseCode)
//                     .or(`staff_id.ilike.%${staffId}%,staffid.ilike.%${staffId}%`)
//                     .limit(5);
                
//                 console.log('All data for course + staff ID (including empty comments):', staffDataAll);
//             }
            
//             // Check if there are ANY comments in the database at all
//             const { data: anyComments } = await supabase
//                 .from('course_feedback')
//                 .select('course_code, staff_id, staffid, comment')
//                 .not('comment', 'is', null)
//                 .not('comment', 'eq', '')
//                 .limit(3);
            
//             console.log('Any comments in database:', anyComments);
            
//             // Try a broader search - just course code without other filters
//             const { data: broadSearch } = await supabase
//                 .from('course_feedback')
//                 .select('degree, dept, batch, course_code, staff_id, staffid, comment')
//                 .eq('course_code', courseCode)
//                 .limit(10);
            
//             console.log('Broad search for course code (all records):', broadSearch);
            
//             return { 
//                 success: false, 
//                 message: 'No comments found for the selected filters',
//                 debug: {
//                     searchedParams: { degree, department, batch, courseCode, staffId },
//                     courseData: courseData,
//                     broadSearch: broadSearch
//                 }
//             };
//         }
        
//         const validComments = commentsData
//             .map(item => item.comment?.trim())
//             .filter(comment => comment && comment.length > 0 && comment !== '' && comment.split(' ').length > 1);
        
//         return {
//             success: true,
//             faculty_name: commentsData[0].faculty_name || '',
//             staff_id: commentsData[0].staff_id || commentsData[0].staffid || '',
//             course_code: commentsData[0].course_code || '',
//             course_name: commentsData[0].course_name || '',
//             total_comments: validComments.length,
//             comments: validComments
//         };
//     } catch (error) {
//         console.error('Error in getFacultyComments:', error);
//         return { success: false, message: error.message };
//     }
// };

// module.exports = {
//     getFeedbackAnalysis,
//     getFacultyComments
// };


const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false
        }
    }
);

// Helper function to clean and validate string values
function cleanString(value) {
    if (!value) return null;
    const cleaned = value.toString().trim();
    if (cleaned === '' || cleaned.toUpperCase() === 'NULL') return null;
    return cleaned;
}

// Generic pagination fetcher
async function fetchAllRows(queryBuilder, chunkSize = 1000) {
    let from = 0;
    let allData = [];
    let moreData = true;

    while (moreData) {
        const { data, error } = await queryBuilder.range(from, from + chunkSize - 1);
        if (error) {
            console.error('Error fetching rows:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            moreData = false;
        } else {
            allData = allData.concat(data);
            from += chunkSize;
        }
    }
    return allData;
}

// Get feedback data based on filters
const getFeedbackAnalysis = async (degree, department, batch, courseCode, staffId) => {
    try {
        console.log(`\n=== Fetching Feedback Analysis ===`);
        console.log(`Degree: ${degree}`);
        console.log(`Department: ${department}`);
        console.log(`Batch: ${batch}`);
        console.log(`Course: ${courseCode}`);
        console.log(`Staff ID: ${staffId || 'N/A'}`);

        // Get the feedback data WITHOUT exact course_code match
        // We'll filter manually to handle trailing spaces
        let query = supabase
            .from('course_feedback')
            .select('*')
            .eq('degree', degree)
            .eq('dept', department)
            .eq('batch', batch)
            .not('course_code', 'is', null);

        const allData = await fetchAllRows(query);
        console.log(`Raw data fetched: ${allData.length} rows`);

        if (allData.length === 0) {
            return { success: false, message: 'No data found for the selected degree, department, and batch' };
        }

        // Filter by course_code manually (to handle trailing spaces)
        // Also apply staff ID filter if provided
        const cleanedCourseCode = courseCode.trim();
        const feedbackData = allData.filter(item => {
            const itemCourseCode = cleanString(item.course_code);
            
            // Check if course code matches (trimmed comparison)
            if (itemCourseCode !== cleanedCourseCode) {
                return false;
            }

            // If staff ID filter is provided, check it
            if (staffId && staffId.trim() !== '') {
                const trimmedIdFilter = staffId.trim();
                const itemStaffId = cleanString(item.staff_id);
                const itemStaffid = cleanString(item.staffid);
                
                // Return true if either staff_id or staffid matches
                return itemStaffId === trimmedIdFilter || itemStaffid === trimmedIdFilter;
            }

            return true;
        });

        console.log(`Filtered feedback data: ${feedbackData.length} rows`);
        
        if (!feedbackData || feedbackData.length === 0) {
            console.log('⚠️ No feedback data found after filtering');
            console.log('Debug - Sample course codes in database:');
            const sampleCodes = allData.slice(0, 5).map(item => ({
                course_code: item.course_code,
                trimmed: cleanString(item.course_code),
                length: item.course_code?.length,
                searching_for: cleanedCourseCode
            }));
            console.log(sampleCodes);
            return { success: false, message: 'No feedback data found for the selected filters' };
        }

        // Get all questions with their column names
        const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select('*');

        if (questionsError) throw questionsError;

        // Get all question options
        const { data: options, error: optionsError } = await supabase
            .from('question_options')
            .select('*');

        if (optionsError) throw optionsError;

        // Group questions by section type
        const questionsBySection = questions.reduce((acc, question) => {
            if (!acc[question.section_type]) {
                acc[question.section_type] = [];
            }
            acc[question.section_type].push(question);
            return acc;
        }, {});

        // Map options by question ID
        const optionsByQuestionId = options.reduce((acc, option) => {
            if (!acc[option.question_id]) {
                acc[option.question_id] = [];
            }
            acc[option.question_id].push(option);
            return acc;
        }, {});

        // Create a mapping between option labels (A, B, C) and feedback values (1, 2, 3)
        const optionValueMap = {};
        options.forEach(option => {
            const questionId = option.question_id;
            const label = option.option_label;
            
            if (!optionValueMap[questionId]) {
                optionValueMap[questionId] = {};
            }
            
            // Map A->1, B->2, etc. (assuming this is the mapping)
            const value = label.charCodeAt(0) - 64; // A=1, B=2, etc.
            optionValueMap[questionId][value] = {
                label: option.option_label,
                text: option.option_text
            };
        });

        // Analyze the feedback data
        const analysisResults = {};
        
        // Process each section
        Object.keys(questionsBySection).forEach(sectionType => {
            const sectionQuestions = questionsBySection[sectionType];
            const sectionResults = {};
            
            // Process each question in the section
            sectionQuestions.forEach(question => {
                const columnName = question.column_name;
                const questionId = question.id;
                
                // Skip if column doesn't exist in feedback data
                if (!feedbackData[0].hasOwnProperty(columnName)) {
                    return;
                }
                
                // Count responses for each option
                const responses = {};
                let totalResponses = 0;
                
                feedbackData.forEach(feedback => {
                    const value = feedback[columnName];
                    if (value !== null && value !== undefined) {
                        if (!responses[value]) {
                            responses[value] = 0;
                        }
                        responses[value]++;
                        totalResponses++;
                    }
                });
                
                // Calculate percentages and prepare result
                const optionResults = [];
                Object.keys(responses).forEach(value => {
                    const numValue = parseInt(value);
                    const count = responses[value];
                    const percentage = (count / totalResponses) * 100;
                    
                    // Get option text if available
                    let optionText = 'Unknown';
                    let optionLabel = 'Unknown';
                    
                    if (optionValueMap[questionId] && optionValueMap[questionId][numValue]) {
                        optionLabel = optionValueMap[questionId][numValue].label;
                        optionText = optionValueMap[questionId][numValue].text;
                    }
                    
                    optionResults.push({
                        value: numValue,
                        label: optionLabel,
                        text: optionText,
                        count,
                        percentage: parseFloat(percentage.toFixed(2))
                    });
                });
                
                // Sort by value
                optionResults.sort((a, b) => a.value - b.value);
                
                sectionResults[questionId] = {
                    question: question.question,
                    column_name: columnName,
                    total_responses: totalResponses,
                    options: optionResults
                };
            });
            
            analysisResults[sectionType] = {
                section_name: sectionType,
                questions: sectionResults
            };
        });
        
        // Get comments for this faculty
        console.log(`Fetching comments...`);
        const commentsResult = await getFacultyComments(degree, department, batch, courseCode, staffId);
        console.log(`✓ Comments fetched: ${commentsResult.success ? commentsResult.total_comments : 0}`);
        
        console.log(`✓ Analysis complete: ${feedbackData.length} responses analyzed`);
        
        return {
            success: true,
            course_code: courseCode,
            course_name: feedbackData[0].course_name || '',
            faculty_name: feedbackData[0].faculty_name || '',
            staff_id: feedbackData[0].staff_id || feedbackData[0].staffid || '',
            ug_or_pg: feedbackData[0].ug_or_pg || '',
            arts_or_engg: feedbackData[0].arts_or_engg || '',
            short_form: feedbackData[0].short_form || '',
            sec: feedbackData[0].sec || '',
            total_responses: feedbackData.length,
            analysis: analysisResults,
            comments: commentsResult.success ? {
                total_comments: commentsResult.total_comments,
                has_comments: commentsResult.total_comments > 0,
                comments_available: true
            } : {
                total_comments: 0,
                has_comments: false,
                comments_available: false,
                error: commentsResult.message
            }
        };
    } catch (error) {
        console.error('❌ Error in getFeedbackAnalysis:', error);
        return { success: false, message: error.message };
    }
};

const getFacultyComments = async (degree, department, batch, courseCode, staffId) => {
    try {
        console.log(`Fetching comments for: ${degree}, ${department}, ${batch}, ${courseCode}, ${staffId || 'N/A'}`);
        
        // Get comments WITHOUT exact course_code match
        // We'll filter manually to handle trailing spaces
        let query = supabase
            .from('course_feedback')
            .select('comment, faculty_name, staff_id, staffid, course_code, course_name')
            .eq('degree', degree)
            .eq('dept', department)
            .eq('batch', batch)
            .not('course_code', 'is', null)
            .not('comment', 'is', null);
        
        const allData = await fetchAllRows(query);
        
        if (allData.length === 0) {
            return { 
                success: false, 
                message: 'No data found for the selected filters'
            };
        }

        // Filter by course_code and staff_id manually
        const cleanedCourseCode = courseCode.trim();
        const commentsData = allData.filter(item => {
            const itemCourseCode = cleanString(item.course_code);
            
            // Check if course code matches
            if (itemCourseCode !== cleanedCourseCode) {
                return false;
            }

            // If staff ID filter is provided, check it
            if (staffId && staffId.trim() !== '') {
                const trimmedIdFilter = staffId.trim();
                const itemStaffId = cleanString(item.staff_id);
                const itemStaffid = cleanString(item.staffid);
                
                return itemStaffId === trimmedIdFilter || itemStaffid === trimmedIdFilter;
            }

            return true;
        });
        
        console.log(`Database query returned ${commentsData.length} rows with comments`);
        
        if (!commentsData || commentsData.length === 0) {
            console.log('No comments found after filtering');
            return { 
                success: false, 
                message: 'No comments found for the selected filters'
            };
        }
        
        const validComments = commentsData
            .map(item => item.comment?.trim())
            .filter(comment => comment && comment.length > 0 && comment !== '' && comment.split(' ').length > 1);
        
        return {
            success: true,
            faculty_name: commentsData[0].faculty_name || '',
            staff_id: commentsData[0].staff_id || commentsData[0].staffid || '',
            course_code: commentsData[0].course_code || '',
            course_name: commentsData[0].course_name || '',
            total_comments: validComments.length,
            comments: validComments
        };
    } catch (error) {
        console.error('Error in getFacultyComments:', error);
        return { success: false, message: error.message };
    }
};

module.exports = {
    getFeedbackAnalysis,
    getFacultyComments
};