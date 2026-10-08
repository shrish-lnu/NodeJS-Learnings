const { z } = require('zod');

const STATUS = ['todo', 'in-progress', 'done'];
const PRIORITY = ['low', 'medium', 'high'];
const SORT_FIELDS = ['title', 'status', 'priority', 'createdAt', 'updatedAt'];

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional().default(''),
  status: z.enum(STATUS).optional().default('todo'),
  priority: z.enum(PRIORITY).optional().default('medium'),
});

const replaceTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional().default(''),
  status: z.enum(STATUS),
  priority: z.enum(PRIORITY),
});

const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string().max(500),
    status: z.enum(STATUS),
    priority: z.enum(PRIORITY),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

const listQuerySchema = z.object({
  status: z.enum(STATUS).optional(),
  priority: z.enum(PRIORITY).optional(),
  search: z.string().optional(),
  sort: z.enum(SORT_FIELDS).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

module.exports = { createTaskSchema, replaceTaskSchema, updateTaskSchema, listQuerySchema };
