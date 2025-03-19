import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { Env } from '../../types';

// Import handlers
import * as contentBlockHandlers from './controllers/contentBlockHandlers';
import * as pageSettingsHandlers from './controllers/pageSettingsHandlers';

// Create the builder module router
const builderModule = new Hono<{ Bindings: Env }>();

// Predefined Content Block Routes
builderModule.get('/content-blocks', contentBlockHandlers.getAllContentBlocks);
builderModule.get('/content-blocks/:type', contentBlockHandlers.getContentBlockByType);
builderModule.post('/content-blocks', contentBlockHandlers.createContentBlock);
builderModule.put('/content-blocks/:type', contentBlockHandlers.updateContentBlock);
builderModule.delete('/content-blocks/:type', contentBlockHandlers.deleteContentBlock);
builderModule.get(
  '/content-blocks/category/:category',
  contentBlockHandlers.getContentBlocksByCategory
);
builderModule.get('/content-blocks/public', contentBlockHandlers.getPublicContentBlocks);

// Page Settings Definition Routes
builderModule.get('/page-settings', pageSettingsHandlers.getAllPageSettings);
builderModule.get('/page-settings/:name', pageSettingsHandlers.getPageSettingByName);
builderModule.post('/page-settings', pageSettingsHandlers.createPageSetting);
builderModule.put('/page-settings/:name', pageSettingsHandlers.updatePageSetting);
builderModule.delete('/page-settings/:name', pageSettingsHandlers.deletePageSetting);
builderModule.get(
  '/page-settings/category/:category',
  pageSettingsHandlers.getPageSettingsByCategory
);
builderModule.get('/page-settings/group/:group', pageSettingsHandlers.getPageSettingsByGroup);

export { builderModule };
export default builderModule;
