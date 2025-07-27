"use client";

import React, { useEffect, useState } from "react";
import { Slider, Chip, Snippet, Input, Spinner, Button, Divider } from "@heroui/react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDeviceConnection, updateDevice } from "@/pages/api/device";
import { Device } from "Type";

export const DeviceSettings = ({ device }: { device: Device }) => {
  const queryClient = useQueryClient();
  
  // State for form inputs
  const [deviceName, setDeviceName] = useState(device.name);
  const [deviceIp, setDeviceIp] = useState(device.ip);
  const [volume, setVolume] = useState<number>(device.volume || 50);

  // Update state when the selected device changes
  useEffect(() => {
    setDeviceName(device.name);
    setDeviceIp(device.ip);
    setVolume(device.volume || 50);
  }, [device]);

  // Query for device connection status
  const { data: isConnected, isLoading: isConnLoading } = useQuery({
    queryKey: ["conn", device.deviceId],
    queryFn: async () => {
      const result = await getDeviceConnection(device.deviceId);
      return result.status === "success" ? result.data.isConnected : false;
    },
    enabled: !!device.deviceId,
  });

  // Mutation for updating device info (name, ip, volume)
  const { mutate: updateDeviceMutation, isLoading: isUpdating } = useMutation({
    mutationFn: ({ name, ip, vol }: { name: string; ip: string; vol: number }) =>
      updateDevice(device.deviceId, name, ip, vol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviceList"] });
      // Optionally, add a success toast/message here
    },
    onError: () => {
      // Optionally, add an error toast/message here
    }
  });

  const handleDeviceUpdate = () => {
    updateDeviceMutation({ name: deviceName, ip: deviceIp, vol: volume });
  };

  return (
    <div className="space-y-6">
      {/* Device Info Section */}
      <div className="p-4 border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <InfoOutlinedIcon fontSize="small" />
          기기 정보
        </h3>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center">
            <label className="text-sm w-24 text-gray-600">기기 이름:</label>
            <span>{device.name}</span>
          </div>
          <div className="flex items-center">
            <label className="text-sm w-24 text-gray-600">기기 IP:</label>
            <Snippet hideCopyButton hideSymbol size="sm">{device.ip}</Snippet>
          </div>
          <div className="flex items-center">
            <label className="text-sm w-24 text-gray-600">연결 상태:</label>
            {isConnLoading ? (
              <Spinner size="sm" />
            ) : isConnected ? (
              <Chip color="success" size="sm">연결 됨</Chip>
            ) : (
              <Chip color="danger" size="sm">연결 끊어짐</Chip>
            )}
          </div>
        </div>
      </div>

      {/* Device Settings Section */}
      <div className="p-4 border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <SettingsIcon fontSize="small" />
          기기 설정
        </h3>
        <div className="flex flex-col space-y-4">
          <Input
            label="기기 이름"
            value={deviceName}
            onValueChange={setDeviceName}
            placeholder="변경할 기기 이름을 입력하세요"
            className="text-base"
          />
          <Input
            label="기기 IP"
            value={deviceIp}
            onValueChange={setDeviceIp}
            placeholder="변경할 기기 IP주소를 입력하세요"
            className="text-base"
          />
          <Divider className="my-2" />
          <div>
            <label className="text-sm text-gray-600">명령어 볼륨</label>
            <Slider
              aria-label="volume"
              className="mt-2"
              value={volume}
              onChange={(value) => setVolume(Array.isArray(value) ? value[0] : value)}
              maxValue={100}
              minValue={1}
              step={1}
              startContent={<VolumeDownIcon />}
              endContent={<VolumeUpIcon />}
              showTooltip
            />
          </div>
          <Button
            onPress={handleDeviceUpdate}
            color="primary"
            className="self-end"
            isLoading={isUpdating}
          >
            {isUpdating ? "저장 중..." : "기기 정보 저장"}
          </Button>
        </div>
      </div>
    </div>
  );
};
