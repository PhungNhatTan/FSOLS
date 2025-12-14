import prisma from "../../prismaClient.js";

export default async function create(data) {
    if (!data || (data.CourseId === undefined || data.CourseId === null)) {
        throw new Error("CourseId is required to create a module");
    }

    const courseId = Number(data.CourseId);
    if (Number.isNaN(courseId)) {
        throw new Error("CourseId must be a number")
    };

    const course = await prisma.course.findUnique({
        where: { Id: courseId },
        select: { Id: true, DeletedAt: true },
    });
    if (!course || course.DeletedAt) {
        const e = new Error("Course not found or has been deleted");
        e.status = 404;
        throw e;
    }

    const orderNo = data.OrderNo !== undefined ? Number(data.OrderNo) : 10; 

    const payload = {
        CourseId: courseId,
        OrderNo: orderNo,
    };

    const created = await prisma.courseModule.create({ data: payload });
    return created;
}
