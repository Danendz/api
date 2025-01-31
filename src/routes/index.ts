/*
 * Copyright (c) 2020 genshin.dev
 * Licensed under the Open Software License version 3.0
 */
import Router from 'koa-router';
import {
  getAvailableEntities,
  getAvailableImages,
  getEntity,
  getImage,
  getTypes,
  /*  createEntity */
} from '../modules/filesystem';

const router = new Router();

router.get('/', async (ctx) => {
  const types = await getTypes();
  ctx.body = {
    types,
  };
});

router.get('/:type', async (ctx) => {
  const { type } = ctx.params;
  try {
    const entityNames = await getAvailableEntities(type);
    ctx.body = entityNames;
  } catch (e) {
    ctx.status = 404;
    const availableTypes = await getTypes();
    ctx.body = {
      error: e.message,
      availableTypes,
    };
  }
});

router.get('/:type/all', async (ctx) => {
  try {
    const { lang, fields, ...params } = ctx.query;
    const { type } = ctx.params;
    const entities = await getAvailableEntities(type);
    if (!entities) return;

    const entityObjects = await Promise.all(
      entities.map(async (id) => {
        try {
          return await getEntity(type, id, lang);
        } catch (e) {
          return null;
        }
      }),
    );



    if (fields) {
      ctx.body = entityObjects.map((entity) => {
        if (!entity) return;
        return Object.keys(entity)
          .filter(key => fields.includes(key))
          .reduce((obj: Record<string, any>, key) => {
            obj[key] = entity[key]
            return obj
          }, {})
      }).filter((entity) => entity !== undefined)
      return
    }

    ctx.body = entityObjects.filter((entity) => {
      if (!entity) return;

      for (const key of Object.keys(params)) {
        const value = entity[key];
        switch (typeof value) {
          case 'string':
            if (!params[key]) {
              return false
            }
            if (!value.includes(params[key]!.toString())) return false;
            else return true;
          default:
            if (value != params[key]) return false;
            break;
        }
      }

      return true;
    });
  } catch (e) {
    ctx.status = 404;
    ctx.body = { error: e.message };
  }
});

/* router.post('/:type/:id', async (ctx) => {
  try {
    const { lang } = ctx.query
    const { type, id } = ctx.params
    const newEntity = await createEntity(type, id, ctx.request.body, lang)
    ctx.body = newEntity
  } catch (e) {
    ctx.status = 418
    ctx.body = { error: e.message }
  }
}) */

router.get('/:type/:id', async (ctx) => {
  try {
    const { lang } = ctx.query;
    const { type, id } = ctx.params;
    const entitiy = await getEntity(type, id, lang);
    ctx.body = entitiy
  } catch (e) {
    ctx.status = 404;
    ctx.body = { error: e.message };
  }
});

router.get('/:type/:id/list', async (ctx) => {
  const { type, id } = ctx.params;

  try {
    ctx.body = await getAvailableImages(type, id);
  } catch (e) {
    ctx.status = 404;
    ctx.body = { error: e.message };
  }
});

router.get('/:type/:id/:imageType', async (ctx) => {
  const { type, id, imageType } = ctx.params;

  try {
    const image = await getImage(type, id, imageType);

    ctx.body = image.image;
    ctx.type = image.type;
  } catch (e) {
    ctx.status = 404;
    try {
      const av = await getAvailableImages(type, id);
      ctx.body = { error: e.message, availableImages: av };
    } catch (e) {
      ctx.body = { error: e.message };
    }
  }
});

export default router;
