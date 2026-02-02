
import type { TRPCRouterRecord } from '@trpc/server'

import { protectedProcedure, publicProcedure } from '~/server/trpc'
import {z} from 'zod'

export const listsRouter = {
  makeList: protectedProcedure
  .input(z.object({
    subject: z.string().length(2),
    listName: z.string().min(2).max(100),
    listData: z.array(z.object({word: z.string().max(70), answer: z.string().max(100) }))
  }))
  .mutation(({ input, ctx })=>{
    
  })
} satisfies TRPCRouterRecord
