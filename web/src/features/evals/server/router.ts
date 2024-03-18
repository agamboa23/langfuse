import { z } from "zod";

import {
  createTRPCRouter,
  protectedProjectProcedure,
} from "@/src/server/api/trpc";
import { throwIfNoAccess } from "@/src/features/rbac/utils/checkAccess";
import { auditLog } from "@/src/features/audit-logs/auditLog";
import { evalModels } from "@/src/features/evals/constants";
import { jsonSchema } from "@/src/utils/zod";
import { singleFilter } from "shared/src/interfaces/filters";
import { JobTypes } from "shared/src/constants";

export const CreateEvalTemplate = z.object({
  name: z.string(),
  projectId: z.string(),
  prompt: z.string(),
  model: evalModels,
  modelParameters: jsonSchema,
  variables: z.array(z.string()),
  outputSchema: z.object({
    score: z.string(),
    name: z.string(),
    reasoning: z.string(),
  }),
});

export const evalRouter = createTRPCRouter({
  allTemplates: protectedProjectProcedure
    .input(
      z.object({
        projectId: z.string(),
        limit: z.number(),
        page: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      console.log("Hello");
      throwIfNoAccess({
        session: ctx.session,
        projectId: input.projectId,
        scope: "evalsTemplate:read",
      });

      const templates = await ctx.prisma.evalTemplate.findMany({
        where: {
          projectId: input.projectId,
        },
        take: input.limit,
        skip: input.page * input.limit,
      });

      const count = await ctx.prisma.evalTemplate.count({
        where: {
          projectId: input.projectId,
        },
      });
      return {
        templates: templates,
        totalCount: count,
      };
    }),
  createJob: protectedProjectProcedure
    .input(
      z.object({
        projectId: z.string(),
        evalTemplateId: z.string(),
        scoreName: z.string(),
        target: z.string(),
        filter: z.array(singleFilter).nullable(), // re-using the filter type from the tables
        mapping: z.array(z.object({ name: z.string(), value: z.string() })),
        sampling: z.number().gte(0).lte(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        throwIfNoAccess({
          session: ctx.session,
          projectId: input.projectId,
          scope: "job:create",
        });

        const evalTemplate = await ctx.prisma.evalTemplate.findUnique({
          where: {
            id: input.evalTemplateId,
          },
        });

        if (!evalTemplate || evalTemplate.projectId !== input.projectId) {
          console.log(
            `Template not found for project ${input.projectId} and id ${input.evalTemplateId}`,
          );
          throw new Error("Template not found");
        }

        const job = await ctx.prisma.jobConfiguration.create({
          data: {
            projectId: input.projectId,
            jobType: JobTypes.Evaluation,
            evalTemplateId: input.evalTemplateId,
            scoreName: input.scoreName,
            targetObject: "trace",
            filter: input.filter ?? [],
            variableMapping: input.mapping,
            sampling: input.sampling,
          },
        });
        await auditLog({
          session: ctx.session,
          resourceType: "job",
          resourceId: job.id,
          action: "create",
        });
      } catch (e) {
        console.log(e);
        throw e;
      }
    }),
  createTemplate: protectedProjectProcedure
    .input(CreateEvalTemplate)
    .mutation(async ({ input, ctx }) => {
      throwIfNoAccess({
        session: ctx.session,
        projectId: input.projectId,
        scope: "evalsTemplate:create",
      });

      const latestTemplate = await ctx.prisma.evalTemplate.findFirst({
        where: {
          projectId: input.projectId,
          name: input.name,
        },
        orderBy: [{ version: "desc" }],
      });

      const evalTemplate = await ctx.prisma.evalTemplate.create({
        data: {
          version: latestTemplate?.version ? latestTemplate.version + 1 : 1,
          name: input.name,
          projectId: input.projectId,
          prompt: input.prompt,
          model: input.model,
          modelParams: input.modelParameters,
          vars: input.variables,
          outputSchema: input.outputSchema,
        },
      });

      await auditLog({
        session: ctx.session,
        resourceType: "evalTemplate",
        resourceId: evalTemplate.id,
        action: "create",
      });
    }),
});
