// @flow
import Router from 'koa-router';
import auth from '../middlewares/authentication';
import { presentView } from '../presenters';
import { View, Document, Event, User } from '../models';
import policy from '../policies';

const { authorize } = policy;
const router = new Router();

router.post('views.list', auth(), async ctx => {
  const { documentId } = ctx.body;
  ctx.assertUuid(documentId, 'documentId is required');

  const user = ctx.state.user;
  const document = await Document.findByPk(documentId);
  authorize(user, 'read', document);

  const views = await View.findAll({
    where: { documentId },
    order: [['updatedAt', 'DESC']],
    include: [
      {
        model: User,
        paranoid: false,
      },
    ],
  });

  ctx.body = {
    data: views.map(presentView),
  };
});

router.post('views.create', auth(), async ctx => {
  const { documentId } = ctx.body;
  ctx.assertUuid(documentId, 'documentId is required');

  const user = ctx.state.user;
  const document = await Document.findByPk(documentId);
  authorize(user, 'read', document);

  await View.increment({ documentId, userId: user.id });

  await Event.create({
    name: 'views.create',
    actorId: user.id,
    documentId: document.id,
    collectionId: document.collectionId,
    teamId: user.teamId,
    data: { title: document.title },
    ip: ctx.request.ip,
  });

  ctx.body = {
    success: true,
  };
});

export default router;
