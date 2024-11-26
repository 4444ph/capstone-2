    "use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface CourseProgressButtonProps {
    chapterId: string;
    courseId: string;
    isCompleted?: boolean;
    nextChapterId?: string;
}

export const CourseProgressButton = ({
    chapterId,
    courseId,
    isCompleted: initialIsCompleted,
    nextChapterId,
}: CourseProgressButtonProps) => {
    const router = useRouter();
    const confetti = useConfettiStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(initialIsCompleted);

    useEffect(() => {
        setIsCompleted(initialIsCompleted);
    }, [initialIsCompleted]);

    const onClick = async () => {
        try {
            setIsLoading(true);
            const newIsCompleted = !isCompleted;
            
            const response = await axios.put(`/api/courses/${courseId}/chapters/${chapterId}/progress`, {
                isCompleted: newIsCompleted
            });  

            if (response.status === 200) {
                setIsCompleted(newIsCompleted);

                if (newIsCompleted) {
                    toast.success("Chapter completed");
                    if (!nextChapterId) {
                        confetti.onOpen();
                    }
                } else {
                    toast.success("Chapter not completed");
                }
                
                router.refresh();
            }
        } catch (error) {
            toast.error("Something went wrong");
            console.error("Error updating chapter progress:", error);
        } finally {
            setIsLoading(false);
        }
    };
  
    const Icon = isCompleted ? XCircle : CheckCircle;

    return (
        <Button
            onClick={onClick}
            disabled={isLoading}
            type="button"
            variant={isCompleted ? "outline" : "success"}
            className="w-full md:w-auto"
        >
            {isCompleted ? "Mark as incomplete" : "Mark as complete"}
            <Icon className="h-4 w-4 ml-2"/>
        </Button>
    );
};