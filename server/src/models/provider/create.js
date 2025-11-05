import prisma from "../../prismaClient.js";

export default async function create(data) {
    prisma.provider.create({
        data:{
            Name: data.Name,
            Enabled: data.Enabled,
            Config: data.Config,
        }
    });
}
