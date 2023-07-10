import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import {z} from "zod"

export async function memoriesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request)=>{
    await request.jwtVerify()
  })

  app.get('/memories',async (request) => {
    const memories = await prisma.memory.findMany({
      where:{
        userId: request.user.sub,
      },
      orderBy:{
        createdAt:'asc',
      }
    })

    return memories.map(memory  =>{
      return {
        id: memory.id,
        convertUrl: memory.convertUrl,
        excerpt: memory.content.substring(0, 115).concat("..."),
        createdAt: memory.createdAt
      }
    })
  })

  app.get('/memories/:id',async (request, reply) => {
    const paramsSchema = z.object({
      id : z.string(),
    })

    const {id} = paramsSchema.parse(request.params)

    const memory = await prisma.memory.findUniqueOrThrow({
      where: {
        id,
      }
    })

    if(!memory.isPublic && memory.userId !== request.user.sub){
      return reply.status(401).send()
    }

    return memory
  })

  app.post('/memories', async (request) => {
    const bodySchema = z.object({
      content: z.string(),
      convertUrl: z.string(),
      isPublic: z.coerce.boolean().default(false)
    })

    const {content, isPublic, convertUrl} = bodySchema.parse(request.body)
  
    const memory = await prisma.memory.create({
      data:{
        convertUrl,
        content,
        isPublic,
        userId: request.user.sub,
      },
    })

    return memory
  })

  app.put('/memories/:id',async (request, reply) => {
    const paramsSchema = z.object({
      id : z.string(),
    })

    const {id} = paramsSchema.parse(request.params)

    const bodySchema = z.object({
      content: z.string(),
      convertUrl: z.string(),
      isPublic: z.coerce.boolean().default(false)
    })

    const {content, isPublic, convertUrl} = bodySchema.parse(request.body)
    
    let memory = await prisma.memory.findUniqueOrThrow({
      where:{
        id,
      }
    })

    if(memory.userId !== request.user.sub){
      return reply.status(401).send()
    }

    await prisma.memory.update({
      where:{
        id,
      },
      data:{
        content,
        convertUrl,
        isPublic,
      }
    })
  })

  app.delete('/memories/:id',async (request, reply) => {
    const paramsSchema = z.object({
      id : z.string(),
    })

    const {id} = paramsSchema.parse(request.params)

    const memory = await prisma.memory.findUniqueOrThrow({
      where:{
        id,
      }
    })

    if(memory.userId !== request.user.sub){
      return reply.status(401).send()
    }

    await prisma.memory.delete({
      where: {
        id,
      }
    })
  })
}