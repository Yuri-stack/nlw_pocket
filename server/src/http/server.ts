import fastify from 'fastify'
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";

import { createGoalRoute } from './routes/create-goals';
import { createCompletionRoute } from './routes/create-completion';
import { getPendingGoalsRoute } from './routes/get-pending-goals';
import { getWeekSummaryRoute } from './routes/get-week-summary';
import { fastifyCors } from '@fastify/cors';

const app = fastify().withTypeProvider<ZodTypeProvider>()

// Habilitando o cors no Fastify
app.register(fastifyCors, {
    origin: '*'
})

// Add schema validator and serializer
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Add Middleware/Plugin | Add as rotas ao server
app.register(createGoalRoute)       // Cadastra uma Meta
app.register(createCompletionRoute) // Completa uma Meta
app.register(getPendingGoalsRoute)  // Lista as Metas Pendentes
app.register(getWeekSummaryRoute)   // Lista todas as Metas Completadas

app.listen({
    port: 3333
}).then(() => console.log("Running..."))
