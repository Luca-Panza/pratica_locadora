import prisma from "../database"

async function getById(id: number) {
  return await prisma.user.findUnique({
    where: { id }
  })
}


export default {
  getById
}