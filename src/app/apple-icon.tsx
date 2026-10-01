import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #111b21 0%, #0b141a 100%)",
          borderRadius: 40,
          border: "4px solid #00a884",
        }}
      >
        <div
          style={{
            fontSize: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ❤️
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
