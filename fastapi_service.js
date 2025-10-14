const axios = require('axios');

// FastAPI service configuration
const FASTAPI_BASE_URL = process.env.FASTAPI_URL || 'https://kushvanth-iqac-fast-api.hf.space';

class FastAPIService {
    constructor() {
        this.baseURL = FASTAPI_BASE_URL;
        this.timeout = 30000; // 30 seconds timeout
    }

    // Analyze comments using FastAPI
    async analyzeComments(comments, facultyInfo) {
        try {
            console.log(`Sending ${comments.length} comments to FastAPI for analysis...`);
            console.log('Comments being sent:', comments);
            console.log('Faculty info:', facultyInfo);
            
            const payload = {
                comments: comments,
                faculty_info: {
                    faculty_name: facultyInfo.faculty_name,
                    staff_id: facultyInfo.staff_id,
                    course_code: facultyInfo.course_code,
                    course_name: facultyInfo.course_name
                }
            };

            const response = await axios.post(
                `${this.baseURL}/analyze-comments`,
                payload,
                {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('FastAPI analysis completed successfully');
            console.log('FastAPI response:', JSON.stringify(response.data, null, 2));
            // Unwrap inner analysis so frontend can access fields directly
            const unwrapped = response.data && response.data.analysis ? response.data.analysis : response.data;
            return {
                success: true,
                analysis: unwrapped
            };
        } catch (error) {
            console.error('Error calling FastAPI:', error);
            
            if (error.code === 'ECONNREFUSED') {
                return {
                    success: false,
                    message: 'FastAPI service is not running. Please start the FastAPI server.',
                    error: 'CONNECTION_ERROR'
                };
            }
            
            if (error.response) {
                return {
                    success: false,
                    message: `FastAPI error: ${error.response.data?.detail || error.response.statusText}`,
                    error: 'FASTAPI_ERROR',
                    status: error.response.status
                };
            }
            
            return {
                success: false,
                message: `Analysis failed: ${error.message}`,
                error: 'UNKNOWN_ERROR'
            };
        }
    }

    // Health check for FastAPI service
    async healthCheck() {
        try {
            const response = await axios.get(`${this.baseURL}/health`, {
                timeout: 5000
            });
            return {
                success: true,
                status: response.data
            };
        } catch (error) {
            return {
                success: false,
                message: 'FastAPI service is not available',
                error: error.message
            };
        }
    }
}

module.exports = new FastAPIService();
