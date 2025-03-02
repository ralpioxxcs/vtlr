"use client";

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
import React, { useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getDevice,
  getDeviceConfiguration,
  getDeviceConnection,
  playAudio,
  setDeviceConfiguration,
} from "@/pages/api/device";
import {
  getTTS,
  getTTSConfiguration,
  makeSpeech,
  setTTSConfiguration,
} from "@/pages/api/tts";

export default function DeviceSettings() {
  const [volume, setVolume] = useState<number>(50);
  const [speechText, setText] =
    useState<string>("동해물과 백두산이 마르고 닳도록");

  const {
    data: deviceList,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["setting"],
    queryFn: async () => {
      const result = await getDevice();
      if (result.status === "success") {
        return result.data;
      } else {
        throw new Error("error");
      }
    },
  });

  const {
    data: ttsList,
    isLoading: isTTSListLoading,
    isError: isTTSListError,
  } = useQuery({
    queryKey: ["ttsConfig"],
    queryFn: async () => {
      const result = await getTTS();
      if (result.status === "success") {
        return result.data;
      } else {
        throw new Error("error");
      }
    },
  });

  const mutationDevice = useMutation({
    mutationFn: async (newVolume: number) => {
      if (!deviceList[0]?.deviceId) {
        throw new Error("Device ID not found");
      }
      return await setDeviceConfiguration(deviceList[0]?.deviceId, newVolume);
    },
    onSuccess: (response) => {
      console.log("Configuration updated successfully:", response);
    },
    onError: (error) => {
      console.error("Error updating configuration:", error);
    },
  });

  const mutationTTS = useMutation({
    mutationFn: async () => {
      if (!ttsList[0]?.ttsId) {
        throw new Error("TTS ID not found");
      }
      return await setTTSConfiguration(
        ttsList[0]?.ttsId,
        ttsConfig.pitch,
        ttsConfig.bass,
        ttsConfig.treble,
        ttsConfig.reverb,
      );
    },
    onSuccess: (response) => {
      console.log("Configuration updated successfully:", response);
    },
    onError: (error) => {
      console.error("Error updating configuration:", error);
    },
  });

  const { data: isConnected, isLoading: isConnLoading } = useQuery({
    queryKey: ["conn", deviceList],
    queryFn: async () => {
      const result = await getDeviceConnection(deviceList[0]?.deviceId);
      if (result.status === "success") {
        return result.data.isConnected;
      } else {
        throw new Error("error");
      }
    },
    enabled: !!deviceList,
  });

  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ["config", deviceList],
    queryFn: async () => {
      const result = await getDeviceConfiguration(deviceList[0]?.deviceId);
      if (result.status === "success") {
        setVolume(result.data.volume);
        return result.data;
      } else {
        throw new Error("error");
      }
    },
    enabled: !!deviceList,
  });

  const { data: ttsConfig, isLoading: isTTSConfigLoading } = useQuery({
    queryKey: ["ttsConfig", ttsList],
    queryFn: async () => {
      const result = await getTTSConfiguration(ttsList[0]?.ttsId);
      if (result.status === "success") {
        return result.data;
      } else {
        throw new Error("error");
      }
    },
    enabled: !!ttsList,
  });

  const handleVolumeChange = (value: number) => {
    mutationDevice.mutate(value);
  };

  const handlePitchChange = (value: number) => {
    ttsConfig.pitch = value;
    mutationTTS.mutate();
  };

  const handleTrebleChange = (value: number) => {
    ttsConfig.treble = value;
    mutationTTS.mutate();
  };

  const handleBassChange = (value: number) => {
    ttsConfig.bass = value;
    mutationTTS.mutate();
  };

  const handleReverbChange = (value: number) => {
    ttsConfig.reverb = value;
    mutationTTS.mutate();
  };

  const handleSpeechTest = async () => {
    const result = await makeSpeech(ttsList[0].ttsId, speechText);

    await playAudio(deviceList[0].deviceId, result.data.playId);
  };

  if (isLoading || isTTSListLoading) {
    return (
      <div className="grow flex justify-center items-center">
        <Spinner size="lg" label="로딩 중.." />
      </div>
    );
  }

  if (isError || isTTSListError) {
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
            <span>{deviceList[0]?.name}</span>
          </div>

          <div className="flex items-center">
            <label className="text-sm w-24 text-left pr-2">기기 IP: </label>
            <Snippet
              hideCopyButton
              hideSymbol
              size="sm"
              className="text-sm font-light"
            >
              {deviceList[0]?.ip}
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

      <div className="mb-6 p-4 border border-gray-300 rounded-lg shadow-md">
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
              value={volume}
              onChange={setVolume}
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

      <div className="p-4 border border-gray-300 rounded-lg shadow-md">
        <label className="block text-xl font-bold mb-4">
          집사 목소리 설정 <RecordVoiceOverIcon className="text-sm" />
        </label>
        {isTTSConfigLoading ? (
          <Spinner size="sm" />
        ) : (
          <div className="flex flex-col space-y-2">
            <NumberInput
              value={ttsConfig.pitch}
              onValueChange={handlePitchChange}
              label="음 높이"
              maxValue={500}
              minValue={-500}
              step={10}
              description="값을 높이면 목소리가 가늘어지고, 낮추면 굵어집니다"
              variant="bordered"
            />

            <NumberInput
              value={ttsConfig.treble}
              onValueChange={handleTrebleChange}
              label="고음 정도"
              maxValue={30}
              minValue={-30}
              step={1}
              description="높은 주파수를 강조하거나 줄입니다"
              variant="bordered"
            />

            <NumberInput
              value={ttsConfig.bass}
              onValueChange={handleBassChange}
              label="저음 정도"
              maxValue={30}
              minValue={-30}
              step={1}
              description="낮은 주파수를 강조하거나 줄입니다"
              variant="bordered"
            />

            <NumberInput
              value={ttsConfig.reverb}
              onValueChange={handleReverbChange}
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
              description="목소리 설정을 테스트할 문장을 입력하세요"
            />
            <Button color="primary" onPress={handleSpeechTest}>
              목소리 테스트
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
