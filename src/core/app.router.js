const { Router } = require('express');
const appController = require('./app.controller');
const authRouter = require('../auth/auth.router');
const categoriesRouter = require('../categories/categories.router');
const productsRouter = require('../products/products.router');

const appRouter = Router();

appRouter.use('/', appController);
appRouter.use('/auth', authRouter);
appRouter.use('/categories', categoriesRouter);
appRouter.use('/products', productsRouter);

module.exports = appRouter;
