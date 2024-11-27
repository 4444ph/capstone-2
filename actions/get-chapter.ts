import { db } from "@/lib/db";
import { Attachment, Chapter } from "@prisma/client";

interface GetChapterProps {
  userId: string;
  courseId: string;
  chapterId: string;
}

export const getChapter = async ({
  userId,
  courseId,
  chapterId,
}: GetChapterProps) => {
  try {
    const course = await db.course.findUnique({
      where: {
        isPublished: true,
        id: courseId,
      },
    });

    const chapter = await db.chapter.findUnique({
      where: {
        id: chapterId,
        isPublished: true,
      },
      include: {
        muxData: true, // Include muxData in the query
      },
    });

    if (!chapter || !course) {
      throw new Error("Not found");
    }

    let attachments: Attachment[] = [];
    let nextChapter: Chapter | null = null;

    attachments = await db.attachment.findMany({
      where: {
        courseId: courseId,
      },
    });

    nextChapter = await db.chapter.findFirst({
      where: {
        courseId: courseId,
        isPublished: true,
        position: {
          gt: chapter?.position,
        },
      },
      orderBy: {
        position: "asc",
      },
    });

    const userProgress = await db.userProgress.findFirst({
      where: {
        userId: userId,
        chapterId: chapterId,
      },
    });

    return {
      chapter,
      course,
      attachments,
      nextChapter,
      userProgress,
      muxData: chapter.muxData, // Return muxData from chapter
    };
  } catch (error) {
    console.log("[GET_CHAPTER]", error);
    return {
      chapter: null,
      course: null,
      attachments: null,
      nextChapter: null,
      userProgress: null,
      muxData: null,
    };
  }
}
