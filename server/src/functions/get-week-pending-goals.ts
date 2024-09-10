import dayjs from "dayjs";

import { db } from "../db";
import { goalCompletions, goals } from "../db/schema";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";

export async function getWeekPendingGoals() {
    const firstDayOfWeek = dayjs().startOf('week').toDate() // Retorna o primeiro dia da semana 
    const lastDayOfWeek = dayjs().endOf('week').toDate()    // Retorna o último dia da semana

    // Common Table Expression
    /*Queries que realizam determinadas consultas, que depois são chamadas em outra query, sendo uma forma
    de deixar o SQL menor (Cuidado para não criar um problema de perfomance no banco)*/

    // Seleciona as metas que foram criadas até o úlitmo dia dessa semana
    const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
        db
            .select({
                id: goals.id,
                title: goals.title,
                desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
                createdAt: goals.createdAt,
            })
            .from(goals)
            .where(lte(goals.createdAt, lastDayOfWeek))
    )

    // Seleciona todos os registros de metas que foram cumpridas naquela semana
    const goalCompletionCounts = db.$with('goal_completion_counts').as(
        db
            .select({
                goalId: goalCompletions.goalId,
                completionCount: count(goalCompletions.id).as('completionCount'),
            })
            .from(goalCompletions)
            .where(
                and(
                    gte(goalCompletions.createdAt, firstDayOfWeek),
                    lte(goalCompletions.createdAt, lastDayOfWeek)
                )
            )
            .groupBy(goalCompletions.goalId)
    )

    // Seleciona as metas que estão pendentes
    const pendingGoals = await db
        .with(goalsCreatedUpToWeek, goalCompletionCounts)
        .select({
            id: goalsCreatedUpToWeek.id,
            title: goalsCreatedUpToWeek.title,
            desiredWeeklyFrequency: goalsCreatedUpToWeek.desiredWeeklyFrequency,
            completionCount: sql`
                COALESCE(${goalCompletionCounts.completionCount}, 0)    
            `.mapWith(Number)
            // COALESCE é igual a um IF, senão tiver numero, coloca o valor 0
        })
        .from(goalsCreatedUpToWeek)
        .leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goalsCreatedUpToWeek.id))

    return { pendingGoals }

}