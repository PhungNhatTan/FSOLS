import prisma from "../../prismaClient.js";

/**
 * List certificates issued to a specific account.
 * Returns UserCertificate rows with minimal Certificate details for UI rendering.
 */
export default async function listByAccountId(accountId) {
  return prisma.userCertificate.findMany({
    where: {
      AccountId: accountId,
      DeletedAt: null,
      Certificate: {
        DeletedAt: null,
      },
    },
    orderBy: { CreatedAt: "desc" },
    select: {
      Id: true,
      CertificateId: true,
      CreatedAt: true,
      Certificate: {
        select: {
          Id: true,
          CertificateType: true,
          Course: {
            select: { Id: true, Name: true },
          },
          Specialization: {
            select: { Id: true, SpecializationName: true },
          },
        },
      },
    },
  });
}
