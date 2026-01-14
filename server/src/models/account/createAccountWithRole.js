import prisma from "../../prismaClient.js"

export default async function createAccountWithRole({
  username,
  displayName,
  identifier,
  password,
  providerId,
  // Optional: create a verified email identity
  emailIdentifier,
  emailProviderId,
  role,
  email,
  phone,
}) {
  const usernameIdentifier = identifier || username

  return prisma.account.create({
    data: {
      Username: username,
      DisplayName: displayName,
      AccountIdentifier: {
        create: [
          {
            Identifier: usernameIdentifier,
            Secret: password,
            Verified: true,
            Provider: { connect: { Id: providerId } },
          },
          ...(emailIdentifier && emailProviderId
            ? [
                {
                  Identifier: emailIdentifier,
                  Secret: password,
                  Verified: true,
                  Provider: { connect: { Id: emailProviderId } },
                },
              ]
            : []),
        ],
      },
      AccountRole: { create: { Role: role } },
      ...(role === "Mentor" && {
        Mentor: { create: { Name: displayName, Email: email || null, Phone: phone || null } },
      }),
      ...(role === "Admin" && { Admin: { create: {} } }),
    },
    include: { AccountIdentifier: true, AccountRole: true, Mentor: true, Admin: true },
  })
}
