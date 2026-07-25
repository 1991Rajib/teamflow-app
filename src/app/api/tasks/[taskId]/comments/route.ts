import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/tenant-context';
import dbConnect from '@/lib/db/mongoose';
import Task from '@/models/Task';
import Comment from '@/models/Comment';
import Notification from '@/models/Notification';
import Membership from '@/models/Membership';
import User from '@/models/User';
import mongoose from 'mongoose';
import * as Yup from 'yup';

const createCommentSchema = Yup.object().shape({
  content: Yup.string()
    .transform((v: string) => (typeof v === 'string' ? v.trim() : v))
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be under 2000 characters')
    .required('Comment is required'),
  mentionedUserIds: Yup.array()
    .of(Yup.string().test('is-objectid', 'Invalid User ID', (val) => !val || mongoose.Types.ObjectId.isValid(val)))
    .optional(),
  isFeedback: Yup.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN', 'MEMBER']);
    const { taskId } = await params;

    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Invalid Task ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify task belongs to current tenant (IDOR prevention)
    const task = await Task.findOne({
      _id: taskId,
      tenantId: context.tenant.id,
    });

    if (!task) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Task not found' },
        { status: 404 }
      );
    }

    const comments = await Comment.find({
      taskId,
      tenantId: context.tenant.id,
    })
      .populate('authorId', 'name email avatarUrl')
      .sort({ createdAt: 1 }); // chronological order

    const serialized = comments.map((c) => {
      const author = c.authorId as unknown as { name: string; email: string; avatarUrl?: string };
      return {
        id: c._id.toString(),
        content: c.content,
        isFeedback: c.isFeedback,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: c.authorId._id.toString(),
          name: author?.name ?? 'Unknown',
          email: author?.email ?? '',
          avatarUrl: author?.avatarUrl ?? '',
        },
      };
    });

    return NextResponse.json({ comments: serialized });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
    }
    console.error('[GET /api/tasks/[taskId]/comments]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const context = await requireTenantAccess(['OWNER', 'ADMIN', 'MEMBER']);
    const { taskId } = await params;

    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Invalid Task ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    let validatedData;
    try {
      validatedData = await createCommentSchema.validate(body, { abortEarly: false, stripUnknown: true });
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: err.errors[0] },
          { status: 422 }
        );
      }
      throw err;
    }

    await dbConnect();

    // Verify task belongs to current tenant (IDOR prevention)
    const task = await Task.findOne({
      _id: taskId,
      tenantId: context.tenant.id,
    });

    if (!task) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Task not found' },
        { status: 404 }
      );
    }

    // Validate mentioned user IDs and filter to current tenant active members
    const incomingMentionIds = validatedData.mentionedUserIds || [];
    const validMentionedIds: mongoose.Types.ObjectId[] = [];

    if (incomingMentionIds.length > 0) {
      const objectIds = incomingMentionIds.map((id) => new mongoose.Types.ObjectId(id));
      const activeMembers = await Membership.find({
        userId: { $in: objectIds },
        tenantId: context.tenant.id,
        status: 'ACTIVE',
      });
      activeMembers.forEach((m) => {
        validMentionedIds.push(m.userId);
      });
    }

    // Remove duplicates and exclude the author themselves to prevent self-mention
    const uniqueMentionedIds = Array.from(
      new Set(validMentionedIds.map((id) => id.toString()))
    )
      .filter((id) => id !== context.user.id)
      .map((id) => new mongoose.Types.ObjectId(id));

    // Create the task comment
    const comment = new Comment({
      tenantId: context.tenant.id,
      taskId: task._id,
      projectId: task.projectId,
      authorId: context.user.id,
      content: validatedData.content,
      mentionedUserIds: uniqueMentionedIds,
      isFeedback: false,
    });

    await comment.save();

    // Trigger Notifications for mentions (excluding self)
    const notificationsToCreate = uniqueMentionedIds.filter(
      (id) => id.toString() !== context.user.id
    );

    if (notificationsToCreate.length > 0) {
      try {
        const notificationDocs = notificationsToCreate.map((recipientId) => ({
          tenantId: context.tenant.id,
          recipientId,
          actorId: context.user.id,
          type: 'TASK_MENTION',
          taskId: task._id,
          projectId: task.projectId,
          commentId: comment._id,
          message: `${context.user.name} mentioned you in "${task.title}"`,
          read: false,
        }));
        await Notification.insertMany(notificationDocs);
      } catch (err) {
        console.error('Failed to create notifications for comment mentions', err);
        // Do not crash, as the comment is saved successfully.
      }
    }

    const populatedComment = await Comment.findById(comment._id).populate('authorId', 'name email avatarUrl');
    const author = populatedComment?.authorId as unknown as { name: string; email: string; avatarUrl?: string };

    return NextResponse.json(
      {
        message: 'Comment added successfully',
        comment: {
          id: comment._id.toString(),
          content: comment.content,
          isFeedback: comment.isFeedback,
          createdAt: comment.createdAt.toISOString(),
          author: {
            id: context.user.id,
            name: author?.name ?? 'Unknown',
            email: author?.email ?? '',
            avatarUrl: author?.avatarUrl ?? '',
          },
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
    }
    console.error('[POST /api/tasks/[taskId]/comments]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Suppress unused imports
void User;
void Membership;
