"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const TeacherLayout = ({ children }: { children: React.ReactNode }) => {
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/check-role`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        console.log("Fetch Response:", response);

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Role Data:", data);
        setIsTeacher(data.isTeacher);
      } catch (error) {
        console.error("Error fetching role:", error);
        setError("Failed to fetch user role. Please try again.");
      }
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100">
        <div className="flex flex-col items-center text-center space-y-4">
          <p className="text-red-700 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isTeacher) {
    console.log("Redirecting user as they are not a teacher");
    router.push("/");
    return null;
  }

  return <>{children}</>;
};

export default TeacherLayout;
