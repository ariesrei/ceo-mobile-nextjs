export async function openRearCamera(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera is not available on this device.");
  }

  const tries: MediaStreamConstraints["video"][] = [
    {
      facingMode: { exact: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    { facingMode: "environment" },
    true,
  ];

  let last: unknown;
  for (const video of tries) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video,
      });
    } catch (err) {
      last = err;
    }
  }
  throw last instanceof Error
    ? last
    : new Error("Could not open the camera.");
}

export function stopCameraStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function frameToJpegFile(
  video: HTMLVideoElement,
  name = `parcel-${Date.now()}.jpg`
): Promise<File> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    return Promise.reject(new Error("Camera is not ready yet."));
  }

  const max = 1280;
  const scale = Math.min(1, max / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("Could not capture the photo."));
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not capture the photo."));
          return;
        }
        resolve(new File([blob], name, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.82
    );
  });
}
