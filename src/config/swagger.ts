export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Kingabwa Awards REST API',
    version: '1.0.0',
    description: 'Official API documentation for Kingabwa Awards sociocultural platform.',
  },
  paths: {
    '/api/auth/register': { post: { summary: 'Register a new voter account' } },
    '/api/auth/login': { post: { summary: 'Authenticate user' } },
    '/api/categories': { get: { summary: 'List award categories' } },
    '/api/nominees': { get: { summary: 'List nominees' } },
    '/api/votes': { post: { summary: 'Cast vote for nominee' } },
    '/api/blog/posts': { get: { summary: 'Get blog posts' } },
    '/api/proposals': { post: { summary: 'Submit nominee proposal' } },
    '/api/hall-of-fame': { get: { summary: 'Get past winners' } },
    '/api/gallery': { get: { summary: 'Get gallery photos/videos' } },
    '/api/admin/dashboard': { get: { summary: 'Get admin statistics' } },
  },
};
