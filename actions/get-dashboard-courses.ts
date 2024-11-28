import { Category, Chapter, Course } from "@prisma/client";
import { getProgress } from "@/actions/get-progress";
import { db } from "@/lib/db";

type CourseWithProgressWithCategory = Course & {
  category: Category;
  chapters: Chapter[];
  progress: number | null;
}

type DashboardCourses = {
  completedCourses: CourseWithProgressWithCategory[];
  coursesInProgress: CourseWithProgressWithCategory[];
}

export const getDashboardCourses = async (userId: string): Promise<DashboardCourses> => {
  try {
    // Fetch courses created by the user or courses where the user has progress
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
        OR: [
          { userId: userId },
          {
            chapters: {
              some: {
                userProgress: {
                  some: {
                    userId: userId,
                    isCompleted: true,
                  }
                }
              }
            }
          }
        ]
      },
      include: {
        category: true,
        chapters: {
          where: {
            isPublished: true,
          }
        }
      }
    }) as CourseWithProgressWithCategory[];

    // Calculate progress for each course
    for (let course of courses) {
      const progress = await getProgress(userId, course.id);
      course.progress = progress;
    }

    const completedCourses = courses.filter((course) => course.progress === 100);
    const coursesInProgress = courses.filter((course) => (course.progress ?? 0) < 100);

    return {
      completedCourses,
      coursesInProgress,
    }

  } catch (error) {
    console.log("[GET_DASHBOARD_COURSES]", error);
    return {
      completedCourses: [],
      coursesInProgress: [],
    }
  }
}
