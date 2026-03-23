import { Router, Request, Response } from 'express'
import { prisma } from "../lib/prisma";
import { TaskStatus } from '../../generated/prisma/client'
import { broadcastTasksUpdated } from '../server'; // import broadcast helper

const taskRouter = Router({ mergeParams: true })

const parseId = (id: string | string[]): number | null => {
  if (Array.isArray(id)) return null
  const parsed = parseInt(id)
  return isNaN(parsed) ? null : parsed
}

// Create Task
taskRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      title,
      projectId,
      description,
      assigneeId: rawAssigneeId,
      status,
      dueDate
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ error: 'title and projectId are required' });
    }

    const assigneeId =
      rawAssigneeId !== undefined && rawAssigneeId !== null && rawAssigneeId !== ""
        ? Number(rawAssigneeId)
        : null;

    if (assigneeId !== null && Number.isNaN(assigneeId)) {
      return res.status(400).json({ error: 'Invalid assigneeId' });
    }

    if (assigneeId !== null) {
      const user = await prisma.user.findUnique({ where: { id: assigneeId } });
      if (!user) return res.status(400).json({ error: 'Assignee not found' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId: Number(projectId),
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId,
        status: status?.replace('-', '_').toUpperCase() ?? 'TODO',
      },
    });

    // Broadcast update
    broadcastTasksUpdated(String(projectId));

    res.status(201).json(task);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update Task
taskRouter.patch('/:id/update-task', async (req: Request, res: Response) => {
  try {
    const taskId = parseId(req.params.id);
    if (!taskId) return res.status(400).json({ error: 'Invalid task id' });

    const { title, description, status, dueDate, assigneeId } = req.body;
    const mapStatusToEnum = (status: string) => {
      switch (status) {
        case "todo": return "TODO";
        case "in-progress": return "IN_PROGRESS";
        case "done": return "DONE";
        default: return "TODO";
      }
    };

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        status: status ? mapStatusToEnum(status) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assigneeId: assigneeId !== undefined ? assigneeId : undefined
      }
    });

    // Broadcast update to all clients of the project
    if (task.projectId) broadcastTasksUpdated(String(task.projectId));

    res.json(task);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Task not found' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'Duplicate task title in project' });
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete Task
taskRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseId(req.params.id);
    if (!taskId) return res.status(400).json({ error: 'Invalid task id' });

    const task = await prisma.task.delete({
      where: { id: taskId }
    });

    // Broadcast update to all clients of the project
    if (task.projectId) broadcastTasksUpdated(String(task.projectId));

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default taskRouter;