import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  const logoPath = path.join(process.cwd(), "public", "logo.jpg");
  const src = "data:image/jpeg;base64," + fs.readFileSync(logoPath).toString("base64");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FA0100", border: "8px solid #0B1B3D" }}>
        <img src={src} width={164} height={46} alt="ETERNAL CIVIL ACADEMY" />
      </div>
    ),
    { ...size }
  );
}
