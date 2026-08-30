import VideoPlayer from "@/components/VideoPlayer";

export default function PlayerTestPage() {
  const videoUrl =
    process.env.TEST_VIDEO_URL ?? "";

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold">
          Video Player Test
        </h1>

        <VideoPlayer
          src={videoUrl}
        />
      </div>
    </main>
  );
}