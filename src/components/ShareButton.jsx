import { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import { Download, Share2, Check } from "lucide-react";
import GlassButton from "./GlassButton";
import ResultCard from "./ResultCard";

export default function ShareButton({ result }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSave = useCallback(async () => {
    if (isCapturing || !result) return;

    setIsCapturing(true);
    try {
      const offscreen = document.createElement("div");
      offscreen.style.position = "fixed";
      offscreen.style.left = "-9999px";
      offscreen.style.top = "0";
      offscreen.style.zIndex = "-1";
      offscreen.style.pointerEvents = "none";
      document.body.appendChild(offscreen);

      const root = createRoot(offscreen);
      await new Promise((resolve) => {
        root.render(<ResultCard result={result} />);
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });

      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(offscreen, {
        backgroundColor: "#f5f3f0",
        scale: 2,
        useCORS: true,
        logging: false,
        width: 750,
        windowWidth: 750,
      });

      root.unmount();
      document.body.removeChild(offscreen);

      const link = document.createElement("a");
      link.download = `blur-persona-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to capture:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [result, isCapturing]);

  const handleShare = async () => {
    const text = "我刚刚在 Blur 测了自己的人格，结果很模糊但很有趣";

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Blur - 基本看不清的人格测试",
          text,
        });
      } catch {
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      <GlassButton onClick={handleSave} disabled={isCapturing}>
        <span className="flex items-center gap-2">
          {isCapturing ? (
            <>
              <div className="w-4 h-4 border-2 border-blur-text-muted border-t-transparent rounded-full animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Download size={16} />
              保存结果
            </>
          )}
        </span>
      </GlassButton>

      <GlassButton variant="secondary" onClick={handleShare}>
        <span className="flex items-center gap-2">
          {isCopied ? (
            <>
              <Check size={16} className="text-green-600" />
              已复制
            </>
          ) : (
            <>
              <Share2 size={16} />
              分享
            </>
          )}
        </span>
      </GlassButton>
    </div>
  );
}
