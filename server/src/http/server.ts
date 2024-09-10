import fastify from 'fastify'
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { createGoal } from '../functions/create-goal'
import z from 'zod'
import { getWeekPendingGoals } from '../functions/get-week-pending-goals';
import { createGoalCompletion } from '../functions/create-goal-completion';

const app = fastify().withTypeProvider<ZodTypeProvider>()

// Add schema validator and serializer
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.get('/pending-goals', async () => {
    const { pendingGoals } = await getWeekPendingGoals()
    return pendingGoals
})

// Cadastra uma Meta
app.post('/goals', {
    schema: {
        body: z.object({
            title: z.string(),
            desiredWeeklyFrequency: z.number().int().min(1).max(7)
        })
    }
}, async request => {
    const { title, desiredWeeklyFrequency } = request.body

    await createGoal({
        title: title,
        desiredWeeklyFrequency: desiredWeeklyFrequency
    })
})

// Completa uma Meta
app.post('/completions', {
    schema: {
        body: z.object({
            goalId: z.string()
        })
    }
}, async request => {
    const { goalId } = request.body

    await createGoalCompletion({
        goalId
    })
})

app.listen({
    port: 3333
}).then(() => console.log("Running..."))
