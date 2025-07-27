"use client";

import React from 'react';

export default function TaskPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full grow text-center">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          할 일 기능
        </h1>
        <p className="text-gray-600">
          현재 준비 중입니다. 곧 더 좋은 모습으로 찾아뵙겠습니다!
        </p>
      </div>
    </div>
  );
}
