"use client";

import { useState } from "react";
import Modal from "./popup";
import type { ScheduleList } from "Type";
import { Button } from "@heroui/react";

interface IButtonProps {
  queryId: string;
  title: string;
  scheduleType: ScheduleList["type"];
  schedule?: any;
}

export default function CreateButton({
  queryId,
  title,
  scheduleType,
  schedule,
}: IButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="p-4">
      <Button
        size="lg"
        radius="full"
        className="fixed bottom-4 right-16 bg-gradient-to-tr from-slate-500 to-slate-900 hover:from-red-400 hover:to-red-900 text-white shadow-lg"
        type="button"
        onPress={openModal}
      >
        {title}
      </Button>
      {isModalOpen && (
        <Modal
          onClose={closeModal}
          queryId={queryId}
          type={scheduleType}
          schedule={schedule}
        >
          {scheduleType === "recurring" ? "루틴 생성하기" : "이벤트 생성하기"}
        </Modal>
      )}
    </div>
  );
}
