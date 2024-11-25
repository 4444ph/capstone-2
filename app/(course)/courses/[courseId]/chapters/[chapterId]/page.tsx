import { getChapter } from "@/actions/get-chapter";
import { Banner } from "@/components/banner";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { VideoPlayer } from "./_components/video-player";
import { File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Preview } from "@/components/preview";
import { CourseProgressButton } from "./_components/course-progress-button";
import DownloadButton from "./DownloadButton";

interface ChapterIdPageProps {
  params: { courseId: string; chapterId: string };
}

const ChapterIdPage = async ({ params }: ChapterIdPageProps) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const { chapter, course, attachments, nextChapter, userProgress } =
    await getChapter({
      userId,
      chapterId: params.chapterId,
      courseId: params.courseId,
    });

  if (!chapter || !course) {
    return redirect("/");
  }

  const isLocked = !chapter.isFree;
  const completeOnEnd = !userProgress?.isCompleted;

  return (
    <div>
      {userProgress?.isCompleted && (
        <Banner
          variant="success"
          label="You've already completed this chapter!"
        />
      )}
      {isLocked && (
        <Banner variant="warning" label="chapter currently not available." />
      )}
      <div className="flex flex-col max-w-4xl mx-auto pb-20">
        <div className="p-4">
          <VideoPlayer
            chapterId={params.chapterId}
            title={chapter.title}
            courseId={params.courseId}
            nextChapterId={nextChapter?.id}
            playbackId={chapter.videoUrl}
            isLocked={isLocked}
            completeOnEnd={completeOnEnd}
          />
        </div>
        <Separator />
        <div className="p-4 flex flex-col md:flex-row items-center justify-between">
          <h2 className="text-2xl font-semibold mb-2">{chapter.title}</h2>

          <CourseProgressButton
            chapterId={params.chapterId}
            courseId={params.courseId}
            nextChapterId={nextChapter?.id}
            isCompleted={!!!userProgress?.isCompleted}
          />
        </div>
        <Separator />
        {chapter.description && (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <div>
              <Preview value={chapter.description} />
            </div>
          </div>
        )}
        <Separator />
        {attachments && attachments.length > 0 && (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Attachments</h3>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center p-3 w-full bg-sky-100 border-sky-200 border text-sky-700 rounded-md"
                >
                  <File className="h-4 w-4 mr-2 flex-shrink-0" />
                  <p className="text-sm line-clamp-1">{attachment.name}</p>
                  <Button asChild variant="ghost" className="ml-auto">
                    <DownloadButton
                      attachmentId={attachment.id}
                      filename={attachment.name}
                      courseId={params.courseId}
                    />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterIdPage;
