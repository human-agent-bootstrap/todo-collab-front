import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTodo, TodoApiError } from '../src/api/todos'

afterEach(() => vi.unstubAllGlobals())

describe('createTodo', () => {
  it.each([
    [{ id: '', title: 'Valid title', completed: false }],
    [{ id: 'todo-1', title: '', completed: false }],
    [{ id: 'todo-1', title: 'x'.repeat(101), completed: false }],
    [{ id: 'todo-1', title: 'Valid title', completed: true }],
    [{ id: 'todo-1', title: 'Valid title' }],
  ])('rejects a 201 response with an invalid TODO body: %j', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body, { status: 201 })))

    await expect(createTodo({ title: 'Valid title' })).rejects.toBeInstanceOf(TodoApiError)
  })

  it('rejects a valid TODO body unless the response status is exactly 201', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(
      { id: 'todo-1', title: 'Valid title', completed: false },
      { status: 200 },
    )))

    await expect(createTodo({ title: 'Valid title' })).rejects.toBeInstanceOf(TodoApiError)
  })
})
