"use client";

import React from "react";
import { Input, Button } from "@heroui/react";

export const AddDeviceForm = () => {
  // TODO: Implement API call to add a new device
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("기기 추가 기능은 현재 준비 중입니다.");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border border-gray-300 rounded-lg shadow-md"
    >
      <h2 className="text-xl font-bold mb-4">새 기기 추가</h2>
      <div className="flex flex-col space-y-4">
        <Input
          isRequired
          name="deviceName"
          label="기기 이름"
          placeholder="예: 거실 스피커"
          type="text"
        />
        <Input
          isRequired
          name="deviceIp"
          label="기기 IP 주소"
          placeholder="예: 192.168.1.10"
          type="text"
        />
        <Button type="submit" color="primary">
          기기 추가
        </Button>
      </div>
    </form>
  );
};
