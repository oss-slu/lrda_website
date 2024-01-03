const S3_PROXY_PREFIX = process.env.NEXT_PUBLIC_S3_PROXY_PREFIX;

export async function uploadAudio(file: File): Promise<string> {
  let data = new FormData();
  data.append("file", file);

  try {
    const response = await fetch(S3_PROXY_PREFIX + "uploadFile", {
      method: "POST",
      mode: "cors",
      body: data,
    });

    if (response.ok) {
      const location = response.headers.get("Location");
      console.log("Uploaded successfully, Location:", location);
      return location || "";
    } else {
      console.log("Server response body:", await response.text());
      return "error";
    }
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
}
