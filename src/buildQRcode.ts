import QRCodeStyling, { Options } from "./qrCodeStyling";

export function createQRCode(
  url: string,
  size = 512,
  background = "black",
  color = "yellow",
): QRCodeStyling {
  return new QRCodeStyling(createQROptions(url, size, background, color));
}
function createQROptions(
  url: string | URL,
  size = 512,
  background = "black",
  color = "yellow",
): Options {
  return {
    width: size,
    height: size,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
    dotsOptions: {
      color: "#4267b2",
      type: "rounded"
    },
    backgroundOptions:{
      color: background
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 20
    }
  };
}
