const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const dotenv = require('dotenv');
const { handleFileUpload } = require('./uplod_file_backend');
const { 
    getDistinctDegrees,
    getDistinctDepartments,
    getDistinctBatches,
    getDistinctCourses,
    getFacultyByFilters
} = require('./analysis_backend');
const { getFeedbackAnalysis, getFacultyComments } = require('./performance_analysis');
const fastapiService = require('./fastapi_service');
const {
    getAllQuestions,
    getQuestionsBySection,
    getDistinctSectionTypes,
    getAllOptions,
    getOptionsForQuestion,
    getQuestionsWithOptions,
    submitFeedback,
    addQuestion,
    addQuestionOptions,
    updateQuestion,
    updateQuestionOptions,
    deleteQuestion
} = require('./questions');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: 'https://feedback-analysis-frontend.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// Report routes
const reportRoutes = require('./report_routes');
const bulkReportRoutes = require('./bulk_report_routes');
app.use('/api/reports', reportRoutes);
app.use('/api/bulk-reports', bulkReportRoutes);

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Analysis routes
app.get('/api/analysis/degrees', async (req, res) => {
    try {
        console.log('Fetching degrees...');
        const degrees = await getDistinctDegrees();
        console.log('Degrees fetched:', degrees);
        res.json(degrees);
    } catch (error) {
        console.error('Error fetching degrees:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/analysis/departments', async (req, res) => {
    try {
        console.log('Fetching departments for degree:', req.query.degree);
        const departments = await getDistinctDepartments(req.query.degree);
        console.log('Departments fetched:', departments);
        res.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/analysis/batches', async (req, res) => {
    try {
        console.log('Fetching batches for:', req.query.degree, req.query.dept);
        const batches = await getDistinctBatches(req.query.degree, req.query.dept);
        console.log('Batches fetched:', batches);
        res.json(batches);
    } catch (error) {
        console.error('Error fetching batches:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/analysis/courses', async (req, res) => {
    try {
        console.log('Fetching courses for:', req.query);
        const courses = await getDistinctCourses(
            req.query.degree,
            req.query.dept,
            req.query.batch
        );
        console.log('Courses fetched:', courses);
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: error.message });
    }
});

// Faculty route
app.get('/api/analysis/faculty', async (req, res) => {
    try {
        const { degree, dept, batch, course, staffId } = req.query;
        if (!degree || !dept || !batch || !course) {
            return res.status(400).json({ error: 'Missing required query params' });
        }
        const faculty = await getFacultyByFilters(degree, dept, batch, course, staffId);
        res.json(faculty);
    } catch (error) {
        console.error('Error fetching faculty:', error);
        res.status(500).json({ error: error.message });
    }
});

// Feedback analysis route
app.get('/api/analysis/feedback', async (req, res) => {
    try {
        const { degree, dept, batch, course, staffId } = req.query;
        if (!degree || !dept || !batch || !course) {
            return res.status(400).json({ error: 'Missing required query params' });
        }
        const analysis = await getFeedbackAnalysis(degree, dept, batch, course, staffId);
        res.json(analysis);
    } catch (error) {
        console.error('Error fetching feedback analysis:', error);
        res.status(500).json({ error: error.message });
    }
});

// Comments analysis route
app.get('/api/analysis/comments', async (req, res) => {
    try {
        const { degree, dept, batch, course, staffId } = req.query;
        
        // Debug logging
        console.log('Comments analysis request received with params:', { degree, dept, batch, course, staffId });
        
        if (!degree || !dept || !batch || !course) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required query params',
                message: 'Missing required query params',
                received: { degree, dept, batch, course, staffId }
            });
        }
        
        // Get comments from database
        const commentsResult = await getFacultyComments(degree, dept, batch, course, staffId);
        
        if (!commentsResult.success) {
            return res.json(commentsResult);
        }
        
        // If no comments found, return early
        if (commentsResult.total_comments === 0) {
            return res.json({
                success: true,
                message: 'No comments found for analysis',
                faculty_info: {
                    faculty_name: commentsResult.faculty_name,
                    staff_id: commentsResult.staff_id,
                    course_code: commentsResult.course_code,
                    course_name: commentsResult.course_name
                },
                total_comments: 0,
                analysis: null
            });
        }
        
        // Send comments to FastAPI for analysis
        const analysisResult = await fastapiService.analyzeComments(
            commentsResult.comments,
            {
                faculty_name: commentsResult.faculty_name,
                staff_id: commentsResult.staff_id,
                course_code: commentsResult.course_code,
                course_name: commentsResult.course_name
            }
        );
        
        if (!analysisResult.success) {
            return res.json({
                success: false,
                message: analysisResult.message,
                error: analysisResult.error,
                faculty_info: {
                    faculty_name: commentsResult.faculty_name,
                    staff_id: commentsResult.staff_id,
                    course_code: commentsResult.course_code,
                    course_name: commentsResult.course_name
                },
                total_comments: commentsResult.total_comments,
                comments: commentsResult.comments
            });
        }
        
        // Return successful analysis
        res.json({
            success: true,
            faculty_info: {
                faculty_name: commentsResult.faculty_name,
                staff_id: commentsResult.staff_id,
                course_code: commentsResult.course_code,
                course_name: commentsResult.course_name
            },
            total_comments: commentsResult.total_comments,
            comments: commentsResult.comments,
            analysis: analysisResult.analysis
        });
        
    } catch (error) {
        console.error('Error fetching comments analysis:', error);
        res.status(500).json({ error: error.message });
    }
});

// FastAPI health check route
app.get('/api/fastapi/health', async (req, res) => {
    try {
        const healthResult = await fastapiService.healthCheck();
        res.json(healthResult);
    } catch (error) {
        console.error('Error checking FastAPI health:', error);
        res.status(500).json({ error: error.message });
    }
});

// Debug route to check what data exists in database
app.get('/api/debug/database', async (req, res) => {
    try {
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
        
        // Get sample data to see the structure
        const { data: sampleData, error } = await supabase
            .from('course_feedback')
            .select('degree, dept, batch, course_code, staff_id, staffid, comment, faculty_name')
            .not('comment', 'is', null)
            .not('comment', 'eq', '')
            .limit(10);
        
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        
        // Get unique values for each field
        const { data: uniqueDegrees } = await supabase
            .from('course_feedback')
            .select('degree')
            .not('degree', 'is', null);
        
        const { data: uniqueDepts } = await supabase
            .from('course_feedback')
            .select('dept')
            .not('dept', 'is', null);
        
        const { data: uniqueBatches } = await supabase
            .from('course_feedback')
            .select('batch')
            .not('batch', 'is', null);
        
        const { data: uniqueCourses } = await supabase
            .from('course_feedback')
            .select('course_code')
            .not('course_code', 'is', null);
        
        // Check for the specific course we're looking for
        const { data: specificCourse } = await supabase
            .from('course_feedback')
            .select('*')
            .eq('course_code', '212CSE3302')
            .limit(5);
        
        res.json({
            success: true,
            sampleData: sampleData,
            specificCourse: specificCourse,
            uniqueValues: {
                degrees: [...new Set(uniqueDegrees?.map(d => d.degree) || [])],
                depts: [...new Set(uniqueDepts?.map(d => d.dept).filter(Boolean) || [])],
                batches: [...new Set(uniqueBatches?.map(b => b.batch) || [])],
                courses: [...new Set(uniqueCourses?.map(c => c.course_code) || [])]
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Questions routes
app.get('/api/questions', async (req, res) => {
    try {
        const questions = await getAllQuestions();
        res.json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/questions/sections', async (req, res) => {
    try {
        const sectionTypes = await getDistinctSectionTypes();
        res.json(sectionTypes);
    } catch (error) {
        console.error('Error fetching section types:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/questions/section/:sectionType', async (req, res) => {
    try {
        const { sectionType } = req.params;
        const questions = await getQuestionsBySection(sectionType);
        res.json(questions);
    } catch (error) {
        console.error('Error fetching questions by section:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/questions/options', async (req, res) => {
    try {
        const options = await getAllOptions();
        res.json(options);
    } catch (error) {
        console.error('Error fetching options:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/questions/:questionId/options', async (req, res) => {
    try {
        const { questionId } = req.params;
        const options = await getOptionsForQuestion(parseInt(questionId));
        res.json(options);
    } catch (error) {
        console.error('Error fetching options for question:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/questions/with-options', async (req, res) => {
    try {
        const questionsWithOptions = await getQuestionsWithOptions();
        res.json(questionsWithOptions);
    } catch (error) {
        console.error('Error fetching questions with options:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update question route
app.put('/api/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const questionData = req.body;
        console.log('Updating question:', id, questionData);

        if (!questionData.section_type || !questionData.question || !questionData.column_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await updateQuestion(id, questionData);
        console.log('Update result:', result);
        res.json(result);
    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update question options route
app.put('/api/questions/:id/options', async (req, res) => {
    try {
        const { id } = req.params;
        const optionsData = req.body;
        console.log('Updating options for question:', id, optionsData);

        if (!Array.isArray(optionsData) || optionsData.length === 0) {
            return res.status(400).json({ error: 'Invalid options data' });
        }

        const result = await updateQuestionOptions(id, optionsData);
        console.log('Options update result:', result);
        res.json(result);
    } catch (error) {
        console.error('Error updating question options:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/questions', async (req, res) => {
    try {
        const questionData = req.body;
        if (!questionData.section_type || !questionData.question || !questionData.column_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const result = await addQuestion(questionData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding question:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/questions/options', async (req, res) => {
    try {
        const optionsData = req.body;
        console.log('Received options data:', optionsData);
        
        if (!Array.isArray(optionsData) || optionsData.length === 0) {
            return res.status(400).json({ error: 'Invalid options data' });
        }
        
        // Ensure all options have the required fields
        for (const option of optionsData) {
            if (!option.question_id || !option.option_label || !option.option_text) {
                return res.status(400).json({ 
                    error: 'Missing required fields in options data',
                    details: 'Each option must have question_id, option_label, and option_text'
                });
            }
        }
        
        const result = await addQuestionOptions(optionsData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding question options:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete question route
app.delete('/api/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Deleting question via API:', id);
        const result = await deleteQuestion(id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: error.message });
    }
});

// File upload route
app.post('/api/upload', async (req, res) => {
    try {
        console.log('Received upload request');
        
        if (!req.files || !req.files.file) {
            console.log('No file in request');
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        console.log('File received:', req.files.file);
        const result = await handleFileUpload(req.files.file);
        
        console.log('Upload result:', result);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error processing file',
            error: error.message 
        });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


