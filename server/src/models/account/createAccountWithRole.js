import prisma from "../../prismaClient.js"

export default async function createAccountWithRole({
  username,
  displayName,
  identifier,
  password,
  providerId,
  role,
  email,
  phone,
}) {
  return prisma.account.create({
    data: {
      Username: username,
      DisplayName: displayName,
      AccountIdentifier: {
        create: {
          Identifier: identifier,
          Secret: password,
          Provider: { connect: { Id: providerId } },
        },
      },
      AccountRole: {
        create: {
          Role: role,
        },
      },
      ...(role === "Mentor" && {
        Mentor: {
          create: {
            Name: displayName,
            Email: email || null,
            Phone: phone || null,
          },
        },
      }),
      ...(role === "Admin" && {
        Admin: {
          create: {},
        },
      }),
    },
    include: {
      AccountIdentifier: true,
      AccountRole: true,
      Mentor: true,
      Admin: true,
    },
  })
}
