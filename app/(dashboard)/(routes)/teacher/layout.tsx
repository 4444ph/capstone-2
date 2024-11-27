"use client"; // Add this line at the top of the file

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react"; // Assuming you're already using Lucide icons

const TeacherLayout = ({ children }: { children: React.ReactNode }) => {
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/check-role`
      );
      const data = await response.json();
      setIsTeacher(data.isTeacher);
    };

    fetchRole();
  }, []);

  if (isTeacher === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center text-center space-y-4">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
          <p className="text-gray-700 text-lg">Loading, please wait...</p>
        </div>
      </div>
    );
  }

  if (!isTeacher) {
    return redirect("/"); // Redirect to homepage if not a teacher
  }

  return <>{children}</>;
};

export default TeacherLayout;
