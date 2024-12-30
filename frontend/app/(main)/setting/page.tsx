"use client";

import { Slider, Chip, Snippet, Input, Spinner } from "@nextui-org/react";
import React, { useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getDevice,
  getDeviceConfiguration,
  getDeviceConnection,
  setDeviceConfiguration,
} from "@/pages/api/device";

export default function DeviceSettings() {
  const mutation = useMutation({
    mutationFn: async (newVolume: number) => {
      if (!data[0]?.deviceId) throw new Error("Device ID not found");
      return await setDeviceConfiguration(data[0]?.deviceId, newVolume);
    },
    onSuccess: (response) => {
      console.log("Configuration updated successfully:", response);
    },
    onError: (error) => {
      console.error("Error updating configuration:", error);
    },
  });

  const queryId = "setting";
  const { data, isLoading, isError } = useQuery({
    queryKey: [queryId],
    queryFn: async () => {
      const result = await getDevice();
      if (result.status === "success") {
        return result.data;
      } else {
        throw new Error("error");
      }
    },
  });

  const { data: isConnected, isLoading: isConnLoading } = useQuery({
    queryKey: ["conn", data],
    queryFn: async () => {
      const result = await getDeviceConnection(data[0]?.deviceId);
      console.log("result:", result);
      if (result.status === "success") {
        return result.data.isConnected;
      } else {
        throw new Error("error");
      }
    },
    enabled: !!data,
  });

  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ["config", data],
    queryFn: async () => {
      const result = await getDeviceConfiguration(data[0]?.deviceId);
      if (result.status === "success") {
        return result.data;
      } else {
        throw new Error("error");
      }
    },
    enabled: !!data,
  });

  const changeVolume = (vol: number) => {
    config.volume = vol;
  }

  const handleVolumeChange = (newVolume: number) => {
    mutation.mutate(newVolume);
  };


  if (isLoading) {
    return (
      <div className="grow flex justify-center items-center">
        <Spinner size="lg" label="로딩 중.." />
      </div>
    );
  }

  if (isError) {
    return <h1>Error</h1>;
  }

  return (
    <div className="grow p-4 flex flex-col">
      <h1 className="text-xl font-semibold mb-4 text-center">설정</h1>

      <div className="flex justify-center mb-6 bg-transparent">
        <img
          src="/google-home-mini.png"
          alt="Google Home Mini"
          className="object-contain bg-transparent"
        />
      </div>

      <div className="mb-6 p-4 border border-gray-300 rounded-lg shadow-md">
        <label className="block text-xl font-bold mb-4">
          기기 정보 <InfoOutlinedIcon className="text-sm" />
        </label>

        <div className="flex flex-col space-y-4">
          <div className="flex items-center">
            <label className="text-sm w-24 text-left pr-2">기기 이름: </label>
            <span>{data[0]?.name}</span>
          </div>

          <div className="flex items-center">
            <label className="text-sm w-24 text-left pr-2">기기 IP: </label>
            <Snippet
              hideCopyButton
              hideSymbol
              size="sm"
              className="text-sm font-light"
            >
              {data[0]?.ip}
            </Snippet>
          </div>

          <div className="flex items-center">
            <label className="text-sm w-24 text-left pr-2">연결 상태:</label>
            {isConnLoading ? (
              <Spinner size="sm" />
            ) : isConnected ? (
              <Chip variant="flat" color="success" size="sm" radius="sm">
                연결 됨
              </Chip>
            ) : (
              <Chip variant="flat" color="danger" size="sm" radius="sm">
                연결 끊어짐
              </Chip>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border border-gray-300 rounded-lg shadow-md">
        <label className="block text-xl font-bold mb-4">
          기기 설정 <SettingsIcon className="text-sm" />
        </label>

        <div className="flex flex-col space-y-4">
          <div className="flex items-center">
            <label className="text-sm w-24 text-left pr-4">기기 이름</label>
            <Input
              disabled
              isRequired
              name="deviceName"
              placeholder="변경할 기기 이름을 입력하세요"
              type="text"
            />
          </div>
          <div className="flex items-center">
            <label className="text-sm w-24 text-left pr-4">기기 IP</label>
            <Input
              disabled
              isRequired
              name="deviceIp"
              placeholder="변경할 기기 IP주소를 입력하세요"
              type="text"
            />
          </div>
        </div>

        <div className="mb-4 mt-4">
          <label className="text-sm w-24 text-left pr-4">명령어 볼륨:</label>
          {isConfigLoading ? (
            <Spinner size="sm" />
          ) : (
            <Slider
              aria-label="slider"
              className="mt-2"
              size="md"
              value={config.volume}
              onChange={changeVolume}
              onChangeEnd={handleVolumeChange}
              maxValue={100}
              minValue={1}
              step={1}
              startContent={<VolumeDownIcon />}
              endContent={<VolumeUpIcon />}
              showTooltip={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}
