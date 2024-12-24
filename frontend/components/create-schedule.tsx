"use client";

import { useState } from "react";
import Modal from "./popup";
import type { ScheduleList } from "Type";

interface IButtonProps {
  queryId: string;
  title: string;
  scheduleType: ScheduleList["type"];
}

export default function CreateButton({
  queryId,
  title,
  scheduleType,
}: IButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="p-4">
      <button
        type="button"
        onClick={openModal}
        className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-2xl shadow-lg transition-all duration-200"
      >
        {title}
      </button>
      {isModalOpen && (
        <Modal onClose={closeModal} queryId={queryId} type={scheduleType}>
          이벤트 생성하기
        </Modal>
      )}
    </div>
  );
}
