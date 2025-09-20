AI Chat Rate Limiter with Vercel AI SDK
Context
You are building a chatbot using Vercel AI SDK for a company website.
The company needs to control AI usage costs by limiting how many questions different users can ask per hour.

Task Description
Create a rate limiter that allows different request limits based on user type:

Guest users: 3 AI questions per hour
Free users: 10 AI questions per hour
Premium users: 50 AI questions per hour
Requirements
Use Fixed Window rate limiting (1-hour windows).
Track by user ID (logged in) or IP address (guests).
Integrate with Vercel AI SDK for actual AI responses.
Check rate limits before calling AI to save costs.
Return clear error messages when limits are exceeded.
API Endpoints
POST /api/chat – Send message to AI (rate limited)
POST /api/login – Get user token
GET /api/status – Check remaining requests
Example Responses
Success Response:

{
  "success": true,
  "message": "AI response here...",
  "remaining_requests": 7
}
Rate Limit Response:

{
  "success": false,
  "error": "Too many requests. Free users can make 10 requests per hour.",
  "remaining_requests": 0
}
Implementation Notes
Use Node.js/Express.
Store limits in memory.
Include test examples showing the rate limiting works for all user types.
Project Submission :
 Finish within timeframes
 Make proper project documentation
Submit Link : https://forms.gle/vZw8sDGF6Z7tuXnJ9