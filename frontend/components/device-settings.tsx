"use client";

import React, { useEffect, useState } from "react";
import {
  Slider,
  Chip,
  Snippet,
  Input,
  Spinner,
  NumberInput,
  Button,
  Divider,
  Textarea,
} from "@heroui/react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDeviceConfiguration,
  getDeviceConnection,
  playAudio,
  setDeviceConfiguration,
  updateDevice,
} from "@/pages/api/device";
import {
  getTTS,
  getTTSConfiguration,
  makeSpeech,
  setTTSConfiguration,
} from "@/pages/api/tts";
import { Device } from "Type";

export const DeviceSettings = ({ device }: { device: Device }) => {
  const queryClient = useQueryClient();
  const [volume, setVolume] = useState<number>(50);
  const [speechText, setText] = useState<string>(
    "동해물과 백두산이 마르고 닳도록",
  );
  const [deviceName, setDeviceName] = useState(device.name);
  const [deviceIp, setDeviceIp] = useState(device.ip);

  useEffect(() => {
    setDeviceName(device.name);
    setDeviceIp(device.ip);
  }, [device]);

  const { data: ttsList, isLoading: isTTSListLoading } = useQuery({
    queryKey: ["ttsList"],
    queryFn: async () => {
      const result = await getTTS();
      return result.status === "success" ? result.data : [];
    },
  });

  const { data: isConnected, isLoading: isConnLoading } = useQuery({
    queryKey: ["conn", device.deviceId],
    queryFn: async () => {
      const result = await getDeviceConnection(device.deviceId);
      return result.status === "success" ? result.data.isConnected : false;
    },
    enabled: !!device.deviceId,
  });

  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ["config", device.deviceId],
    queryFn: async () => {
      const result = await getDeviceConfiguration(device.deviceId);
      if (result.status === "success") {
        setVolume(result.data.volume);
        return result.data;
      }
      return null;
    },
    enabled: !!device.deviceId,
  });

  const { data: ttsConfig, isLoading: isTTSConfigLoading } = useQuery({
    queryKey: ["ttsConfig", ttsList],
    queryFn: async () => {
      if (!ttsList || ttsList.length === 0) return null;
      const result = await getTTSConfiguration(ttsList[0].ttsId);
      return result.status === "success" ? result.data : null;
    },
    enabled: !!ttsList && ttsList.length > 0,
  });

  const mutationUpdateDevice = useMutation({
    mutationFn: ({ name, ip }: { name: string; ip: string }) =>
      updateDevice(device.deviceId, name, ip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviceList"] });
    },
  });

  const mutationDeviceConfig = useMutation({
    mutationFn: (newVolume: number) =>
      setDeviceConfiguration(device.deviceId, newVolume),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", device.deviceId] });
    },
  });

  const mutationTTS = useMutation({
    mutationFn: (newConfig: any) => {
      if (!ttsList || ttsList.length === 0)
        throw new Error("TTS ID not found");
      return setTTSConfiguration(
        ttsList[0].ttsId,
        newConfig.pitch,
        newConfig.bass,
        newConfig.treble,
        newConfig.reverb,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ttsConfig", ttsList] });
    },
  });

  const handleDeviceUpdate = () => {
    mutationUpdateDevice.mutate({ name: deviceName, ip: deviceIp });
  };

  const handleVolumeChange = (value: number) => {
    mutationDeviceConfig.mutate(value);
  };

  const handleTTSConfigChange = (key: string, value: number) => {
    if (!ttsConfig) return;
    const newConfig = { ...ttsConfig, [key]: value };
    mutationTTS.mutate(newConfig);
  };

  const handleSpeechTest = async () => {
    if (!ttsList || ttsList.length === 0) return;
    const result = await makeSpeech(ttsList[0].ttsId, speechText);
    await playAudio(device.deviceId, result.data.playId);
  };

  if (isTTSListLoading) {
    return (
      <div className="grow flex justify-center items-center">
        <Spinner size="lg" label="로딩 중.." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 border border-gray-300 rounded-lg shadow-md">
        <label className="block text-xl font-bold mb-4">
          기기 정보 <InfoOutlinedIcon className="text-sm" />
        </label>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center">
            <label className="text-sm w-24 text-left pr-2">기기 이름: </label>
            <span>{device.name}</span>
          </div>
          <div className="flex items-center">
            <label className="text-sm w-24 text-left pr-2">기기 IP: </label>
            <Snippet hideCopyButton hideSymbol size="sm">
              {device.ip}
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
          <Input
            label="기기 이름"
            value={deviceName}
            onValueChange={setDeviceName}
            placeholder="변경할 기기 이름을 입력하세요"
          />
          <Input
            label="기기 IP"
            value={deviceIp}
            onValueChange={setDeviceIp}
            placeholder="변경할 기기 IP주소를 입력하세요"
          />
          <Button
            onPress={handleDeviceUpdate}
            color="primary"
            className="self-end"
          >
            기기 정보 저장
          </Button>
        </div>
        <Divider className="my-4" />
        <div className="mb-4 mt-4">
          <label className="text-sm w-full text-left pr-4">명령어 볼륨:</label>
          {isConfigLoading ? (
            <Spinner size="sm" />
          ) : (
            <Slider
              aria-label="volume"
              className="mt-2"
              value={volume}
              onChange={setVolume}
              onChangeEnd={handleVolumeChange}
              maxValue={100}
              minValue={1}
              step={1}
              startContent={<VolumeDownIcon />}
              endContent={<VolumeUpIcon />}
              showTooltip
            />
          )}
        </div>
      </div>

      <div className="p-4 border border-gray-300 rounded-lg shadow-md">
        <label className="block text-xl font-bold mb-4">
          집사 목소리 설정 <RecordVoiceOverIcon className="text-sm" />
        </label>
        {isTTSConfigLoading || !ttsConfig ? (
          <Spinner size="sm" />
        ) : (
          <div className="flex flex-col space-y-2">
            <NumberInput
              value={ttsConfig.pitch}
              onValueChange={(v) => handleTTSConfigChange("pitch", v)}
              label="음 높이"
              maxValue={500}
              minValue={-500}
              step={10}
              description="값을 높이면 목소리가 가늘어지고, 낮추면 굵어집니다"
              variant="bordered"
            />
            <NumberInput
              value={ttsConfig.treble}
              onValueChange={(v) => handleTTSConfigChange("treble", v)}
              label="고음 정도"
              maxValue={30}
              minValue={-30}
              step={1}
              description="높은 주파수를 강조하거나 줄입니다"
              variant="bordered"
            />
            <NumberInput
              value={ttsConfig.bass}
              onValueChange={(v) => handleTTSConfigChange("bass", v)}
              label="저음 정도"
              maxValue={30}
              minValue={-30}
              step={1}
              description="낮은 주파수를 강조하거나 줄입니다"
              variant="bordered"
            />
            <NumberInput
              value={ttsConfig.reverb}
              onValueChange={(v) => handleTTSConfigChange("reverb", v)}
              label="울림 정도"
              maxValue={100}
              minValue={0}
              step={1}
              description="소리가 공간에서 반사되어 퍼지는 느낌을 줍니다"
              variant="bordered"
            />
            <Divider className="my-4" />
            <h3 className="font-semibold">목소리 테스트</h3>
            <Textarea
              isClearable
              value={speechText}
              onValueChange={setText}
              placeholder="테스트할 문장을 입력하세요"
              variant="bordered"
            />
            <Button color="primary" onPress={handleSpeechTest}>
              목소리 테스트
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
