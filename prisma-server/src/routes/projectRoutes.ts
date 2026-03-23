import { Router, Request, Response } from 'express'
import { prisma } from "../lib/prisma";

const projectRouter = Router()

// Create Project
projectRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' })
    }
    console.log("Creating Project*******");
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

// Get all users with their tasks for a project
projectRouter.get('/:id/users-with-tasks', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id as string);
    if (isNaN(projectId)) return res.status(400).json({ error: 'Invalid project ID' });

    // Fetch all tasks for this project including assignee info
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: { assignee: true },
      orderBy: [
        { assigneeId: 'asc' },
        { status: 'asc' }
      ]
    });

    // Group tasks by user (assigneeId or unassigned)
    const grouped: Record<string, { user: any; tasks: any[] }> = {};

    for (const task of tasks) {
      const key = task.assigneeId?.toString() ?? 'unassigned';

      // Create user object if it doesn’t exist yet
      if (!grouped[key]) {
        grouped[key] = {
          user: task.assignee
            ? { id: task.assignee.id, name: task.assignee.name, email: task.assignee.email }
            : { id: null, name: 'Unassigned', email: null },
          tasks: []
        };
      }

      // Add task to the grouped list, including assigneeName for convenience
      grouped[key].tasks.push({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate,
        assigneeName: task.assignee?.name || task.assignee?.email || 'Unassigned'
      });
    }

    // Convert grouped object to array for frontend consumption
    res.json(Object.values(grouped));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete Project (cascade deletes tasks)
projectRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    console.log("Deleting Project*******");
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