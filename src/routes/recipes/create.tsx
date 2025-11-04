import { db } from '@/db'
import { recipe, RecipeInsert } from '@/db/schema'
import { useForm } from '@tanstack/react-form'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

export const Route = createFileRoute('/recipes/create')({
  component: RouteComponent,
})

const createRecipe = createServerFn({ method: 'POST' })
  .inputValidator((data: RecipeInsert) => {
    if (
      typeof data.preptime !== 'number' ||
      typeof data.cooktime !== 'number' ||
      typeof data.servings !== 'number' ||
      typeof data.title !== 'string'
    ) {
      throw new Error('Missing required fields')
    }

    return data
  })
  .handler(async ({ data }) => {
    try {
      const [inserted] = await db.insert(recipe).values(data).returning()
      return {
        success: true,
        data: inserted,
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to create recipe',
      }
    }
  })

function RouteComponent() {
  const defaultValues: RecipeInsert = {
    title: '',
    description: '',
    servings: 4,
    preptime: 30,
    cooktime: 30,
  }

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const r = await createRecipe({ data: value })
      console.log(r)
    },
  })

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        event.stopPropagation()

        form.handleSubmit()
      }}
    >
      <form.Field
        name="title"
        children={(field) => (
          <input
            id={field.name}
            name={field.name}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          ></input>
        )}
      ></form.Field>
      <form.Field
        name="description"
        children={(field) => (
          <input
            id={field.name}
            type={'text'}
            name={field.name}
            value={field.state.value ?? ''}
            onChange={(e) => field.handleChange(e.target.value)}
          ></input>
        )}
      ></form.Field>
      <form.Field
        name="servings"
        children={(field) => (
          <input
            id={field.name}
            type={'number'}
            name={field.name}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.valueAsNumber)}
          ></input>
        )}
      ></form.Field>
      <form.Field
        name="preptime"
        children={(field) => (
          <input
            id={field.name}
            type={'number'}
            name={field.name}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.valueAsNumber)}
          ></input>
        )}
      ></form.Field>
      <form.Field
        name="cooktime"
        children={(field) => (
          <input
            id={field.name}
            type={'number'}
            name={field.name}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.valueAsNumber)}
          ></input>
        )}
      ></form.Field>
      <form.Field
        name="notes"
        children={(field) => (
          <input
            id={field.name}
            type={'text'}
            name={field.name}
            value={field.state.value ?? ''}
            onChange={(e) => field.handleChange(e.target.value)}
          ></input>
        )}
      ></form.Field>
      <form.Subscribe children={() => <button>Do it</button>}></form.Subscribe>
    </form>
  )
}
