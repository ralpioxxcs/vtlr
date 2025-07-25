"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDevice } from "@/pages/api/device";
import { Tabs, Tab, Spinner } from "@heroui/react";
import { DeviceSettings } from "@/components/device-settings";
import { AddDeviceForm } from "@/components/add-device-form";
import { Device } from "Type";
import AddIcon from "@mui/icons-material/Add";

export default function SettingsPage() {
  const [selectedTab, setSelectedTab] = useState<string | number>("add");

  const {
    data: deviceList,
    isLoading,
    isError,
  } = useQuery<Device[]>({
    queryKey: ["deviceList"],
    queryFn: async () => {
      const result = await getDevice();
      if (result.status === "success" && result.data.length > 0) {
        setSelectedTab(result.data[0].deviceId);
        return result.data;
      }
      return [];
    },
  });

  if (isLoading) {
    return (
      <div className="grow flex justify-center items-center">
        <Spinner size="lg" label="기기 목록을 불러오는 중..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-red-500">
        기기 목록을 불러오는데 실패했습니다.
      </div>
    );
  }

  const selectedDevice = deviceList?.find(
    (device) => device.deviceId === selectedTab,
  );

  return (
    <div className="p-4 flex flex-col">
      <h1 className="text-xl font-semibold mb-4 text-center">설정</h1>
      <div className="flex flex-col w-full">
        <Tabs
          aria-label="Device settings tabs"
          selectedKey={selectedTab}
          onSelectionChange={setSelectedTab}
          color="primary"
          variant="underlined"
        >
          {deviceList?.map((device) => (
            <Tab key={device.deviceId} title={device.name} />
          ))}
          <Tab
            key="add"
            title={
              <div className="flex items-center space-x-1">
                <AddIcon />
                <span>기기 추가</span>
              </div>
            }
          />
        </Tabs>
        <div className="mt-4">
          {selectedDevice ? (
            <DeviceSettings device={selectedDevice} />
          ) : selectedTab === "add" ? (
            <AddDeviceForm />
          ) : (
            <div className="text-center p-4">
              기기를 선택해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
