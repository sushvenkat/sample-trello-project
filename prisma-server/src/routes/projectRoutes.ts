import { Router, Request, Response } from 'express'
import { prisma } from "../lib/prisma";

const projectRouter = Router()

// Create Project
projectRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' })
    }

    const project = await prisma.project.create({
      data: { name, description }
    })

    res.status(201).json(project)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' })
  }
})


// Get All Projects with pagination
projectRouter.get('/', async (req: Request, res: Response) => {
  try {
    const skip = parseInt(req.query.skip as string) || 0
    const take = parseInt(req.query.take as string) || 20

    const projects = await prisma.project.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    })

    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})


// Get Single Project with tasks
projectRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id as string)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json(project)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' })
  }
})


// Get Tasks for Project (Kanban)
projectRouter.get('/:id/tasks', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id as string)

    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: [
        { status: 'asc' },      
        { createdAt: 'desc' }
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


// Users with Tasks in Project
projectRouter.get('/:id/users-with-tasks', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id as string)

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: { assignee: true },
      orderBy: [
        { assigneeId: 'asc' },
        { status: 'asc' }
      ]
    })

    // Group in memory
    const result: Record<string, any> = {}

    for (const task of tasks) {
      const key = task.assigneeId ?? 'unassigned'

      if (!result[key]) {
        result[key] = {
          user: task.assignee || null,
          tasks: []
        }
      }

      result[key].tasks.push(task)
    }

    res.json(Object.values(result))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users with tasks' })
  }
})


// Delete Project (cascade deletes tasks)
projectRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id as string)

    await prisma.project.delete({
      where: { id: projectId }
    })

    res.json({ message: 'Project deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

export default projectRouter