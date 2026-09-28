export type TodoCreate = {
  title: string
}

export type Todo = {
  id: string
  title: string
  completed: false
}

type ErrorResponse = {
  code: 'INVALID_TITLE'
  message: string
}

export class TodoApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TodoApiError'
  }
}

function todosUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

  if (!baseUrl) {
    return '/todos'
  }

  return new URL('/todos', baseUrl).toString()
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return typeof value === 'object'
    && value !== null
    && 'code' in value
    && value.code === 'INVALID_TITLE'
    && 'message' in value
    && typeof value.message === 'string'
}

export async function createTodo(todo: TodoCreate): Promise<Todo> {
  let response: Response

  try {
    response = await fetch(todosUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    })
  } catch {
    throw new TodoApiError('Unable to create the TODO. Check your connection and try again.')
  }

  const body: unknown = await response.json().catch(() => undefined)

  if (!response.ok) {
    throw new TodoApiError(
      isErrorResponse(body) ? body.message : 'Unable to create the TODO. Please try again.',
    )
  }

  return body as Todo
}
