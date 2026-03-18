"use client";

interface ProgressBarProps {
  currentSection: number;
  totalSections: number;
}

export default function ProgressBar({
  currentSection,
  totalSections,
}: ProgressBarProps) {
  const progress = ((currentSection + 1) / totalSections) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Section {currentSection + 1} of {totalSections}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round(progress)}% complete
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
