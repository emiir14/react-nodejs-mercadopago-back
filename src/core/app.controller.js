const { Router } = require('express');
const appService = require('./app.service');

const appRouter = Router();

appRouter.get('/', (_, res) => {
  res.status(200).json(appService.getAppInfo());
});

appRouter.get('/health', (_, res) => {
  res.status(200).json({ status: 'OK' });
});

module.exports = appRouter;
