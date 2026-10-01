import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 120,
          border: "10px solid #00a884",
        }}
      >
        <div
          style={{
            fontSize: 270,
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
