import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { TodoApp } from '../src/TodoApp'

const server = setupServer(
  http.post('/todos', async ({ request }) => {
    const body = await request.json() as { title: string }

    return HttpResponse.json(
      { id: 'todo-1', title: body.title, completed: false },
      { status: 201 },
    )
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

describe('TodoApp', () => {
  it('does not submit a blank or whitespace-only title', async () => {
    const createTodo = vi.fn()
    server.use(http.post('/todos', () => {
      createTodo()
      return HttpResponse.json({}, { status: 201 })
    }))
    const user = userEvent.setup()

    render(<TodoApp />)
    await user.type(screen.getByLabelText('TODO title'), '   ')
    await user.click(screen.getByRole('button', { name: 'Create TODO' }))

    expect(createTodo).not.toHaveBeenCalled()
    expect(screen.getByText('Enter a TODO title before creating it.')).toBeVisible()
  })

  it('submits with Enter and appends the created TODO to the browser-session list', async () => {
    const user = userEvent.setup()

    render(<TodoApp />)
    await user.type(screen.getByLabelText('TODO title'), 'Buy milk{Enter}')

    expect(await screen.findByRole('listitem', { name: 'Buy milk' })).toBeVisible()
    expect(screen.getByLabelText('TODO title')).toHaveValue('')
  })

  it('prevents a duplicate request while creation is pending', async () => {
    let resolveRequest: (() => void) | undefined
    const createTodo = vi.fn()
    server.use(http.post('/todos', () => new Promise<Response>((resolve) => {
      createTodo()
      resolveRequest = () => resolve(HttpResponse.json(
        { id: 'todo-2', title: 'Write tests', completed: false },
        { status: 201 },
      ))
    })))
    const user = userEvent.setup()

    render(<TodoApp />)
    await user.type(screen.getByLabelText('TODO title'), 'Write tests')
    await user.click(screen.getByRole('button', { name: 'Create TODO' }))
    await user.click(screen.getByRole('button', { name: 'Creating TODO…' }))

    expect(createTodo).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Creating TODO…' })).toBeDisabled()

    resolveRequest?.()
    expect(await screen.findByRole('listitem', { name: 'Write tests' })).toBeVisible()
  })

  it('shows an accessible error and lets the user retry after an API failure', async () => {
    let attempts = 0
    server.use(http.post('/todos', () => {
      attempts += 1
      if (attempts === 1) {
        return HttpResponse.json(
          { code: 'INVALID_TITLE', message: 'title must contain 1 to 100 characters after trimming' },
          { status: 400 },
        )
      }

      return HttpResponse.json(
        { id: 'todo-3', title: 'Retry me', completed: false },
        { status: 201 },
      )
    }))
    const user = userEvent.setup()

    render(<TodoApp />)
    await user.type(screen.getByLabelText('TODO title'), 'Retry me')
    await user.click(screen.getByRole('button', { name: 'Create TODO' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'title must contain 1 to 100 characters after trimming',
    )
    expect(screen.getByRole('button', { name: 'Create TODO' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Create TODO' }))
    expect(await screen.findByRole('listitem', { name: 'Retry me' })).toBeVisible()
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })
})
