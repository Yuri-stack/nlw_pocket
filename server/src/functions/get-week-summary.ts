import dayjs from "dayjs";

import { db } from "../db";
import { goalCompletions, goals } from "../db/schema";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";

export async function getWeekSummary() {
    const firstDayOfWeek = dayjs().startOf('week').toDate() // Retorna o primeiro dia da semana 
    const lastDayOfWeek = dayjs().endOf('week').toDate()    // Retorna o último dia da semana

    // // Common Table Expression
    // /*Queries que realizam determinadas consultas, que depois são chamadas em outra query, sendo uma forma
    // de deixar o SQL menor (Cuidado para não criar um problema de perfomance no banco)*/

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

    // Seleciona todos os registros de metas que foram cumpridas naquela semana - Trás informações diferentes da outra query
    const goalsCompletedInWeek = db.$with('goal_completed_in_week').as(
        db
            .select({
                id: goalCompletions.id,
                title: goals.title,
                completedAt: goalCompletions.createdAt,
                completedAtDate: sql`
                    DATE(${goalCompletions.createdAt})
                `.as('completedAtDate')
            })
            .from(goalCompletions)
            .innerJoin(goals, eq(goals.id, goalCompletions.goalId))
            .where(
                and(
                    gte(goalCompletions.createdAt, firstDayOfWeek),
                    lte(goalCompletions.createdAt, lastDayOfWeek)
                )
            ).orderBy(desc(goalCompletions.createdAt))
    )

    // Seleciona as metas que foram finalizadas e as agrupa por dia
    const goalsCompletedByWeekDay = db.$with('goals_completed_by_week_day').as(
        db
            .select({
                completedAtDate: goalsCompletedInWeek.completedAtDate,
                completions: sql`
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', ${goalsCompletedInWeek.id},
                            'title', ${goalsCompletedInWeek.title},
                            'completedAt', ${goalsCompletedInWeek.completedAt}
                        )
                    )
                `.as('completions')
            })
            .from(goalsCompletedInWeek)
            .groupBy(goalsCompletedInWeek.completedAtDate)
            .orderBy(desc(goalsCompletedInWeek.completedAtDate))
    )

    type GoalsPerDay = Record<string, {
        id: string
        title: string
        completedAt: string
    }[]>

    const result = await db
        .with(goalsCreatedUpToWeek, goalsCompletedInWeek, goalsCompletedByWeekDay)
        .select({
            completed: sql`(SELECT COUNT(*) FROM ${goalsCompletedInWeek})`.mapWith(Number),
            total: sql`(SELECT SUM(${goalsCreatedUpToWeek.desiredWeeklyFrequency}) FROM ${goalsCreatedUpToWeek})`.mapWith(Number),
            goalsPerDay: sql<GoalsPerDay>`JSON_OBJECT_AGG(
                ${goalsCompletedByWeekDay.completedAtDate}, 
                ${goalsCompletedByWeekDay.completions}
            )`
        })
        .from(goalsCompletedByWeekDay)

    return { summary: result[0] };

}