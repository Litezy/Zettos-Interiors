import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { hash } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { AdminUserCreateSchema } from '../src/schemas.js'

const prisma = new PrismaClient()

async function promptHidden(message: string) {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error('Admin creation requires an interactive terminal.')
  }

  stdout.write(message)
  stdin.setRawMode(true)
  stdin.resume()

  return new Promise<string>((resolve, reject) => {
    let value = ''
    const onData = (chunk: Buffer) => {
      for (const byte of chunk) {
        if (byte === 3) {
          stdin.off('data', onData)
          stdin.setRawMode(false)
          stdout.write('\n')
          reject(new Error('Admin creation cancelled.'))
          return
        }
        if (byte === 13 || byte === 10) {
          stdin.off('data', onData)
          stdin.setRawMode(false)
          stdout.write('\n')
          resolve(value)
          return
        }
        if (byte === 8 || byte === 127) {
          value = value.slice(0, -1)
          continue
        }
        if (byte >= 32 && byte <= 126) value += String.fromCharCode(byte)
      }
    }

    stdin.on('data', onData)
  })
}

async function main() {
  const terminal = createInterface({ input: stdin, output: stdout })
  let fullName: string
  let email: string
  try {
    fullName = await terminal.question('Full name: ')
    email = await terminal.question('Email: ')
  } finally {
    terminal.close()
  }

  const password = await promptHidden('Password (minimum 8 characters): ')
  const confirmation = await promptHidden('Confirm password: ')
  if (password !== confirmation) throw new Error('Passwords do not match.')

  const input = AdminUserCreateSchema.parse({
    fullName,
    email,
    password,
    role: 'SUPER_ADMIN',
  })
  const existingSuperAdmin = await prisma.adminUser.findFirst({
    where: { role: 'SUPER_ADMIN', isActive: true },
    select: { id: true },
  })
  if (existingSuperAdmin) {
    throw new Error(
      'An active Super Admin already exists. Create additional admins from the CMS.',
    )
  }

  const user = await prisma.adminUser.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      role: 'SUPER_ADMIN',
      passwordHash: await hash(input.password, 12),
    },
    select: { fullName: true, email: true },
  })
  console.info(`Super Admin created for ${user.email}.`)
}

main()
  .catch((error: unknown) => {
    console.error('Could not create the Super Admin:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
