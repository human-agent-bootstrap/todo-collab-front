import { useState } from 'react'
import type { FormEvent } from 'react'
import { createTodo, TodoApiError, type Todo } from './api/todos'

type TodoAppProps = {
  create?: typeof createTodo
}

export function TodoApp({ create = createTodo }: TodoAppProps) {
  const [title, setTitle] = useState('')
  const [todos, setTodos] = useState<Todo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setError('Enter a TODO title before creating it.')
      return
    }

    if (isCreating) {
      return
    }

    setError(null)
    setSuccess(null)
    setIsCreating(true)

    try {
      const todo = await create({ title: trimmedTitle })
      setTodos((currentTodos) => [...currentTodos, todo])
      setSuccess(`Created TODO: ${todo.title}`)
      setTitle('')
    } catch (caughtError) {
      setError(
        caughtError instanceof TodoApiError
          ? caughtError.message
          : 'Unable to create the TODO. Please try again.',
      )
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className="todo-app">
      <h1>Create a TODO</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="todo-title">TODO title</label>
        <input
          id="todo-title"
          name="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-describedby={error ? 'todo-error' : undefined}
          disabled={isCreating}
        />
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating TODO…' : 'Create TODO'}
        </button>
        {error && (
          <p id="todo-error" role="alert">
            {error}
          </p>
        )}
        {success && <p role="status" aria-live="polite">{success}</p>}
      </form>

      <section aria-labelledby="created-todos-heading">
        <h2 id="created-todos-heading">Created this session</h2>
        {todos.length === 0 ? (
          <p>No TODOs created in this browser session.</p>
        ) : (
          <ul>
            {todos.map((todo) => (
              <li key={todo.id} aria-label={todo.title}>{todo.title}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
