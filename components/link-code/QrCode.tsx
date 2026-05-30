import QRCode from "qrcode";

interface Props {
  value: string;
  size?: number;
}

export async function QrCode({ value, size = 200 }: Props) {
  const svg = await QRCode.toString(value, {
    type: "svg",
    width: size,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return (
    <div
      aria-label={`QR code for ${value}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
