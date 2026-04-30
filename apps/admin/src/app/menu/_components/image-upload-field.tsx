"use client";

import { useState } from "react";
import { fetchAppPath } from "../../../lib/base-path";

export function ImageUploadField({
  value,
  onChange
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setMessage("正在上传图片...");

    try {
      const response = await fetchAppPath("/api/storage/menu-images", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as { error?: string; publicUrl?: string };
      if (!response.ok || !payload.publicUrl) {
        setMessage(payload.error ?? "上传失败");
        return;
      }

      onChange(payload.publicUrl);
      setMessage("图片上传成功。");
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="图片地址，可留空"
        style={inputStyle}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <label style={buttonStyle}>
          {uploading ? "上传中..." : "上传图片"}
          <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
        </label>
        {message ? <span style={{ color: "var(--muted)", fontSize: 14 }}>{message}</span> : null}
      </div>
      {value ? (
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--border)"
          }}
        >
          <img
            src={value}
            alt="Menu item"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : null}
    </div>
  );
}

const inputStyle = {
  borderRadius: 14,
  border: "1px solid var(--border)",
  padding: "10px 12px",
  background: "rgba(255,255,255,0.86)"
} satisfies React.CSSProperties;

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "10px 14px",
  background: "var(--brand)",
  color: "#fff",
  cursor: "pointer"
} satisfies React.CSSProperties;
