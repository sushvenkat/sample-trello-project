import { Router, Request, Response } from 'express'
import { prisma } from "../lib/prisma";
import { TaskStatus } from '../../generated/prisma/client'

const taskRouter = Router()

const parseId = (id: string | string[]): number | null => {
  if (Array.isArray(id)) return null
  const parsed = parseInt(id)
  return isNaN(parsed) ? null : parsed
}

// Create Task
taskRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { title, projectId, description, dueDate, assigneeId, status } = req.body

    if (!title || !projectId) {
      return res.status(400).json({ error: 'title and projectId are required' })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId ?? null,
        status: status ?? TaskStatus.TODO
      }
    })

    res.status(201).json(task)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Duplicate task title in project' })
    }
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// Get Task by ID
taskRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseId(req.params.id)
    if (!taskId) return res.status(400).json({ error: 'Invalid task id' })

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        assignee: true
      }
    })

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json(task)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' })
  }
})

// Get Tasks with filters and pagination - taskId + projectId
taskRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      assigneeId,
      status,
      skip = '0',
      take = '20'
    } = req.query

    const where: any = {}

    if (projectId) {
      const id = parseId(projectId as string)
      if (!id) return res.status(400).json({ error: 'Invalid projectId' })
      where.projectId = id
    }

    if (assigneeId) {
      const id = parseId(assigneeId as string)
      if (!id) return res.status(400).json({ error: 'Invalid assigneeId' })
      where.assigneeId = id
    }

    if (status) {
      if (!Object.values(TaskStatus).includes(status as TaskStatus)) {
        return res.status(400).json({ error: 'Invalid status' })
      }
      where.status = status
    }

    const tasks = await prisma.task.findMany({
      where,
      skip: parseInt(skip as string) || 0,
      take: parseInt(take as string) || 20,
      orderBy: [
        { status: 'asc' },     // uses (projectId, status)
        { dueDate: 'asc' }
      ],
      include: {
        assignee: true
      }
    })

    res.json(tasks)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

// Update Task - Partial updates allowed
taskRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseId(req.params.id)
    if (!taskId) return res.status(400).json({ error: 'Invalid task id' })

    const { title, description, status, dueDate, assigneeId } = req.body

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assigneeId: assigneeId !== undefined ? assigneeId : undefined
      }
    })

    res.json(task)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Task not found' })
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Duplicate task title in project' })
    }
    res.status(500).json({ error: 'Failed to update task' })
  }
})

// Delete Task
taskRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseId(req.params.id)
    if (!taskId) return res.status(400).json({ error: 'Invalid task id' })

    await prisma.task.delete({
      where: { id: taskId }
    })

    res.json({ message: 'Task deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

// Overdue Tasks
taskRouter.get('/overdue/all', async (_req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { not: TaskStatus.DONE }
      },
      orderBy: { dueDate: 'asc' }
    })

    res.json(tasks)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overdue tasks' })
  }
})

export default taskRouter