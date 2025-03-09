import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { Env } from '../../types';
import { loginHandler } from './controllers/loginController';
import { registerHandler } from './controllers/registerController';
import { getCurrentUserHandler } from './controllers/userController';

// Create the auth module router
const authModule = new Hono<{ Bindings: Env }>();

// Public routes
authModule.post('/login', loginHandler);
authModule.post('/register', registerHandler);

// Protected routes
authModule.use('/me', jwt({ secret: (c) => c.env.JWT_SECRET }));
authModule.get('/me', getCurrentUserHandler);

export { authModule };