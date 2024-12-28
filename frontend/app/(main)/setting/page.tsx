"use client";

import {
  Slider,
  Chip,
  Snippet,
  Input,
} from "@nextui-org/react";
import React, { useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

export default function DeviceSettings() {
  const [connectionStatus, setConnectionStatus] = useState<string>("Connected");
  const [volume, setVolume] = useState<number>(50);

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
            <span>home mini asd</span>
          </div>

          <div className="flex items-center">
            <label className="text-sm w-24 text-left pr-2">기기 IP: </label>
            <Snippet
              hideCopyButton
              hideSymbol
              size="sm"
              className="text-sm font-light"
            >
              192.168.7.1
            </Snippet>
          </div>

          <div className="flex items-center">
            <label className="text-sm w-24 text-left pr-2">연결 상태:</label>
            <Chip variant="flat" color="success" size="sm" radius="sm">
              {connectionStatus}
            </Chip>
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
              isRequired
              name="deviceName"
              placeholder="변경할 기기 이름을 입력하세요"
              type="text"
            />
          </div>
          <div className="flex items-center">
            <label className="text-sm w-24 text-left pr-4">기기 IP</label>
            <Input
              isRequired
              name="deviceIp"
              placeholder="변경할 기기 IP주소를 입력하세요"
              type="text"
            />
          </div>
        </div>

        <div className="mb-4 mt-4">
          <label className="text-sm w-24 text-left pr-4">명령어 볼륨:</label>
          <Slider
            className="mt-2"
            size="md"
            value={volume}
            onChange={setVolume}
            maxValue={100}
            minValue={1}
            step={1}
            startContent={<VolumeDownIcon />}
            endContent={<VolumeUpIcon />}
            showTooltip={true}
          />
        </div>
      </div>
    </div>
  );
}
